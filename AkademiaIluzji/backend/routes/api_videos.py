from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import get_level_info

videos_bp = Blueprint('videos', __name__)

@videos_bp.route('/api/videos', methods=['GET'])
def get_videos():
    technique_id = request.args.get('technique_id')
    routine_id = request.args.get('routine_id')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT v.*, t.name as technique_name, r.name as routine_name
        FROM video_recordings v
        LEFT JOIN techniques t ON v.technique_id = t.id
        LEFT JOIN routines r ON v.routine_id = r.id
        WHERE 1=1
    """
    params = []

    if technique_id:
        query += " AND v.technique_id = ?"
        params.append(technique_id)

    if routine_id:
        query += " AND v.routine_id = ?"
        params.append(routine_id)

    query += " ORDER BY v.created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    videos = [dict(r) for r in rows]
    conn.close()
    return jsonify(videos)


@videos_bp.route('/api/videos', methods=['POST'])
def save_video():
    data = request.get_json() or {}
    title = data.get('title', '').strip() or 'Nagranie treningowe'
    stage_tag = data.get('stage_tag', 'Trening').strip()
    notes = data.get('notes', '').strip()
    video_data = data.get('video_data', '')
    technique_id = data.get('technique_id')
    routine_id = data.get('routine_id')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO video_recordings (technique_id, routine_id, title, stage_tag, notes, video_data)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (technique_id, routine_id, title, stage_tag, notes, video_data))
    vid_id = cursor.lastrowid

    # Award +15 XP for logging a practice video
    cursor.execute("UPDATE user_profile SET xp = xp + 15, updated_at = datetime('now', 'localtime') WHERE id = 1")
    conn.commit()

    cursor.execute("""
        SELECT v.*, t.name as technique_name, r.name as routine_name
        FROM video_recordings v
        LEFT JOIN techniques t ON v.technique_id = t.id
        LEFT JOIN routines r ON v.routine_id = r.id
        WHERE v.id = ?
    """, (vid_id,))
    saved_vid = dict(cursor.fetchone())

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)

    conn.close()
    return jsonify({
        "video": saved_vid,
        "xp_gained": 15,
        "level_info": level_info
    }), 201


@videos_bp.route('/api/videos/<int:video_id>', methods=['DELETE'])
def delete_video(video_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM video_recordings WHERE id = ?", (video_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
