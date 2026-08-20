import json
from datetime import datetime, date
from services.spaced_repetition import get_review_needed_techniques

def get_next_single_step(cursor) -> dict:
    """
    Returns the single highest-priority next actionable recommendation
    answering 'Co powinienem zrobić TERAZ?'
    """
    # 1. Check if there are critical spaced repetition review items
    reviews = get_review_needed_techniques(cursor, limit=1)
    if reviews:
        item = reviews[0]
        return {
            "type": "review",
            "action_text": f"Przećwicz {item['name']} przez 10 minut",
            "technique_id": item["id"],
            "technique_name": item["name"],
            "category": item["category"],
            "target_reps": 40,
            "duration_minutes": 10,
            "reason": item["primary_reason"],
            "focus_tip": item.get("problems_summary") or "Skup się na powolnych, bezbłędnych powtórzeniach."
        }

    # 2. Check in-progress techniques closest to reaching Master level (70-79%)
    cursor.execute("""
        SELECT id, name, category, mastery_percentage, difficulty 
        FROM techniques 
        WHERE status = 'Practicing' AND mastery_percentage >= 50
        ORDER BY mastery_percentage DESC 
        LIMIT 1
    """)
    in_prog = cursor.fetchone()
    if in_prog:
        t = dict(in_prog)
        return {
            "type": "mastery_push",
            "action_text": f"Opanuj {t['name']} na poziomie Master",
            "technique_id": t["id"],
            "technique_name": t["name"],
            "category": t["category"],
            "target_reps": 50,
            "duration_minutes": 15,
            "reason": f"Masz już {t['mastery_percentage']}% opanowania — dokończ wymagania!",
            "focus_tip": "Wykonaj serię 50 czystych powtórzeń z zachowaniem zrelaksowanego chwytu."
        }

    # 3. Check next unlocked technique ready to learn
    cursor.execute("""
        SELECT id, name, category, difficulty 
        FROM techniques 
        WHERE status = 'Unlocked' AND mastery_percentage = 0
        ORDER BY skill_tree_level ASC, id ASC 
        LIMIT 1
    """)
    unlocked = cursor.fetchone()
    if unlocked:
        t = dict(unlocked)
        return {
            "type": "new_skill",
            "action_text": f"Rozpocznij naukę nowego chwytu: {t['name']}",
            "technique_id": t["id"],
            "technique_name": t["name"],
            "category": t["category"],
            "target_reps": 30,
            "duration_minutes": 15,
            "reason": "Odblokowałeś wszystkie wymagane podstawy",
            "focus_tip": "Zapoznaj się z ułożeniem dłoni i wykonaj pierwsze powolne próby."
        }

    # Default fallback
    return {
        "type": "general",
        "action_text": "Wykonaj 15-minutowy trening czucia kart",
        "technique_id": 1,
        "technique_name": "Mechanics Grip",
        "category": "Grips",
        "target_reps": 50,
        "duration_minutes": 15,
        "reason": "Podtrzymanie nawyku i pamięci mięśniowej",
        "focus_tip": "Zrelaksowane dłonie, naturalny kontakt wzrokowy."
    }


def generate_daily_training_plan(cursor, duration_minutes: int = 20) -> dict:
    """
    Generates a deterministic daily training workout tailored for 5, 10, 15, 20, 30, 45, or 60 minutes
    based on spaced repetition, active weaknesses, and track balance.
    """
    valid_durations = [5, 10, 15, 20, 30, 45, 60]
    if duration_minutes not in valid_durations:
        duration_minutes = 20

    # Fetch user profile preferences
    cursor.execute("SELECT level, focus_track FROM user_profile WHERE id = 1")
    prof = cursor.fetchone()
    user_level = prof[0] if prof else 1
    focus_track = prof[1] if prof else 'all'

    # Fetch candidate techniques
    cursor.execute("""
        SELECT t.id, t.name, t.track, t.category, t.difficulty, t.user_level, 
               t.mastery_percentage, t.status, t.training_minutes, t.sessions_count, 
               t.total_reps_count, t.last_trained_at, t.notes, t.description,
               COUNT(p.id) as unresolved_problems_count,
               GROUP_CONCAT(p.problem_text, ' | ') as problems_summary
        FROM techniques t
        LEFT JOIN technique_problems p ON t.id = p.technique_id AND p.is_resolved = 0
        WHERE t.status != 'Locked'
        GROUP BY t.id
    """)
    techniques = [dict(r) for r in cursor.fetchall()]

    if not techniques:
        return {"total_minutes": duration_minutes, "plan_items": [], "summary": "Brak odblokowanych technik."}

    today = date.today()

    # Score each candidate
    scored = []
    for tech in techniques:
        score = 0
        reasons = []

        # Track matching
        if focus_track != 'all' and tech["track"] == focus_track:
            score += 25

        # 1. Weakness score
        probs = tech.get("unresolved_problems_count") or 0
        if probs > 0:
            score += 35 + probs * 10
            reasons.append(f"Eliminacja {probs} błędu")

        # 2. Forgetting score (elapsed days)
        last_t = tech.get("last_trained_at")
        if last_t:
            try:
                days = (today - datetime.strptime(last_t[:10], "%Y-%m-%d").date()).days
                score += min(45, days * 3)
                if days >= 4:
                    reasons.append(f"Powtórka (niećwiczone {days} dni)")
            except Exception:
                score += 15
        else:
            score += 30
            reasons.append("Nowa technika do wyuczenia")

        # 3. Learning phase priority (Practicing / Started vs Mastered)
        mastery = tech.get("mastery_percentage") or 0
        if 20 <= mastery <= 75:
            score += 40
            reasons.append(f"Intensywny trening ({mastery}%)")
        elif mastery == 0:
            score += 20
        else: # 80%+
            score += 10
            reasons.append("Podtrzymanie mistrzostwa")

        scored.append({
            **tech,
            "priority_score": score,
            "reasons": reasons
        })

    scored.sort(key=lambda x: x["priority_score"], reverse=True)

    # Time distribution slots based on requested minutes
    if duration_minutes == 5:
        distribution = [5]
    elif duration_minutes == 10:
        distribution = [4, 6]
    elif duration_minutes == 15:
        distribution = [4, 7, 4]
    elif duration_minutes == 20:
        distribution = [4, 9, 7]
    elif duration_minutes == 30:
        distribution = [5, 12, 8, 5]
    elif duration_minutes == 45:
        distribution = [6, 15, 14, 10]
    else: # 60
        distribution = [8, 18, 16, 11, 7]

    plan_items = []
    used_ids = set()

    # Slot 1: Warm-up (Grips / Fans / Flourishes / Cuts)
    warmups = [t for t in scored if t["category"] in ["Grips", "Fans", "Flourishes", "False Shuffles", "Cuts"] and t["id"] not in used_ids]
    warmup_item = warmups[0] if warmups else scored[0]
    used_ids.add(warmup_item["id"])

    plan_items.append({
        "order": 1,
        "phase": "Rozgrzewka i czucie kart",
        "technique_id": warmup_item["id"],
        "technique_name": warmup_item["name"],
        "track": warmup_item.get("track", "magic"),
        "category": warmup_item["category"],
        "difficulty": warmup_item["difficulty"],
        "mastery_percentage": warmup_item.get("mastery_percentage", 0),
        "duration_minutes": distribution[0],
        "target_reps": distribution[0] * 8,
        "focus_note": "Zrelaksowane dłonie, spokojny rytm, rozgrzej stawy i czucie krawędzi.",
        "reason": "Przygotowanie dłoni i pamięci mięśniowej"
    })

    # Remaining Core & Refinement Slots
    pool = [t for t in scored if t["id"] not in used_ids]
    for i in range(1, len(distribution)):
        alloc_time = distribution[i]
        if not pool:
            break
        chosen = pool.pop(0)
        used_ids.add(chosen["id"])

        if i == 1:
            phase_title = "Główny chwyt — eliminacja błędów" if (chosen.get("unresolved_problems_count") or 0) > 0 else "Główny blok techniczny"
        elif i == len(distribution) - 1:
            phase_title = "Integracja & Płynność wykonania"
        else:
            phase_title = "Precyzja i automatyzacja"

        focus_tip = chosen.get("problems_summary") or chosen.get("notes") or chosen.get("description") or "Powolne, perfekcyjne powtórzenia."

        plan_items.append({
            "order": i + 1,
            "phase": phase_title,
            "technique_id": chosen["id"],
            "technique_name": chosen["name"],
            "track": chosen.get("track", "magic"),
            "category": chosen["category"],
            "difficulty": chosen["difficulty"],
            "mastery_percentage": chosen.get("mastery_percentage", 0),
            "duration_minutes": alloc_time,
            "target_reps": alloc_time * 6,
            "focus_note": focus_tip[:120],
            "reason": ", ".join(chosen["reasons"][:2]) if chosen["reasons"] else "Kluczowa technika w toku opanowywania"
        })

    return {
        "total_minutes": duration_minutes,
        "exercises_count": len(plan_items),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "plan_items": plan_items
    }
