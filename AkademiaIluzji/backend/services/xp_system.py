from datetime import datetime, date, timedelta

RANK_TIERS = [
    {"min_level": 1, "max_level": 5, "tier": "Beginner", "name": "Początkujący (Beginner)"},
    {"min_level": 6, "max_level": 10, "tier": "Intermediate", "name": "Średniozaawansowany (Intermediate)"},
    {"min_level": 11, "max_level": 15, "tier": "Advanced", "name": "Zaawansowany (Advanced)"},
    {"min_level": 16, "max_level": 20, "tier": "Expert", "name": "Ekspert (Expert / Master)"}
]

LEVEL_THRESHOLDS = [
    # Level 1-5 (Beginner)
    {"level": 1, "min_xp": 0, "title": "Adept Iluzji", "tier": "Beginner"},
    {"level": 2, "min_xp": 80, "title": "Nowicjusz Kart", "tier": "Beginner"},
    {"level": 3, "min_xp": 200, "title": "Praktykant Chwytów", "tier": "Beginner"},
    {"level": 4, "min_xp": 380, "title": "Karciarz", "tier": "Beginner"},
    {"level": 5, "min_xp": 620, "title": "Uczeń Sleightów", "tier": "Beginner"},

    # Level 6-10 (Intermediate)
    {"level": 6, "min_xp": 950, "title": "Manipulator Kart", "tier": "Intermediate"},
    {"level": 7, "min_xp": 1380, "title": "Wirtuoz Chwytów", "tier": "Intermediate"},
    {"level": 8, "min_xp": 1920, "title": "Karciarz Pokazowy", "tier": "Intermediate"},
    {"level": 9, "min_xp": 2600, "title": "Mistrz Kontroli", "tier": "Intermediate"},
    {"level": 10, "min_xp": 3400, "title": "Arcymistrz Sleightów", "tier": "Intermediate"},

    # Level 11-15 (Advanced)
    {"level": 11, "min_xp": 4350, "title": "Iluzjonista Sceniczny", "tier": "Advanced"},
    {"level": 12, "min_xp": 5450, "title": "Mistrz Iluzji Karcianej", "tier": "Advanced"},
    {"level": 13, "min_xp": 6700, "title": "Władca Percepcji", "tier": "Advanced"},
    {"level": 14, "min_xp": 8100, "title": "Magus Kart", "tier": "Advanced"},
    {"level": 15, "min_xp": 9700, "title": "Arcymistrz Pokazu", "tier": "Advanced"},

    # Level 16-20 (Expert)
    {"level": 16, "min_xp": 11500, "title": "Wielki Magus", "tier": "Expert"},
    {"level": 17, "min_xp": 13600, "title": "Legenda Kart", "tier": "Expert"},
    {"level": 18, "min_xp": 16000, "title": "Wirtuoz Vernon's Way", "tier": "Expert"},
    {"level": 19, "min_xp": 18800, "title": "Wielki Mistrz Iluzji", "tier": "Expert"},
    {"level": 20, "min_xp": 22000, "title": "Legenda Card Magic Coach", "tier": "Expert"}
]

XP_REWARDS = {
    "START_TRAINING": 5,
    "FINISH_TRAINING_BASE": 20,
    "REPS_BONUS_PER_50": 5,
    "MINUTES_BONUS_PER_10": 5,
    "TECHNIQUE_STARTED": 15,
    "TECHNIQUE_MASTERY_MILESTONE": 35,
    "TECHNIQUE_MASTERED": 100,
    "CREATE_ROUTINE": 25,
    "PERFORM_ROUTINE": 40,
    "RESOLVE_PROBLEM": 15,
    "PASS_QUIZ": 20,
    "PERFECT_QUIZ": 35,
    "ACHIEVEMENT_UNLOCKED": 50,
    "DAILY_PLAN_COMPLETED": 25
}

def get_level_info(total_xp: int) -> dict:
    current_tier = LEVEL_THRESHOLDS[0]
    next_tier = LEVEL_THRESHOLDS[1]

    for i in range(len(LEVEL_THRESHOLDS)):
        if total_xp >= LEVEL_THRESHOLDS[i]["min_xp"]:
            current_tier = LEVEL_THRESHOLDS[i]
            if i + 1 < len(LEVEL_THRESHOLDS):
                next_tier = LEVEL_THRESHOLDS[i + 1]
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
        "rank_tier": current_tier["tier"],
        "total_xp": total_xp,
        "current_min_xp": current_tier["min_xp"],
        "next_min_xp": next_tier["min_xp"] if next_tier else None,
        "xp_needed": xp_needed,
        "progress_percent": progress_pct
    }

def calculate_track_level(track_xp: int) -> dict:
    level = max(1, min(10, 1 + track_xp // 300))
    progress = min(100, round(((track_xp % 300) / 300) * 100, 1))
    return {
        "level": level,
        "xp": track_xp,
        "progress_percent": progress
    }

def update_user_streak(cursor, user_id: int, today_str: str = None) -> tuple[int, int, str]:
    """
    Returns (new_streak, best_streak, today_str)
    """
    if not today_str:
        today = date.today()
    else:
        today = datetime.strptime(today_str[:10], "%Y-%m-%d").date()

    cursor.execute("SELECT streak, best_streak, last_trained_date FROM user_profile WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        return (1, 1, today.isoformat())

    current_streak = row[0] or 0
    best_streak = row[1] or 0
    last_date_str = row[2]

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
                # Trained yesterday, increment streak
                new_streak = current_streak + 1
            else:
                # Broken streak
                new_streak = 1
        except Exception:
            new_streak = 1

    new_best_streak = max(best_streak, new_streak)
    return (new_streak, new_best_streak, today.isoformat())
