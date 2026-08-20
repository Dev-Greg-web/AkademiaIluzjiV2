import json
from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import XP_REWARDS, get_level_info
from services.achievements_engine import evaluate_achievements

performance_bp = Blueprint('performance', __name__)

@performance_bp.route('/api/performance/sessions', methods=['GET'])
def get_performance_sessions():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.*, r.name as routine_name_db
        FROM performance_sessions p
        LEFT JOIN routines r ON p.routine_id = r.id
        ORDER BY p.created_at DESC
    """)
    rows = cursor.fetchall()
    sessions = []
    for r in rows:
        d = dict(r)
        try:
            d["checklist"] = json.loads(d.get("checklist_json") or "{}")
        except Exception:
            d["checklist"] = {}
        sessions.append(d)

    conn.close()
    return jsonify(sessions)


@performance_bp.route('/api/performance/sessions', methods=['POST'])
def record_performance_session():
    data = request.get_json() or {}
    routine_id = data.get('routine_id')
    routine_name = data.get('routine_name', 'Występ z kartami').strip()
    venue = data.get('venue', 'Znajomi / Kameralnie').strip()
    audience_reaction = data.get('audience_reaction', 'Zachwyt').strip()
    overall_score = int(data.get('overall_score', 8))
    checklist = data.get('checklist', {})
    what_worked = data.get('what_worked', '').strip()
    what_to_improve = data.get('what_to_improve', '').strip()
    notes = data.get('notes', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO performance_sessions (
            routine_id, routine_name, venue, audience_reaction, overall_score,
            checklist_json, what_worked, what_to_improve, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        routine_id, routine_name, venue, audience_reaction, overall_score,
        json.dumps(checklist), what_worked, what_to_improve, notes
    ))
    session_id = cursor.lastrowid

    # Award Performance XP
    xp_gained = XP_REWARDS["PERFORM_ROUTINE"]
    cursor.execute("""
        UPDATE user_profile 
        SET xp = xp + ?, 
            performance_xp = performance_xp + ?,
            updated_at = datetime('now', 'localtime') 
        WHERE id = 1
    """, (xp_gained, xp_gained))

    # Evaluate achievements
    unlocked_achievements = evaluate_achievements(cursor)

    conn.commit()

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)

    cursor.execute("SELECT * FROM performance_sessions WHERE id = ?", (session_id,))
    saved = dict(cursor.fetchone())
    saved["checklist"] = checklist

    conn.close()

    return jsonify({
        "session": saved,
        "xp_gained": xp_gained,
        "level_info": level_info,
        "unlocked_achievements": unlocked_achievements
    }), 201
