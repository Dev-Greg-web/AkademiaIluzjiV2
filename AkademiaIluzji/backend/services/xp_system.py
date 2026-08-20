from datetime import datetime, date, timedelta

LEVEL_TIERS = [
    {"level": 1, "min_xp": 0, "title": "Adept Iluzji"},
    {"level": 2, "min_xp": 100, "title": "Uczeń Karciarza"},
    {"level": 3, "min_xp": 250, "title": "Praktykant Sleightów"},
    {"level": 4, "min_xp": 500, "title": "Karciarz"},
    {"level": 5, "min_xp": 850, "title": "Wirtuoz Chwytów"},
    {"level": 6, "min_xp": 1300, "title": "Mistrz Iluzji"},
    {"level": 7, "min_xp": 1900, "title": "Iluzjonista Pokazowy"},
    {"level": 8, "min_xp": 2700, "title": "Arcymistrz Talii"},
    {"level": 9, "min_xp": 3700, "title": "Wielki Magus"},
    {"level": 10, "min_xp": 5000, "title": "Legenda Iluzji"}
]

XP_REWARDS = {
    "START_TRAINING": 5,
    "FINISH_TRAINING_BASE": 20,
    "REPS_BONUS_PER_50": 5,
    "MINUTES_BONUS_PER_10": 5,
    "TECHNIQUE_LEVEL_UP": 50,
    "TECHNIQUE_MASTERED": 100, # when reaching 8/10 or 10/10
    "CREATE_ROUTINE": 25,
    "RESOLVE_PROBLEM": 15,
    "ADD_NOTE": 10
}

def get_level_info(total_xp: int) -> dict:
    current_tier = LEVEL_TIERS[0]
    next_tier = LEVEL_TIERS[1]

    for i in range(len(LEVEL_TIERS)):
        if total_xp >= LEVEL_TIERS[i]["min_xp"]:
            current_tier = LEVEL_TIERS[i]
            if i + 1 < len(LEVEL_TIERS):
                next_tier = LEVEL_TIERS[i + 1]
            else:
                next_tier = None
        else:
            break

    if next_tier:
        xp_in_level = total_xp - current_tier["min_xp"]
        xp_for_next = next_tier["min_xp"] - current_tier["min_xp"]
        progress_pct = min(100, max(0, round((xp_in_level / xp_for_next) * 100, 1)))
        xp_needed = max(0, next_tier["min_xp"] - total_xp)
    else:
        progress_pct = 100
        xp_needed = 0

    return {
        "level": current_tier["level"],
        "title": current_tier["title"],
        "total_xp": total_xp,
        "current_min_xp": current_tier["min_xp"],
        "next_min_xp": next_tier["min_xp"] if next_tier else None,
        "xp_needed": xp_needed,
        "progress_percent": progress_pct
    }

def calculate_status(user_level: int) -> str:
    if user_level <= 0:
        return "Nie rozpoczęto"
    elif 1 <= user_level <= 7:
        return "W trakcie"
    else:
        return "Opanowane"

def update_user_streak(cursor, user_id: int, today_str: str = None) -> tuple[int, str]:
    if not today_str:
        today = date.today()
    else:
        today = datetime.strptime(today_str[:10], "%Y-%m-%d").date()

    cursor.execute("SELECT streak, last_trained_date FROM user_profile WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        return (1, today.isoformat())

    current_streak = row[0] or 0
    last_date_str = row[1]

    if not last_date_str:
        new_streak = 1
    else:
        try:
            last_date = datetime.strptime(last_date_str[:10], "%Y-%m-%d").date()
            diff_days = (today - last_date).days

            if diff_days == 0:
                # Already trained today, keep streak
                new_streak = max(1, current_streak)
            elif diff_days == 1:
                # Trained yesterday, increase streak
                new_streak = current_streak + 1
            else:
                # Broken streak
                new_streak = 1
        except Exception:
            new_streak = 1

    return (new_streak, today.isoformat())
