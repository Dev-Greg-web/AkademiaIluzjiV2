from flask import Blueprint, jsonify
from database import get_db_connection
from services.achievements_engine import evaluate_achievements

achievements_bp = Blueprint('achievements', __name__)

@achievements_bp.route('/api/achievements', methods=['GET'])
def get_achievements():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Re-evaluate in case new threshold reached
    evaluate_achievements(cursor)
    conn.commit()

    cursor.execute("""
        SELECT a.id, a.code, a.title, a.description, a.icon, a.category, 
               a.xp_reward, a.required_count,
               ua.unlocked, ua.unlocked_at, ua.current_progress
        FROM achievements a
        JOIN user_achievements ua ON a.id = ua.achievement_id
        ORDER BY ua.unlocked DESC, a.xp_reward ASC
    """)
    rows = cursor.fetchall()
    achievements = [dict(r) for r in rows]

    total_count = len(achievements)
    unlocked_count = sum(1 for a in achievements if a["unlocked"] == 1)

    conn.close()
    return jsonify({
        "achievements": achievements,
        "total_count": total_count,
        "unlocked_count": unlocked_count,
        "completion_rate": round((unlocked_count / total_count * 100), 1) if total_count > 0 else 0
    })
