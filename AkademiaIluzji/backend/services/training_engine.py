import random
from datetime import datetime, date

def generate_training_plan(cursor, duration_minutes: int = 30) -> dict:
    """
    Generates a structured, balanced training plan for 15, 30, 45, or 60 minutes
    based on mastery level, unresolved problems, last trained date, and category balance.
    """
    valid_durations = [15, 30, 45, 60]
    if duration_minutes not in valid_durations:
        duration_minutes = 30

    # Fetch user profile
    cursor.execute("SELECT level FROM user_profile WHERE id = 1")
    profile_row = cursor.fetchone()
    user_level = profile_row[0] if profile_row else 1

    # Fetch all techniques with their problems count
    cursor.execute("""
        SELECT t.id, t.name, t.category, t.difficulty, t.user_level, t.status, 
               t.training_minutes, t.sessions_count, t.last_trained_at, t.description,
               COUNT(p.id) as unresolved_problems_count,
               GROUP_CONCAT(p.problem_text, ' | ') as problems_summary
        FROM techniques t
        LEFT JOIN technique_problems p ON t.id = p.technique_id AND p.is_resolved = 0
        GROUP BY t.id
    """)
    techniques = [dict(row) for row in cursor.fetchall()]

    if not techniques:
        return {"total_minutes": duration_minutes, "plan_items": [], "summary": "Brak technik w bazie."}

    today = date.today()

    # Calculate scoring weight for each technique
    scored_techs = []
    for tech in techniques:
        score = 0
        reasons = []

        # 1. Level priority (lower level = higher priority, especially 1-7 in progress)
        lvl = tech["user_level"]
        if 1 <= lvl <= 7:
            score += 45 + (8 - lvl) * 5
            reasons.append("W trakcie nauki")
        elif lvl == 0:
            score += 25
            reasons.append("Nowa technika do rozpoczęcia")
        else: # 8-10 opanowane
            score += 10
            reasons.append("Podtrzymanie nawyku")

        # 2. Unresolved problems boost
        prob_count = tech["unresolved_problems_count"] or 0
        if prob_count > 0:
            score += 35 + (prob_count * 10)
            reasons.append(f"Zanotowane problemy ({prob_count})")

        # 3. Recency (days since last trained)
        last_trained = tech["last_trained_at"]
        if last_trained:
            try:
                last_d = datetime.strptime(last_trained[:10], "%Y-%m-%d").date()
                days_diff = (today - last_d).days
                score += min(40, days_diff * 3)
                if days_diff >= 3:
                    reasons.append(f"Niećwiczone od {days_diff} dni")
            except Exception:
                score += 20
        else:
            score += 30
            reasons.append("Brak wcześniejszych sesji")

        # 4. Difficulty weighting matching user level
        diff = tech["difficulty"]
        if user_level <= 2 and diff == "Beginner":
            score += 20
        elif 3 <= user_level <= 6 and diff in ["Beginner", "Intermediate"]:
            score += 20
        elif user_level >= 7:
            score += 25 if diff in ["Intermediate", "Advanced"] else 10

        scored_techs.append({
            **tech,
            "priority_score": score,
            "reasons": reasons
        })

    # Sort descending by priority score
    scored_techs.sort(key=lambda x: x["priority_score"], reverse=True)

    # Divide available time into slots
    # 15 min: 2-3 exercises (e.g. 5m warmup/fundament, 7m core sleight, 3m check)
    # 30 min: 3-4 exercises (e.g. 5m warmup, 12m core 1, 8m core 2, 5m routine/performance)
    # 45 min: 4-5 exercises (e.g. 7m warmup, 15m core 1, 13m core 2, 10m combo/performance)
    # 60 min: 5 exercises (e.g. 10m warmup, 18m core 1, 15m core 2, 10m core 3, 7m performance)

    if duration_minutes == 15:
        time_distribution = [5, 7, 3]
        target_count = 3
    elif duration_minutes == 30:
        time_distribution = [6, 12, 7, 5]
        target_count = 4
    elif duration_minutes == 45:
        time_distribution = [7, 15, 13, 10]
        target_count = 4
    else: # 60
        time_distribution = [10, 18, 15, 10, 7]
        target_count = 5

    selected_plan = []
    used_ids = set()

    # Slot 1: Warmup (preferably category Fundamenty, Cardistry, Flourishes)
    warmup_candidates = [t for t in scored_techs if t["category"] in ["Fundamenty", "Cardistry", "Flourishes"] and t["id"] not in used_ids]
    if warmup_candidates:
        warmup_tech = warmup_candidates[0]
    else:
        warmup_tech = scored_techs[0]
    
    used_ids.add(warmup_tech["id"])
    selected_plan.append({
        "order": 1,
        "phase": "Rozgrzewka i czucie kart",
        "technique_id": warmup_tech["id"],
        "technique_name": warmup_tech["name"],
        "category": warmup_tech["category"],
        "difficulty": warmup_tech["difficulty"],
        "user_level": warmup_tech["user_level"],
        "duration_minutes": time_distribution[0],
        "target_reps": time_distribution[0] * 8, # ~8 reps per min
        "focus_note": f"Spokojne, rytmiczne ruchy. Rozgrzej dłonie i palce. {warmup_tech.get('notes', '')[:100]}",
        "reason": "Rozgrzewka dłoni & fundamenty"
    })

    # Core slots (Highest priority Sleights, Controls, Forces, Counts)
    core_candidates = [t for t in scored_techs if t["id"] not in used_ids]
    
    for i in range(1, len(time_distribution)):
        alloc_time = time_distribution[i]
        if not core_candidates:
            break
        
        chosen = core_candidates.pop(0)
        used_ids.add(chosen["id"])

        phase_title = "Główny chwyt — eliminacja błędów" if (chosen.get("unresolved_problems_count") or 0) > 0 else (
            "Główny trening techniczny" if i == 1 else "Precyzja i automatyzacja"
        )
        if i == len(time_distribution) - 1:
            phase_title = "Płynność i integracja (Performance)"

        problem_text = chosen.get("problems_summary") or ""
        focus_note = f"Uwaga na problem: {problem_text}" if problem_text else (
            chosen.get("notes") or chosen.get("description") or "Skup się na powolnych, perfekcyjnych powtórzeniach."
        )

        selected_plan.append({
            "order": i + 1,
            "phase": phase_title,
            "technique_id": chosen["id"],
            "technique_name": chosen["name"],
            "category": chosen["category"],
            "difficulty": chosen["difficulty"],
            "user_level": chosen["user_level"],
            "duration_minutes": alloc_time,
            "target_reps": alloc_time * 6,
            "focus_note": focus_note,
            "reason": ", ".join(chosen["reasons"][:2])
        })

    return {
        "total_minutes": duration_minutes,
        "exercises_count": len(selected_plan),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "plan_items": selected_plan
    }
