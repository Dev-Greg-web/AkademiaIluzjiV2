import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.training_engine import generate_training_plan
from services.xp_system import get_level_info, update_user_streak, XP_REWARDS

training_bp = Blueprint('training', __name__)

@training_bp.route('/api/training/generate', methods=['POST'])
def generate_plan():
    data = request.get_json() or {}
    duration = int(data.get('duration_minutes', 30))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    plan = generate_training_plan(cursor, duration)
    conn.close()
    
    return jsonify(plan)


@training_bp.route('/api/training/start', methods=['POST'])
def start_training():
    conn = get_db_connection()
    cursor = conn.cursor()

    xp_gained = XP_REWARDS["START_TRAINING"]
    cursor.execute("""
        UPDATE user_profile 
        SET xp = xp + ?, updated_at = datetime('now', 'localtime') 
        WHERE id = 1
    """, (xp_gained,))
    conn.commit()

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)
    conn.close()

    return jsonify({
        "message": "Trening rozpoczęty! Skupienie i czucie kart to klucz.",
        "xp_gained": xp_gained,
        "level_info": level_info
    })


@training_bp.route('/api/training/finish', methods=['POST'])
def finish_training():
    data = request.get_json() or {}
    duration_seconds = int(data.get('duration_seconds', 0))
    reps_count = int(data.get('reps_count', 0))
    rating = int(data.get('rating', 7))
    what_went_well = data.get('what_went_well', '').strip()
    what_was_problem = data.get('what_was_problem', '').strip()
    what_to_improve = data.get('what_to_improve', '').strip()
    notes = data.get('notes', '').strip()
    technique_ids = data.get('technique_ids', [])
    items = data.get('items', []) # Sub-items per technique if available

    duration_minutes = max(1, round(duration_seconds / 60))

    # Calculate XP
    base_xp = XP_REWARDS["FINISH_TRAINING_BASE"]
    duration_bonus = (duration_minutes // 10) * XP_REWARDS["MINUTES_BONUS_PER_10"]
    reps_bonus = (reps_count // 50) * XP_REWARDS["REPS_BONUS_PER_50"]
    total_xp_earned = base_xp + duration_bonus + reps_bonus

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Update streak and last trained date
    new_streak, today_str = update_user_streak(cursor, 1)

    # 2. Update user profile stats
    cursor.execute("""
        UPDATE user_profile 
        SET xp = xp + ?,
            streak = ?,
            last_trained_date = ?,
            total_training_minutes = total_training_minutes + ?,
            total_sessions_count = total_sessions_count + 1,
            updated_at = datetime('now', 'localtime')
        WHERE id = 1
    """, (total_xp_earned, new_streak, today_str, duration_minutes))

    # 3. Save training session record
    tech_ids_json = json.dumps(technique_ids)
    cursor.execute("""
        INSERT INTO training_sessions (
            duration_seconds, reps_count, rating, what_went_well,
            what_was_problem, what_to_improve, xp_earned, technique_ids, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        duration_seconds, reps_count, rating, what_went_well,
        what_was_problem, what_to_improve, total_xp_earned, tech_ids_json, notes
    ))
    session_id = cursor.lastrowid

    # 4. Save items & update individual techniques
    if items:
        for item in items:
            t_id = item.get('technique_id')
            t_dur = item.get('duration_seconds', 0)
            t_reps = item.get('reps', 0)
            t_notes = item.get('notes', '')
            cursor.execute("""
                INSERT INTO session_technique_items (session_id, technique_id, duration_seconds, reps, notes)
                VALUES (?, ?, ?, ?, ?)
            """, (session_id, t_id, t_dur, t_reps, t_notes))

            # Update technique statistics
            t_mins = max(1, round(t_dur / 60))
            cursor.execute("""
                UPDATE techniques 
                SET training_minutes = training_minutes + ?,
                    sessions_count = sessions_count + 1,
                    last_trained_at = datetime('now', 'localtime'),
                    updated_at = datetime('now', 'localtime')
                WHERE id = ?
            """, (t_mins, t_id))
    elif technique_ids:
        # If no itemized list, distribute duration equally among selected techniques
        split_mins = max(1, duration_minutes // len(technique_ids))
        for t_id in technique_ids:
            cursor.execute("""
                UPDATE techniques 
                SET training_minutes = training_minutes + ?,
                    sessions_count = sessions_count + 1,
                    last_trained_at = datetime('now', 'localtime'),
                    updated_at = datetime('now', 'localtime')
                WHERE id = ?
            """, (split_mins, t_id))

    # 5. Optionally record problem if user mentioned one
    if what_was_problem and technique_ids and len(technique_ids) == 1:
        cursor.execute("""
            INSERT INTO technique_problems (technique_id, problem_text, is_resolved)
            VALUES (?, ?, 0)
        """, (technique_ids[0], what_was_problem))

    conn.commit()

    # Get updated user profile
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    profile_dict = dict(cursor.fetchone())
    level_info = get_level_info(profile_dict.get("xp", 0))

    cursor.execute("SELECT * FROM training_sessions WHERE id = ?", (session_id,))
    saved_session = dict(cursor.fetchone())
    saved_session["technique_ids"] = technique_ids

    conn.close()

    return jsonify({
        "session": saved_session,
        "xp_earned": total_xp_earned,
        "new_streak": new_streak,
        "profile": {
            **profile_dict,
            "level_info": level_info
        }
    }), 201


@training_bp.route('/api/training/sessions', methods=['GET'])
def get_sessions():
    limit = int(request.args.get('limit', 30))
    offset = int(request.args.get('offset', 0))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT s.* 
        FROM training_sessions s
        ORDER BY s.date DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))
    rows = cursor.fetchall()
    
    sessions = []
    for r in rows:
        s_dict = dict(r)
        try:
            tech_ids = json.loads(s_dict.get("technique_ids") or "[]")
        except Exception:
            tech_ids = []
        
        # Fetch technique names
        tech_names = []
        if tech_ids:
            placeholders = ",".join("?" for _ in tech_ids)
            cursor.execute(f"SELECT id, name FROM techniques WHERE id IN ({placeholders})", tech_ids)
            tech_names = [dict(t) for t in cursor.fetchall()]

        s_dict["techniques"] = tech_names
        sessions.append(s_dict)

    conn.close()
    return jsonify(sessions)
