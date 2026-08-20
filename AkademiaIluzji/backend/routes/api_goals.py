from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import get_level_info

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('/api/goals', methods=['GET'])
def get_goals():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM goals ORDER BY CASE status WHEN 'active' THEN 1 ELSE 2 END, priority DESC, created_at DESC")
    rows = cursor.fetchall()
    goals = [dict(r) for r in rows]
    conn.close()
    return jsonify(goals)


@goals_bp.route('/api/goals', methods=['POST'])
def create_goal():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    target_metric = data.get('target_metric', 'reps')
    target_value = int(data.get('target_value', 100))
    deadline = data.get('deadline')
    priority = data.get('priority', 'Medium')

    if not title:
        return jsonify({"error": "Tytuł celu jest wymagany"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO goals (title, description, target_metric, current_value, target_value, deadline, priority, status)
        VALUES (?, ?, ?, 0, ?, ?, ?, 'active')
    """, (title, description, target_metric, target_value, deadline, priority))
    goal_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    goal = dict(cursor.fetchone())
    conn.close()
    return jsonify(goal), 201


@goals_bp.route('/api/goals/<int:goal_id>/progress', methods=['PATCH'])
def update_goal_progress(goal_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Cel nie znaleziony"}), 404

    current_val = int(data.get('current_value', existing['current_value']))
    status = data.get('status', existing['status'])
    target_val = existing['target_value']

    xp_gained = 0
    if current_val >= target_val and existing['status'] != 'completed':
        status = 'completed'
        xp_gained = 40
        cursor.execute("UPDATE user_profile SET xp = xp + ? WHERE id = 1", (xp_gained,))

    cursor.execute("""
        UPDATE goals
        SET current_value = ?, status = ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
    """, (current_val, status, goal_id))
    conn.commit()

    cursor.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
    updated_goal = dict(cursor.fetchone())

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)

    conn.close()
    return jsonify({
        "goal": updated_goal,
        "xp_gained": xp_gained,
        "level_info": level_info
    })


@goals_bp.route('/api/goals/<int:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
