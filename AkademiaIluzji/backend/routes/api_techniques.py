import json
from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import XP_REWARDS, get_level_info
from services.mastery_engine import compute_technique_mastery, unlock_eligible_techniques

techniques_bp = Blueprint('techniques', __name__)

@techniques_bp.route('/api/techniques', methods=['GET'])
def get_techniques():
    search = request.args.get('search', '').strip()
    track = request.args.get('track', '').strip()
    category = request.args.get('category', '').strip()
    status = request.args.get('status', '').strip()
    difficulty = request.args.get('difficulty', '').strip()
    level = request.args.get('skill_tree_level')

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

    if track and track != 'all':
        query += " AND t.track = ?"
        params.append(track)

    if category and category != 'Wszystkie':
        query += " AND t.category = ?"
        params.append(category)

    if status and status != 'Wszystkie':
        query += " AND t.status = ?"
        params.append(status)

    if difficulty and difficulty != 'Wszystkie':
        query += " AND t.difficulty = ?"
        params.append(difficulty)

    if level:
        query += " AND t.skill_tree_level = ?"
        params.append(int(level))

    query += " GROUP BY t.id ORDER BY t.skill_tree_level ASC, t.mastery_percentage DESC, t.name ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    results = []
    for r in rows:
        d = dict(r)
        try:
            d["prerequisites"] = json.loads(d.get("prerequisites_json") or "[]")
        except Exception:
            d["prerequisites"] = []
        try:
            d["unlocks"] = json.loads(d.get("unlocks_json") or "[]")
        except Exception:
            d["unlocks"] = []
        try:
            d["master_requirements"] = json.loads(d.get("master_requirements_json") or "{}")
        except Exception:
            d["master_requirements"] = {}
        results.append(d)

    conn.close()
    return jsonify(results)


@techniques_bp.route('/api/techniques/skill-tree', methods=['GET'])
def get_skill_tree():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT t.*,
               SUM(CASE WHEN p.is_resolved = 0 THEN 1 ELSE 0 END) as unresolved_problems_count
        FROM techniques t
        LEFT JOIN technique_problems p ON t.id = p.technique_id
        GROUP BY t.id
        ORDER BY t.skill_tree_level ASC, t.name ASC
    """)
    rows = cursor.fetchall()

    tree_by_levels = {}
    for r in rows:
        d = dict(r)
        lvl = d.get("skill_tree_level", 1)
        try:
            d["prerequisites"] = json.loads(d.get("prerequisites_json") or "[]")
        except Exception:
            d["prerequisites"] = []
        try:
            d["unlocks"] = json.loads(d.get("unlocks_json") or "[]")
        except Exception:
            d["unlocks"] = []

        if lvl not in tree_by_levels:
            tree_by_levels[lvl] = []
        tree_by_levels[lvl].append(d)

    conn.close()
    return jsonify({
        "levels": [
            {"level": lvl, "title": f"Poziom {lvl}", "techniques": techs}
            for lvl, techs in sorted(tree_by_levels.items())
        ]
    })


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
    try:
        tech_dict["prerequisites"] = json.loads(tech_dict.get("prerequisites_json") or "[]")
    except Exception:
        tech_dict["prerequisites"] = []
    try:
        tech_dict["unlocks"] = json.loads(tech_dict.get("unlocks_json") or "[]")
    except Exception:
        tech_dict["unlocks"] = []
    try:
        tech_dict["master_requirements"] = json.loads(tech_dict.get("master_requirements_json") or "{}")
    except Exception:
        tech_dict["master_requirements"] = {}

    # Problems
    cursor.execute("SELECT * FROM technique_problems WHERE technique_id = ? ORDER BY is_resolved ASC, priority DESC", (tech_id,))
    tech_dict["problems"] = [dict(r) for r in cursor.fetchall()]

    # Video recordings
    cursor.execute("SELECT id, title, stage_tag, notes, created_at FROM video_recordings WHERE technique_id = ? ORDER BY created_at DESC", (tech_id,))
    tech_dict["videos"] = [dict(r) for r in cursor.fetchall()]

    # Recent training sessions
    cursor.execute("""
        SELECT s.* FROM training_sessions s
        WHERE s.technique_ids LIKE ?
        ORDER BY s.date DESC
        LIMIT 10
    """, (f"%{tech_id}%",))
    tech_dict["recent_sessions"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return jsonify(tech_dict)


@techniques_bp.route('/api/techniques', methods=['POST'])
def create_technique():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    track = data.get('track', 'magic')
    category = data.get('category', 'Sleights')
    difficulty = data.get('difficulty', 'Beginner')
    description = data.get('description', '')
    notes = data.get('notes', '')
    skill_tree_level = int(data.get('skill_tree_level', 1))

    if not name:
        return jsonify({"error": "Nazwa techniki jest wymagana"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO techniques (
                name, track, category, difficulty, status, description, notes, 
                skill_tree_level, prerequisites_json, unlocks_json, master_requirements_json
            )
            VALUES (?, ?, ?, ?, 'Unlocked', ?, ?, ?, '[]', '[]', '{}')
        """, (name, track, category, difficulty, description, notes, skill_tree_level))
        tech_id = cursor.lastrowid
        conn.commit()

        cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
        created = dict(cursor.fetchone())
        created["problems"] = []
        conn.close()
        return jsonify(created), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Błąd tworzenia techniki: {str(e)}"}), 400


@techniques_bp.route('/api/techniques/<int:tech_id>/master-checklist', methods=['PATCH'])
def update_master_checklist(tech_id):
    data = request.get_json() or {}
    key = data.get('key')
    value = bool(data.get('value', True))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Technika nie znaleziona"}), 404

    t = dict(row)
    try:
        reqs = json.loads(t.get("master_requirements_json") or "{}")
    except Exception:
        reqs = {}

    if key:
        reqs[key] = value

    # Recalculate mastery
    cursor.execute("SELECT COUNT(*) FROM technique_problems WHERE technique_id = ? AND is_resolved = 0", (tech_id,))
    unresolved_probs = cursor.fetchone()[0]

    mastery, new_status, updated_reqs = compute_technique_mastery(
        training_minutes=t.get("training_minutes", 0),
        sessions_count=t.get("sessions_count", 0),
        total_reps=t.get("total_reps_count", 0),
        avg_score=t.get("avg_score", 0),
        unresolved_problems_count=unresolved_probs,
        last_trained_at_str=t.get("last_trained_at"),
        master_reqs=reqs,
        current_status=t.get("status", "Unlocked")
    )

    cursor.execute("""
        UPDATE techniques
        SET mastery_percentage = ?,
            status = ?,
            master_requirements_json = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
    """, (mastery, new_status, json.dumps(updated_reqs), tech_id))

    # Check unlocks
    unlocked_names = unlock_eligible_techniques(cursor)

    conn.commit()

    cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
    updated_tech = dict(cursor.fetchone())
    updated_tech["master_requirements"] = updated_reqs
    conn.close()

    return jsonify({
        "technique": updated_tech,
        "mastery_percentage": mastery,
        "status": new_status,
        "unlocked_techniques": unlocked_names
    })


@techniques_bp.route('/api/techniques/<int:tech_id>/mastery', methods=['PATCH'])
def update_technique_mastery(tech_id):
    data = request.get_json() or {}
    new_mastery = max(0, min(100, int(data.get('mastery_percentage', 0))))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
    tech = cursor.fetchone()
    if not tech:
        conn.close()
        return jsonify({"error": "Technika nie znaleziona"}), 404

    old_mastery = tech['mastery_percentage'] or 0
    
    if new_mastery >= 90:
        new_status = "Mastered+"
    elif new_mastery >= 75:
        new_status = "Mastered"
    elif new_mastery >= 25:
        new_status = "Practicing"
    elif new_mastery > 0:
        new_status = "Started"
    else:
        new_status = "Unlocked" if tech['status'] != 'Locked' else 'Locked'

    cursor.execute("""
        UPDATE techniques 
        SET mastery_percentage = ?,
            user_level = ?,
            status = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
    """, (new_mastery, max(0, min(10, round(new_mastery / 10))), new_status, tech_id))

    xp_gained = 0
    if new_mastery >= 80 and old_mastery < 80:
        xp_gained = XP_REWARDS["TECHNIQUE_MASTERED"]
        cursor.execute("UPDATE user_profile SET xp = xp + ?, updated_at = datetime('now', 'localtime') WHERE id = 1", (xp_gained,))

    unlocked_names = unlock_eligible_techniques(cursor)
    conn.commit()

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)

    cursor.execute("SELECT * FROM techniques WHERE id = ?", (tech_id,))
    updated_tech = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "technique": updated_tech,
        "xp_gained": xp_gained,
        "level_info": level_info,
        "unlocked_techniques": unlocked_names
    })


# --- PROBLEMS ---

@techniques_bp.route('/api/techniques/<int:tech_id>/problems', methods=['POST'])
def add_problem(tech_id):
    data = request.get_json() or {}
    problem_text = data.get('problem_text', '').strip()
    priority = data.get('priority', 'Medium')
    problem_tag = data.get('problem_tag', 'Tension')

    if not problem_text:
        return jsonify({"error": "Treść problemu jest wymagana"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO technique_problems (technique_id, priority, problem_tag, problem_text, is_resolved)
        VALUES (?, ?, ?, ?, 0)
    """, (tech_id, priority, problem_tag, problem_text))
    prob_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM technique_problems WHERE id = ?", (prob_id,))
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
    priority = data.get('priority', existing['priority'])

    cursor.execute("""
        UPDATE technique_problems 
        SET problem_text = ?, priority = ?, is_resolved = ?
        WHERE id = ?
    """, (problem_text, priority, 1 if is_resolved else 0, problem_id))

    xp_gained = 0
    if is_resolved and not existing['is_resolved']:
        xp_gained = XP_REWARDS["RESOLVE_PROBLEM"]
        cursor.execute("UPDATE user_profile SET xp = xp + ? WHERE id = 1", (xp_gained,))

    conn.commit()
    cursor.execute("SELECT * FROM technique_problems WHERE id = ?", (problem_id,))
    prob = dict(cursor.fetchone())
    conn.close()

    return jsonify({"problem": prob, "xp_gained": xp_gained})


@techniques_bp.route('/api/problems/<int:problem_id>', methods=['DELETE'])
def delete_problem(problem_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM technique_problems WHERE id = ?", (problem_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
