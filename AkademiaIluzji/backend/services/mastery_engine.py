import json
from datetime import datetime, date

def compute_technique_mastery(
    training_minutes: int,
    sessions_count: int,
    total_reps: int,
    avg_score: float,
    unresolved_problems_count: int,
    last_trained_at_str: str,
    master_reqs: dict,
    current_status: str = "Locked"
) -> tuple[int, str, dict]:
    """
    Deterministically computes mastery percentage (0-100%) and status based on:
    - Repetitions milestones (max 30 pts)
    - Practice time & sessions (max 25 pts)
    - Performance self-ratings (max 25 pts)
    - Master requirements checklist (max 20 pts)
    - Penalty for unresolved problems (up to -15 pts)
    - Natural recency decay if inactive for >14 days (up to -20 pts)
    """
    # 1. Repetitions (max 30 pts)
    reps_pts = min(30, (total_reps / 100) * 25 + (5 if total_reps >= 150 else 0))

    # 2. Time & Sessions (max 25 pts)
    time_pts = min(15, (training_minutes / 60) * 15)
    sessions_pts = min(10, sessions_count * 2)
    practice_pts = time_pts + sessions_pts

    # 3. Average Score (max 25 pts)
    score_val = avg_score if avg_score > 0 else 5.0
    rating_pts = min(25, (score_val / 10.0) * 25)

    # 4. Requirements Checklist (max 20 pts)
    req_pts = 0
    updated_reqs = dict(master_reqs or {})

    # Auto-verify checklist items based on raw stats
    if total_reps >= 50:
        updated_reqs["reps_50"] = True
    if total_reps >= 100:
        updated_reqs["reps_100"] = True
    if avg_score >= 8.0 and sessions_count >= 2:
        updated_reqs["score_8"] = True
    if sessions_count >= 1:
        updated_reqs["basic_trained"] = True

    if updated_reqs.get("lesson_completed"): req_pts += 3
    if updated_reqs.get("basic_trained"): req_pts += 3
    if updated_reqs.get("reps_50"): req_pts += 3
    if updated_reqs.get("reps_100"): req_pts += 4
    if updated_reqs.get("used_in_routine"): req_pts += 3
    if updated_reqs.get("score_8"): req_pts += 2
    if updated_reqs.get("test_passed"): req_pts += 2

    # 5. Penalties
    problems_penalty = min(15, unresolved_problems_count * 5)

    # 6. Recency Decay
    decay_pts = 0
    if last_trained_at_str:
        try:
            last_date = datetime.strptime(last_trained_at_str[:10], "%Y-%m-%d").date()
            days_since = (date.today() - last_date).days
            if days_since > 14:
                decay_pts = min(20, (days_since - 14) * 1.5)
        except Exception:
            pass

    raw_total = reps_pts + practice_pts + rating_pts + req_pts - problems_penalty - decay_pts
    final_mastery = max(0, min(100, round(raw_total)))

    # Determine status
    if current_status == "Locked" and final_mastery == 0 and sessions_count == 0:
        new_status = "Locked"
    elif final_mastery >= 90 and all(updated_reqs.get(k) for k in ["reps_100", "score_8"]):
        new_status = "Mastered+"
    elif final_mastery >= 75 and updated_reqs.get("reps_50"):
        new_status = "Mastered"
    elif final_mastery >= 25 or sessions_count >= 2:
        new_status = "Practicing"
    elif sessions_count >= 1 or final_mastery > 0:
        new_status = "Started"
    else:
        new_status = "Unlocked" if current_status != "Locked" else "Locked"

    return final_mastery, new_status, updated_reqs


def unlock_eligible_techniques(cursor):
    """
    Checks all locked techniques. If all required prerequisite techniques
    are Mastered or have mastery >= 65%, unlocks them.
    """
    cursor.execute("SELECT id, name, mastery_percentage, status FROM techniques")
    all_techs = {r["name"]: dict(r) for r in cursor.fetchall()}

    cursor.execute("SELECT id, name, prerequisites_json, status FROM techniques WHERE status = 'Locked'")
    locked_techs = cursor.fetchall()

    unlocked_names = []
    for row in locked_techs:
        t_id = row["id"]
        t_name = row["name"]
        try:
            prereqs = json.loads(row["prerequisites_json"] or "[]")
        except Exception:
            prereqs = []

        if not prereqs:
            # No prerequisites -> unlock
            cursor.execute("UPDATE techniques SET status = 'Unlocked' WHERE id = ?", (t_id,))
            unlocked_names.append(t_name)
            continue

        # Check if all prereqs are sufficiently learned
        all_met = True
        for p_name in prereqs:
            parent = all_techs.get(p_name)
            if not parent:
                continue
            if parent["status"] not in ["Mastered", "Mastered+"] and parent["mastery_percentage"] < 65:
                all_met = False
                break

        if all_met:
            cursor.execute("UPDATE techniques SET status = 'Unlocked' WHERE id = ?", (t_id,))
            unlocked_names.append(t_name)

    return unlocked_names
