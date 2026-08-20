from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import get_level_info, update_user_streak

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/api/profile', methods=['GET'])
def get_profile():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Profile not found"}), 404
        
    profile_dict = dict(row)
    level_info = get_level_info(profile_dict.get("xp", 0))
    
    # Check streak status relative to today
    streak, _ = update_user_streak(cursor, 1)
    
    conn.close()
    return jsonify({
        **profile_dict,
        "level_info": level_info,
        "current_level": level_info["level"],
        "title": level_info["title"]
    })

@profile_bp.route('/api/profile', methods=['PUT'])
def update_profile():
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    name = data.get('name')
    primary_goal = data.get('primary_goal')

    cursor.execute("""
        UPDATE user_profile 
        SET name = COALESCE(?, name),
            primary_goal = COALESCE(?, primary_goal),
            updated_at = datetime('now', 'localtime')
        WHERE id = 1
    """, (name, primary_goal))

    conn.commit()
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    row = cursor.fetchone()
    conn.close()

    profile_dict = dict(row)
    level_info = get_level_info(profile_dict.get("xp", 0))
    return jsonify({
        **profile_dict,
        "level_info": level_info
    })
