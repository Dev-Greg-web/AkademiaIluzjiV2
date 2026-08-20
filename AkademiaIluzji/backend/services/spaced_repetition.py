from datetime import datetime, date, timedelta

def get_review_needed_techniques(cursor, limit: int = 5) -> list[dict]:
    """
    Identifies techniques requiring review (Spaced Repetition):
    - Inactive for >= 5 days while still in learning phase
    - Low mastery (< 70%) despite multiple previous sessions
    - Active unresolved problems recorded
    """
    today = date.today()

    cursor.execute("""
        SELECT t.id, t.name, t.track, t.category, t.difficulty, t.user_level, 
               t.mastery_percentage, t.status, t.training_minutes, t.sessions_count, 
               t.last_trained_at, t.avg_score,
               COUNT(p.id) as unresolved_problems_count,
               GROUP_CONCAT(p.problem_text, ' | ') as problems_summary
        FROM techniques t
        LEFT JOIN technique_problems p ON t.id = p.technique_id AND p.is_resolved = 0
        WHERE t.status IN ('Started', 'Practicing', 'Unlocked', 'Mastered')
        GROUP BY t.id
    """)
    techniques = [dict(row) for row in cursor.fetchall()]

    review_items = []

    for t in techniques:
        reasons = []
        urgency_score = 0

        # Check days elapsed since last session
        last_trained = t["last_trained_at"]
        days_diff = None
        if last_trained:
            try:
                last_d = datetime.strptime(last_trained[:10], "%Y-%m-%d").date()
                days_diff = (today - last_d).days
            except Exception:
                days_diff = 10
        else:
            days_diff = 14

        # 1. Elapsed time factor (Forgetting curve)
        if days_diff >= 7:
            urgency_score += min(50, days_diff * 4)
            reasons.append(f"Ostatni trening {days_diff} dni temu")
        elif days_diff >= 4:
            urgency_score += 20
            reasons.append(f"Niećwiczone od {days_diff} dni")

        # 2. Unresolved problem factor
        prob_count = t.get("unresolved_problems_count") or 0
        if prob_count > 0:
            urgency_score += 35 + (prob_count * 10)
            reasons.append(f"Zanotowane problemy ({prob_count})")

        # 3. Mastery status gap
        mastery = t.get("mastery_percentage") or 0
        if 1 <= mastery < 60:
            urgency_score += 30 + (60 - mastery)
            reasons.append(f"Niskie opanowanie ({mastery}%)")
        elif 60 <= mastery < 80:
            urgency_score += 15
            reasons.append(f"W toku doskonalenia ({mastery}%)")

        # 4. Low average score factor
        avg_sc = t.get("avg_score") or 0
        if 0 < avg_sc < 7.0:
            urgency_score += 25
            reasons.append(f"Średnia ocena z sesji: {round(avg_sc, 1)}/10")

        if urgency_score >= 30:
            review_items.append({
                **t,
                "urgency_score": urgency_score,
                "days_since_trained": days_diff,
                "review_reasons": reasons,
                "primary_reason": reasons[0] if reasons else "Planowa powtórka pamięci mięśniowej"
            })

    # Sort descending by urgency score
    review_items.sort(key=lambda x: x["urgency_score"], reverse=True)
    return review_items[:limit]
