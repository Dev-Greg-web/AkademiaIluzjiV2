from datetime import datetime, date, timedelta
from flask import Blueprint, jsonify
from database import get_db_connection
from services.xp_system import get_level_info

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/api/progress/summary', methods=['GET'])
def get_progress_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    profile = dict(cursor.fetchone())
    level_info = get_level_info(profile.get('xp', 0))

    cursor.execute("SELECT COUNT(*) FROM techniques")
    total_techs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM techniques WHERE user_level >= 8")
    mastered_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM techniques WHERE user_level >= 1 AND user_level <= 7")
    in_progress_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM techniques WHERE user_level = 0")
    unstarted_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*), SUM(CASE WHEN is_resolved = 0 THEN 1 ELSE 0 END) FROM technique_problems")
    prob_row = cursor.fetchone()
    total_problems = prob_row[0] or 0
    unresolved_problems = prob_row[1] or 0

    cursor.execute("SELECT COUNT(*) FROM routines")
    routines_count = cursor.fetchone()[0]

    conn.close()

    return jsonify({
        "profile": {
            **profile,
            "level_info": level_info
        },
        "techniques": {
            "total": total_techs,
            "mastered": mastered_count,
            "in_progress": in_progress_count,
            "unstarted": unstarted_count,
            "mastery_rate": round((mastered_count / total_techs * 100), 1) if total_techs > 0 else 0
        },
        "problems": {
            "total": total_problems,
            "unresolved": unresolved_problems
        },
        "routines_count": routines_count
    })


@progress_bp.route('/api/progress/activity-30-days', methods=['GET'])
def get_activity_30_days():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Generate 30 days sequence
    today = date.today()
    start_date = today - timedelta(days=29)

    cursor.execute("""
        SELECT substr(date, 1, 10) as day, 
               SUM(duration_seconds) as total_seconds,
               SUM(reps_count) as total_reps,
               SUM(xp_earned) as total_xp,
               COUNT(id) as sessions_count
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
                "sessions": item['sessions_count']
            })
        else:
            result.append({
                "date": iso_str,
                "label": curr.strftime("%d.%m"),
                "day_name": curr.strftime("%a"),
                "minutes": 0,
                "reps": 0,
                "xp": 0,
                "sessions": 0
            })
        curr += timedelta(days=1)

    conn.close()
    return jsonify(result)


@progress_bp.route('/api/progress/top-trained', methods=['GET'])
def get_top_trained():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, category, difficulty, user_level, status, 
               training_minutes, sessions_count, last_trained_at
        FROM techniques
        WHERE training_minutes > 0 OR sessions_count > 0
        ORDER BY training_minutes DESC, sessions_count DESC
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
        SELECT t.id, t.name, t.category, t.difficulty, t.user_level, t.status,
               t.training_minutes, t.sessions_count, t.last_trained_at,
               COUNT(p.id) as unresolved_problems,
               GROUP_CONCAT(p.problem_text, ' | ') as problem_notes
        FROM techniques t
        LEFT JOIN technique_problems p ON t.id = p.technique_id AND p.is_resolved = 0
        WHERE t.user_level < 8
        GROUP BY t.id
        ORDER BY unresolved_problems DESC, t.user_level ASC, t.sessions_count ASC
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
        SELECT category,
               COUNT(id) as total_count,
               SUM(CASE WHEN user_level >= 8 THEN 1 ELSE 0 END) as mastered_count,
               SUM(CASE WHEN user_level >= 1 AND user_level <= 7 THEN 1 ELSE 0 END) as in_progress_count,
               AVG(user_level) as avg_level,
               SUM(training_minutes) as total_minutes
        FROM techniques
        GROUP BY category
        ORDER BY total_count DESC
    """)
    rows = cursor.fetchall()
    
    categories = []
    for r in rows:
        c_dict = dict(r)
        c_dict["avg_level"] = round(c_dict["avg_level"] or 0, 1)
        c_dict["mastery_percent"] = round((c_dict["mastered_count"] / c_dict["total_count"] * 100), 1) if c_dict["total_count"] > 0 else 0
        categories.append(c_dict)

    conn.close()
    return jsonify(categories)
