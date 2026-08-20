from datetime import datetime, date, timedelta
from flask import Blueprint, jsonify
from database import get_db_connection
from services.xp_system import get_level_info, calculate_track_level

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/api/progress/summary', methods=['GET'])
def get_progress_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    profile = dict(cursor.fetchone())
    level_info = get_level_info(profile.get('xp', 0))
    magic_info = calculate_track_level(profile.get('magic_xp', 0))
    cardistry_info = calculate_track_level(profile.get('cardistry_xp', 0))
    performance_info = calculate_track_level(profile.get('performance_xp', 0))

    cursor.execute("SELECT COUNT(*) FROM techniques")
    total_techs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM techniques WHERE status IN ('Mastered', 'Mastered+') OR mastery_percentage >= 80")
    mastered_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM techniques WHERE status = 'Practicing' OR (mastery_percentage >= 20 AND mastery_percentage < 80)")
    in_progress_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM techniques WHERE status = 'Locked'")
    locked_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*), SUM(CASE WHEN is_resolved = 0 THEN 1 ELSE 0 END) FROM technique_problems")
    prob_row = cursor.fetchone()
    total_problems = prob_row[0] or 0
    unresolved_problems = prob_row[1] or 0

    cursor.execute("SELECT COUNT(*) FROM routines")
    routines_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.unlocked = 1")
    unlocked_achievements = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM goals WHERE status = 'active'")
    active_goals = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(rating) FROM training_sessions WHERE rating > 0")
    avg_rating = round(cursor.fetchone()[0] or 7.0, 1)

    # Strongest & Weakest Category
    cursor.execute("""
        SELECT category, AVG(mastery_percentage) as avg_m
        FROM techniques
        GROUP BY category
        ORDER BY avg_m DESC
    """)
    cat_rows = cursor.fetchall()
    strongest_cat = cat_rows[0][0] if cat_rows else "Grips"
    weakest_cat = cat_rows[-1][0] if cat_rows else "Sleights"

    conn.close()

    return jsonify({
        "profile": {
            **profile,
            "level_info": level_info,
            "track_levels": {
                "magic": magic_info,
                "cardistry": cardistry_info,
                "performance": performance_info
            }
        },
        "techniques": {
            "total": total_techs,
            "mastered": mastered_count,
            "in_progress": in_progress_count,
            "locked": locked_count,
            "mastery_rate": round((mastered_count / total_techs * 100), 1) if total_techs > 0 else 0
        },
        "problems": {
            "total": total_problems,
            "unresolved": unresolved_problems
        },
        "routines_count": routines_count,
        "unlocked_achievements": unlocked_achievements,
        "active_goals": active_goals,
        "average_score": avg_rating,
        "strongest_category": strongest_cat,
        "weakest_category": weakest_cat
    })


@progress_bp.route('/api/progress/activity-30-days', methods=['GET'])
def get_activity_30_days():
    conn = get_db_connection()
    cursor = conn.cursor()

    today = date.today()
    start_date = today - timedelta(days=29)

    cursor.execute("""
        SELECT substr(date, 1, 10) as day, 
               SUM(duration_seconds) as total_seconds,
               SUM(reps_count) as total_reps,
               SUM(xp_earned) as total_xp,
               COUNT(id) as sessions_count,
               AVG(rating) as avg_rating
        FROM training_sessions
        WHERE substr(date, 1, 10) >= ?
        GROUP BY substr(date, 1, 10)
    """, (start_date.isoformat(),))

    rows = cursor.fetchall()
    day_map = {r['day']: dict(r) for r in rows}

    result = []
    curr = start_date
    while curr <= today:
        iso_str = curr.isoformat()
        item = day_map.get(iso_str)
        if item:
            mins = round(item['total_seconds'] / 60, 1)
            result.append({
                "date": iso_str,
                "label": curr.strftime("%d.%m"),
                "day_name": curr.strftime("%a"),
                "minutes": mins,
                "reps": item['total_reps'] or 0,
                "xp": item['total_xp'] or 0,
                "sessions": item['sessions_count'],
                "avg_rating": round(item['avg_rating'] or 7, 1)
            })
        else:
            result.append({
                "date": iso_str,
                "label": curr.strftime("%d.%m"),
                "day_name": curr.strftime("%a"),
                "minutes": 0,
                "reps": 0,
                "xp": 0,
                "sessions": 0,
                "avg_rating": 0
            })
        curr += timedelta(days=1)

    conn.close()
    return jsonify(result)


@progress_bp.route('/api/progress/top-trained', methods=['GET'])
def get_top_trained():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, track, category, difficulty, user_level, mastery_percentage, status, 
               training_minutes, sessions_count, total_reps_count, last_trained_at, avg_score
        FROM techniques
        WHERE training_minutes > 0 OR sessions_count > 0 OR total_reps_count > 0
        ORDER BY training_minutes DESC, total_reps_count DESC
        LIMIT 6
    """)
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@progress_bp.route('/api/progress/needs-attention', methods=['GET'])
def get_needs_attention():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT t.id, t.name, t.track, t.category, t.difficulty, t.mastery_percentage, t.status,
               t.training_minutes, t.sessions_count, t.last_trained_at,
               COUNT(p.id) as unresolved_problems,
               GROUP_CONCAT(p.problem_text, ' | ') as problem_notes
        FROM techniques t
        LEFT JOIN technique_problems p ON t.id = p.technique_id AND p.is_resolved = 0
        WHERE t.status IN ('Started', 'Practicing', 'Unlocked') OR (t.mastery_percentage < 80 AND t.status != 'Locked')
        GROUP BY t.id
        ORDER BY unresolved_problems DESC, t.mastery_percentage ASC
        LIMIT 6
    """)
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@progress_bp.route('/api/progress/categories', methods=['GET'])
def get_categories_breakdown():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT category, track,
               COUNT(id) as total_count,
               SUM(CASE WHEN status IN ('Mastered', 'Mastered+') OR mastery_percentage >= 80 THEN 1 ELSE 0 END) as mastered_count,
               AVG(mastery_percentage) as avg_mastery,
               SUM(training_minutes) as total_minutes
        FROM techniques
        GROUP BY category
        ORDER BY total_count DESC
    """)
    rows = cursor.fetchall()
    
    categories = []
    for r in rows:
        c_dict = dict(r)
        c_dict["avg_mastery"] = round(c_dict["avg_mastery"] or 0, 1)
        c_dict["mastery_percent"] = round((c_dict["mastered_count"] / c_dict["total_count"] * 100), 1) if c_dict["total_count"] > 0 else 0
        categories.append(c_dict)

    conn.close()
    return jsonify(categories)
