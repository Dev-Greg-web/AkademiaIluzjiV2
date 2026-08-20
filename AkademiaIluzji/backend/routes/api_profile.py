import json
from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import get_level_info, calculate_track_level, update_user_streak

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
    magic_info = calculate_track_level(profile_dict.get("magic_xp", 0))
    cardistry_info = calculate_track_level(profile_dict.get("cardistry_xp", 0))
    performance_info = calculate_track_level(profile_dict.get("performance_xp", 0))
    
    # Check streak status
    streak, best_streak, _ = update_user_streak(cursor, 1)
    
    conn.close()
    return jsonify({
        **profile_dict,
        "streak": streak,
        "best_streak": best_streak,
        "level_info": level_info,
        "current_level": level_info["level"],
        "title": level_info["title"],
        "rank_tier": level_info["rank_tier"],
        "track_levels": {
            "magic": magic_info,
            "cardistry": cardistry_info,
            "performance": performance_info
        }
    })

@profile_bp.route('/api/profile', methods=['PUT'])
def update_profile():
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    name = data.get('name')
    primary_goal = data.get('primary_goal')
    preferred_daily_minutes = data.get('preferred_daily_minutes')
    focus_track = data.get('focus_track')
    sound_enabled = data.get('sound_enabled')
    theme = data.get('theme')

    cursor.execute("""
        UPDATE user_profile 
        SET name = COALESCE(?, name),
            primary_goal = COALESCE(?, primary_goal),
            preferred_daily_minutes = COALESCE(?, preferred_daily_minutes),
            focus_track = COALESCE(?, focus_track),
            sound_enabled = COALESCE(?, sound_enabled),
            theme = COALESCE(?, theme),
            updated_at = datetime('now', 'localtime')
        WHERE id = 1
    """, (name, primary_goal, preferred_daily_minutes, focus_track, sound_enabled, theme))

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

@profile_bp.route('/api/profile/onboarding', methods=['POST'])
def complete_onboarding():
    data = request.get_json() or {}
    starting_level = data.get('starting_level', 'Beginner')
    focus_track = data.get('focus_track', 'all')
    preferred_minutes = int(data.get('preferred_minutes', 20))
    known_technique_names = data.get('known_techniques', [])

    conn = get_db_connection()
    cursor = conn.cursor()

    # Map starting tier
    init_xp = 0
    if starting_level == 'Intermediate':
        init_xp = 950 # Level 6
    elif starting_level == 'Advanced':
        init_xp = 4350 # Level 11

    cursor.execute("""
        UPDATE user_profile
        SET rank_tier = ?,
            xp = MAX(xp, ?),
            focus_track = ?,
            preferred_daily_minutes = ?,
            onboarding_completed = 1,
            updated_at = datetime('now', 'localtime')
        WHERE id = 1
    """, (starting_level, init_xp, focus_track, preferred_minutes))

    # Mark known techniques as Started or Practicing (mastery 50-70%)
    if known_technique_names:
        for t_name in known_technique_names:
            cursor.execute("""
                UPDATE techniques
                SET status = 'Practicing',
                    mastery_percentage = 60,
                    user_level = 6,
                    updated_at = datetime('now', 'localtime')
                WHERE name = ?
            """, (t_name,))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Onboarding zakończony pomyślnie!"})
