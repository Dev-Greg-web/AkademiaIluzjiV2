import json
from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import XP_REWARDS, get_level_info
from services.routine_generator import generate_matching_routines
from services.achievements_engine import evaluate_achievements

routines_bp = Blueprint('routines', __name__)

@routines_bp.route('/api/routines', methods=['GET'])
def get_routines():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM routines ORDER BY created_at DESC")
    rows = cursor.fetchall()
    
    routines = []
    for r in rows:
        r_dict = dict(r)
        try:
            r_dict["techniques"] = json.loads(r_dict.get("techniques_json") or "[]")
        except Exception:
            r_dict["techniques"] = []
        routines.append(r_dict)

    conn.close()
    return jsonify(routines)


@routines_bp.route('/api/routines/generator', methods=['GET'])
def get_generated_routines():
    effect_type = request.args.get('effect_type', 'all')
    difficulty = request.args.get('difficulty', 'all')

    conn = get_db_connection()
    cursor = conn.cursor()
    data = generate_matching_routines(cursor, effect_type, difficulty)
    conn.close()

    return jsonify(data)


@routines_bp.route('/api/routines/<int:routine_id>', methods=['GET'])
def get_routine(routine_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM routines WHERE id = ?", (routine_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Rutyna nie znaleziona"}), 404

    r_dict = dict(row)
    try:
        r_dict["techniques"] = json.loads(r_dict.get("techniques_json") or "[]")
    except Exception:
        r_dict["techniques"] = []

    # Get linked notes and videos
    cursor.execute("SELECT * FROM notes WHERE routine_id = ?", (routine_id,))
    r_dict["notes_list"] = [dict(n) for n in cursor.fetchall()]

    cursor.execute("SELECT * FROM video_recordings WHERE routine_id = ?", (routine_id,))
    r_dict["videos_list"] = [dict(v) for v in cursor.fetchall()]

    conn.close()
    return jsonify(r_dict)


@routines_bp.route('/api/routines', methods=['POST'])
def create_routine():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    effect = data.get('effect', '').strip()
    effect_type = data.get('effect_type', 'ambitious')
    difficulty = data.get('difficulty', 'Intermediate')
    patter = data.get('patter', '').strip()
    misdirection_tips = data.get('misdirection_tips', '').strip()
    reset_instructions = data.get('reset_instructions', '').strip()
    notes = data.get('notes', '').strip()
    techniques = data.get('techniques', [])

    if not name:
        return jsonify({"error": "Nazwa rutyny jest wymagana"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    tech_json = json.dumps(techniques)
    cursor.execute("""
        INSERT INTO routines (
            name, description, effect, effect_type, difficulty, patter, 
            misdirection_tips, reset_instructions, notes, techniques_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (name, description, effect, effect_type, difficulty, patter, misdirection_tips, reset_instructions, notes, tech_json))
    routine_id = cursor.lastrowid

    # Award XP
    xp_gained = XP_REWARDS["CREATE_ROUTINE"]
    cursor.execute("UPDATE user_profile SET xp = xp + ?, updated_at = datetime('now', 'localtime') WHERE id = 1", (xp_gained,))

    # Evaluate achievements
    unlocked_achievements = evaluate_achievements(cursor)

    conn.commit()

    cursor.execute("SELECT * FROM routines WHERE id = ?", (routine_id,))
    created_routine = dict(cursor.fetchone())
    created_routine["techniques"] = techniques

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)

    conn.close()
    return jsonify({
        "routine": created_routine,
        "xp_gained": xp_gained,
        "level_info": level_info,
        "unlocked_achievements": unlocked_achievements
    }), 201


@routines_bp.route('/api/routines/<int:routine_id>', methods=['PUT'])
def update_routine(routine_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM routines WHERE id = ?", (routine_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Rutyna nie znaleziona"}), 404

    name = data.get('name', existing['name'])
    description = data.get('description', existing['description'])
    effect = data.get('effect', existing['effect'])
    effect_type = data.get('effect_type', existing['effect_type'])
    difficulty = data.get('difficulty', existing['difficulty'])
    patter = data.get('patter', existing['patter'])
    misdirection_tips = data.get('misdirection_tips', existing['misdirection_tips'])
    reset_instructions = data.get('reset_instructions', existing['reset_instructions'])
    notes = data.get('notes', existing['notes'])
    techniques = data.get('techniques')
    
    tech_json = json.dumps(techniques) if techniques is not None else existing['techniques_json']

    cursor.execute("""
        UPDATE routines 
        SET name = ?, description = ?, effect = ?, effect_type = ?, difficulty = ?, 
            patter = ?, misdirection_tips = ?, reset_instructions = ?, notes = ?, 
            techniques_json = ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
    """, (name, description, effect, effect_type, difficulty, patter, misdirection_tips, reset_instructions, notes, tech_json, routine_id))

    conn.commit()
    cursor.execute("SELECT * FROM routines WHERE id = ?", (routine_id,))
    updated_routine = dict(cursor.fetchone())
    try:
        updated_routine["techniques"] = json.loads(updated_routine.get("techniques_json") or "[]")
    except Exception:
        updated_routine["techniques"] = []

    conn.close()
    return jsonify(updated_routine)


@routines_bp.route('/api/routines/<int:routine_id>', methods=['DELETE'])
def delete_routine(routine_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM routines WHERE id = ?", (routine_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
