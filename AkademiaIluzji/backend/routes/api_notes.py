from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import XP_REWARDS, get_level_info

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/api/notes', methods=['GET'])
def get_notes():
    category = request.args.get('category', '').strip()
    technique_id = request.args.get('technique_id')
    routine_id = request.args.get('routine_id')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT n.*, 
               t.name as technique_name, 
               r.name as routine_name
        FROM notes n
        LEFT JOIN techniques t ON n.technique_id = t.id
        LEFT JOIN routines r ON n.routine_id = r.id
        WHERE 1=1
    """
    params = []

    if category and category != 'Wszystkie':
        query += " AND n.category = ?"
        params.append(category)

    if technique_id:
        query += " AND n.technique_id = ?"
        params.append(technique_id)

    if routine_id:
        query += " AND n.routine_id = ?"
        params.append(routine_id)

    query += " ORDER BY n.updated_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    notes = [dict(r) for r in rows]

    conn.close()
    return jsonify(notes)


@notes_bp.route('/api/notes', methods=['POST'])
def create_note():
    data = request.get_json() or {}
    title = data.get('title', '').strip() or 'Bez tytułu'
    content = data.get('content', '').strip()
    category = data.get('category', 'Ogólne')
    technique_id = data.get('technique_id')
    routine_id = data.get('routine_id')

    if not content:
        return jsonify({"error": "Treść notatki nie może być pusta"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO notes (title, content, category, technique_id, routine_id)
        VALUES (?, ?, ?, ?, ?)
    """, (title, content, category, technique_id, routine_id))
    note_id = cursor.lastrowid

    # Award XP
    xp_gained = XP_REWARDS["ADD_NOTE"]
    cursor.execute("UPDATE user_profile SET xp = xp + ?, updated_at = datetime('now', 'localtime') WHERE id = 1", (xp_gained,))

    conn.commit()

    cursor.execute("""
        SELECT n.*, t.name as technique_name, r.name as routine_name
        FROM notes n
        LEFT JOIN techniques t ON n.technique_id = t.id
        LEFT JOIN routines r ON n.routine_id = r.id
        WHERE n.id = ?
    """, (note_id,))
    note = dict(cursor.fetchone())

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)

    conn.close()
    return jsonify({
        "note": note,
        "xp_gained": xp_gained,
        "level_info": level_info
    }), 201


@notes_bp.route('/api/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Notatka nie znaleziona"}), 404

    title = data.get('title', existing['title'])
    content = data.get('content', existing['content'])
    category = data.get('category', existing['category'])
    technique_id = data.get('technique_id', existing['technique_id'])
    routine_id = data.get('routine_id', existing['routine_id'])

    cursor.execute("""
        UPDATE notes 
        SET title = ?, content = ?, category = ?, technique_id = ?, routine_id = ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
    """, (title, content, category, technique_id, routine_id, note_id))

    conn.commit()

    cursor.execute("""
        SELECT n.*, t.name as technique_name, r.name as routine_name
        FROM notes n
        LEFT JOIN techniques t ON n.technique_id = t.id
        LEFT JOIN routines r ON n.routine_id = r.id
        WHERE n.id = ?
    """, (note_id,))
    updated_note = dict(cursor.fetchone())
    conn.close()

    return jsonify(updated_note)


@notes_bp.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
