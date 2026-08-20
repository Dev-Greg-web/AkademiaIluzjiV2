from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import calculate_status, XP_REWARDS, get_level_info

techniques_bp = Blueprint('techniques', __name__)

@techniques_bp.route('/api/techniques', methods=['GET'])
def get_techniques():
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    status = request.args.get('status', '').strip()
    difficulty = request.args.get('difficulty', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT t.*, 
               COUNT(p.id) as problems_count,
               SUM(CASE WHEN p.is_resolved = 0 THEN 1 ELSE 0 END) as unresolved_problems_count
        FROM techniques t
        LEFT JOIN technique_problems p ON t.id = p.technique_id
        WHERE 1=1
    """
    params = []

    if search:
        query += " AND (t.name LIKE ? OR t.description LIKE ? OR t.notes LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if category and category != 'Wszystkie':
        query += " AND t.category = ?"
        params.append(category)

    if status and status != 'Wszystkie':
        query += " AND t.status = ?"
        params.append(status)

    if difficulty and difficulty != 'Wszystkie':
        query += " AND t.difficulty = ?"
        params.append(difficulty)

    query += " GROUP BY t.id ORDER BY t.user_level DESC, t.name ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    results = [dict(r) for r in rows]

    conn.close()
    return jsonify(results)


@techniques_bp.route('/api/techniques/<int:tech_id>', methods=['GET'])
def get_technique(tech_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
    tech_row = cursor.fetchone()
    if not tech_row:
        conn.close()
        return jsonify({"error": "Technika nie znaleziona"}), 404

    tech_dict = dict(tech_row)

    # Fetch problems
    cursor.execute("""
        SELECT * FROM technique_problems 
        WHERE technique_id = ? 
        ORDER BY is_resolved ASC, created_at DESC
    """, (tech_id,))
    problems = [dict(r) for r in cursor.fetchall()]
    tech_dict["problems"] = problems

    # Fetch recent training sessions mentioning this technique
    cursor.execute("""
        SELECT s.* FROM training_sessions s
        WHERE s.technique_ids LIKE ?
        ORDER BY s.date DESC
        LIMIT 10
    """, (f"%{tech_id}%",))
    sessions = [dict(r) for r in cursor.fetchall()]
    tech_dict["recent_sessions"] = sessions

    conn.close()
    return jsonify(tech_dict)


@techniques_bp.route('/api/techniques', methods=['POST'])
def create_technique():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', 'Fundamenty')
    difficulty = data.get('difficulty', 'Beginner')
    description = data.get('description', '')
    notes = data.get('notes', '')
    user_level = int(data.get('user_level', 0))

    if not name:
        return jsonify({"error": "Nazwa techniki jest wymagana"}), 400

    status = calculate_status(user_level)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO techniques (name, category, difficulty, user_level, status, description, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, category, difficulty, user_level, status, description, notes))
        tech_id = cursor.lastrowid
        conn.commit()

        cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
        created_tech = dict(cursor.fetchone())
        created_tech["problems"] = []
        conn.close()
        return jsonify(created_tech), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Błąd tworzenia techniki (np. duplikat nazwy): {str(e)}"}), 400


@techniques_bp.route('/api/techniques/<int:tech_id>', methods=['PUT'])
def update_technique(tech_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Technika nie znaleziona"}), 404

    name = data.get('name', existing['name'])
    category = data.get('category', existing['category'])
    difficulty = data.get('difficulty', existing['difficulty'])
    description = data.get('description', existing['description'])
    notes = data.get('notes', existing['notes'])
    user_level = int(data.get('user_level', existing['user_level']))
    status = calculate_status(user_level)

    cursor.execute("""
        UPDATE techniques 
        SET name = ?, category = ?, difficulty = ?, user_level = ?, status = ?, 
            description = ?, notes = ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
    """, (name, category, difficulty, user_level, status, description, notes, tech_id))

    conn.commit()
    cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
    updated_tech = dict(cursor.fetchone())
    conn.close()
    return jsonify(updated_tech)


@techniques_bp.route('/api/techniques/<int:tech_id>/level', methods=['PATCH'])
def update_technique_level(tech_id):
    data = request.get_json() or {}
    new_level = int(data.get('user_level', 0))
    new_level = max(0, min(10, new_level))
    new_status = calculate_status(new_level)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT user_level, name FROM techniques WHERE id = ?", (tech_id,))
    tech = cursor.fetchone()
    if not tech:
        conn.close()
        return jsonify({"error": "Technika nie znaleziona"}), 404

    old_level = tech['user_level']
    cursor.execute("""
        UPDATE techniques 
        SET user_level = ?, status = ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
    """, (new_level, new_status, tech_id))

    xp_gained = 0
    if new_level > old_level:
        level_diff = new_level - old_level
        xp_gained = level_diff * XP_REWARDS["TECHNIQUE_LEVEL_UP"]
        if new_level >= 8 and old_level < 8:
            xp_gained += XP_REWARDS["TECHNIQUE_MASTERED"]

        cursor.execute("UPDATE user_profile SET xp = xp + ?, updated_at = datetime('now', 'localtime') WHERE id = 1", (xp_gained,))

    conn.commit()

    # Get updated profile
    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)

    cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
    updated_tech = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "technique": updated_tech,
        "xp_gained": xp_gained,
        "user_xp": user_xp,
        "level_info": level_info
    })


@techniques_bp.route('/api/techniques/<int:tech_id>', methods=['DELETE'])
def delete_technique(tech_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM techniques WHERE id = ?", (tech_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Technika usunięta"})


# --- PROBLEMS SUB-ROUTES ---

@techniques_bp.route('/api/techniques/<int:tech_id>/problems', methods=['POST'])
def add_problem(tech_id):
    data = request.get_json() or {}
    problem_text = data.get('problem_text', '').strip()
    if not problem_text:
        return jsonify({"error": "Treść problemu jest wymagana"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO technique_problems (technique_id, problem_text, is_resolved)
        VALUES (?, ?, 0)
    """, (tech_id, problem_text))
    problem_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM technique_problems WHERE id = ?", (problem_id,))
    problem = dict(cursor.fetchone())
    conn.close()
    return jsonify(problem), 201


@techniques_bp.route('/api/problems/<int:problem_id>', methods=['PUT', 'PATCH'])
def update_problem(problem_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM technique_problems WHERE id = ?", (problem_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Problem nie znaleziony"}), 404

    is_resolved = data.get('is_resolved', existing['is_resolved'])
    problem_text = data.get('problem_text', existing['problem_text'])

    cursor.execute("""
        UPDATE technique_problems 
        SET problem_text = ?, is_resolved = ?
        WHERE id = ?
    """, (problem_text, 1 if is_resolved else 0, problem_id))

    xp_gained = 0
    if is_resolved and not existing['is_resolved']:
        xp_gained = XP_REWARDS["RESOLVE_PROBLEM"]
        cursor.execute("UPDATE user_profile SET xp = xp + ? WHERE id = 1", (xp_gained,))

    conn.commit()
    cursor.execute("SELECT * FROM technique_problems WHERE id = ?", (problem_id,))
    problem = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "problem": problem,
        "xp_gained": xp_gained
    })


@techniques_bp.route('/api/problems/<int:problem_id>', methods=['DELETE'])
def delete_problem(problem_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM technique_problems WHERE id = ?", (problem_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
