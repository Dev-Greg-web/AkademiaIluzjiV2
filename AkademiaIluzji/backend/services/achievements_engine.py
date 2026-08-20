from datetime import datetime
from services.xp_system import get_level_info

def evaluate_achievements(cursor) -> list[dict]:
    """
    Evaluates all achievement conditions against the user's actual progress.
    Unlocks achievements and awards XP if completed.
    Returns a list of newly unlocked achievements.
    """
    # Fetch user stats
    cursor.execute("SELECT total_sessions_count, total_training_minutes, streak FROM user_profile WHERE id = 1")
    prof = cursor.fetchone()
    total_sessions = prof[0] if prof else 0
    total_minutes = prof[1] if prof else 0
    streak = prof[2] if prof else 0

    # Fetch technique stats
    cursor.execute("SELECT COUNT(*) FROM techniques WHERE status IN ('Started', 'Practicing', 'Mastered', 'Mastered+')")
    started_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM techniques WHERE status IN ('Mastered', 'Mastered+')")
    mastered_count = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(total_reps_count) FROM techniques")
    total_reps = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM techniques WHERE track = 'cardistry' AND status IN ('Mastered', 'Mastered+')")
    cardistry_mastered = cursor.fetchone()[0]

    # Specific technique checks
    cursor.execute("SELECT name FROM techniques WHERE status IN ('Mastered', 'Mastered+')")
    mastered_names = {r[0] for r in cursor.fetchall()}

    has_master_controls = all(name in mastered_names for name in ["Double Undercut", "Basic Control", "Multiple Shift"])
    has_master_forces = all(name in mastered_names for name in ["Classic Force", "Riffle Force"])

    # Performance sessions count
    cursor.execute("SELECT COUNT(*) FROM performance_sessions")
    perf_count = cursor.fetchone()[0]

    # Routines count
    cursor.execute("SELECT COUNT(*) FROM routines")
    routines_count = cursor.fetchone()[0]

    # Quizzes passed perfectly
    cursor.execute("SELECT COUNT(*) FROM quiz_attempts WHERE score = total_questions AND total_questions > 0")
    perfect_quizzes = cursor.fetchone()[0]

    # Fetch all achievements
    cursor.execute("""
        SELECT a.id, a.code, a.title, a.description, a.icon, a.xp_reward, a.required_count,
               ua.unlocked, ua.current_progress
        FROM achievements a
        JOIN user_achievements ua ON a.id = ua.achievement_id
    """)
    achievements = cursor.fetchall()

    newly_unlocked = []

    for row in achievements:
        a_id = row["id"]
        code = row["code"]
        req_count = row["required_count"]
        is_unlocked = row["unlocked"]
        xp_reward = row["xp_reward"]

        current_val = 0

        if code == "FIRST_TRICK":
            current_val = 1 if routines_count >= 1 else 0
        elif code == "FIRST_TRAINING":
            current_val = 1 if total_sessions >= 1 else 0
        elif code == "TECHNIQUES_10":
            current_val = started_count
        elif code == "TECHNIQUES_25":
            current_val = started_count
        elif code == "STREAK_7":
            current_val = streak
        elif code == "STREAK_30":
            current_val = streak
        elif code == "SESSIONS_100":
            current_val = total_sessions
        elif code == "MINUTES_1000":
            current_val = total_minutes
        elif code == "MASTER_10":
            current_val = mastered_count
        elif code == "MASTER_CONTROLS":
            current_val = 3 if has_master_controls else (1 if "Double Undercut" in mastered_names else 0)
        elif code == "MASTER_FORCES":
            current_val = 2 if has_master_forces else (1 if ("Classic Force" in mastered_names or "Riffle Force" in mastered_names) else 0)
        elif code == "FIRST_CARDISTRY":
            current_val = cardistry_mastered
        elif code == "FIRST_PERFORMANCE":
            current_val = perf_count
        elif code == "REPS_1000":
            current_val = total_reps
        elif code == "QUIZ_MASTER":
            current_val = perfect_quizzes

        # Update progress
        cursor.execute("""
            UPDATE user_achievements 
            SET current_progress = ?
            WHERE achievement_id = ?
        """, (min(req_count, current_val), a_id))

        # Check unlock
        if not is_unlocked and current_val >= req_count:
            cursor.execute("""
                UPDATE user_achievements
                SET unlocked = 1, unlocked_at = datetime('now', 'localtime')
                WHERE achievement_id = ?
            """, (a_id,))

            # Award XP
            cursor.execute("UPDATE user_profile SET xp = xp + ? WHERE id = 1", (xp_reward,))
            newly_unlocked.append({
                "id": a_id,
                "code": code,
                "title": row["title"],
                "description": row["description"],
                "icon": row["icon"],
                "xp_reward": xp_reward
            })

    return newly_unlocked
