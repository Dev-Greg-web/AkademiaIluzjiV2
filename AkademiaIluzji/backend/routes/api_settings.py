import json
from datetime import datetime
from flask import Blueprint, jsonify, request, Response
from database import get_db_connection, init_db
from seed import seed_database

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/api/settings/export-json', methods=['GET'])
def export_database_json():
    conn = get_db_connection()
    cursor = conn.cursor()

    tables = [
        "user_profile", "techniques", "technique_problems",
        "training_sessions", "session_technique_items", "goals",
        "achievements", "user_achievements", "quizzes", "quiz_questions",
        "quiz_attempts", "routines", "performance_sessions", "video_recordings", "notes"
    ]

    export_data = {
        "app": "CARD MAGIC COACH (Akademia Iluzji)",
        "version": "2.0.0",
        "exported_at": datetime.now().isoformat(),
        "tables": {}
    }

    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            export_data["tables"][table] = [dict(r) for r in rows]
        except Exception:
            export_data["tables"][table] = []

    conn.close()

    json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
    filename = f"card_magic_coach_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    return Response(
        json_str,
        mimetype="application/json; charset=utf-8",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )


@settings_bp.route('/api/settings/import-json', methods=['POST'])
def import_database_json():
    if 'file' not in request.files:
        return jsonify({"error": "Brak pliku do importu"}), 400

    file = request.files['file']
    if not file.filename.endswith('.json'):
        return jsonify({"error": "Wymagany jest plik .json"}), 400

    try:
        content = file.read().decode('utf-8')
        data = json.loads(content)
    except Exception as e:
        return jsonify({"error": f"Błąd parsowania JSON: {str(e)}"}), 400

    if not isinstance(data, dict) or "tables" not in data:
        return jsonify({"error": "Nieprawidłowy format kopii zapasowej"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        tables_data = data["tables"]

        # Restore user profile
        if "user_profile" in tables_data and tables_data["user_profile"]:
            p = tables_data["user_profile"][0]
            cursor.execute("""
                UPDATE user_profile SET
                    name = ?, rank_tier = ?, level = ?, xp = ?, streak = ?, best_streak = ?,
                    total_training_minutes = ?, total_sessions_count = ?,
                    magic_xp = ?, cardistry_xp = ?, performance_xp = ?,
                    preferred_daily_minutes = ?, focus_track = ?, primary_goal = ?,
                    sound_enabled = ?, theme = ?, updated_at = datetime('now', 'localtime')
                WHERE id = 1
            """, (
                p.get('name', 'Iluzjonista'), p.get('rank_tier', 'Beginner'), p.get('level', 1),
                p.get('xp', 0), p.get('streak', 0), p.get('best_streak', 0),
                p.get('total_training_minutes', 0), p.get('total_sessions_count', 0),
                p.get('magic_xp', 0), p.get('cardistry_xp', 0), p.get('performance_xp', 0),
                p.get('preferred_daily_minutes', 20), p.get('focus_track', 'all'),
                p.get('primary_goal', ''), p.get('sound_enabled', 1), p.get('theme', 'dark')
            ))

        # Restore goals
        if "goals" in tables_data:
            cursor.execute("DELETE FROM goals")
            for g in tables_data["goals"]:
                cursor.execute("""
                    INSERT INTO goals (title, description, target_metric, current_value, target_value, deadline, priority, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (g.get('title'), g.get('description'), g.get('target_metric'), g.get('current_value', 0), g.get('target_value', 100), g.get('deadline'), g.get('priority', 'Medium'), g.get('status', 'active')))

        # Restore notes
        if "notes" in tables_data:
            cursor.execute("DELETE FROM notes")
            for n in tables_data["notes"]:
                cursor.execute("""
                    INSERT INTO notes (title, content, category, technique_id, routine_id)
                    VALUES (?, ?, ?, ?, ?)
                """, (n.get('title'), n.get('content', ''), n.get('category', 'Ogólne'), n.get('technique_id'), n.get('routine_id')))

        # Restore routines
        if "routines" in tables_data:
            cursor.execute("DELETE FROM routines")
            for r in tables_data["routines"]:
                cursor.execute("""
                    INSERT INTO routines (name, description, effect, effect_type, difficulty, patter, misdirection_tips, reset_instructions, notes, techniques_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (r.get('name'), r.get('description'), r.get('effect'), r.get('effect_type', 'ambitious'), r.get('difficulty', 'Intermediate'), r.get('patter'), r.get('misdirection_tips'), r.get('reset_instructions'), r.get('notes'), r.get('techniques_json', '[]')))

        # Restore sessions
        if "training_sessions" in tables_data:
            cursor.execute("DELETE FROM training_sessions")
            for s in tables_data["training_sessions"]:
                cursor.execute("""
                    INSERT INTO training_sessions (
                        date, duration_seconds, reps_count, rating,
                        score_control, score_naturalness, score_timing, score_confidence, score_presentation,
                        what_went_well, what_was_problem, what_to_improve, hardest_part,
                        problem_tags_json, session_type, xp_earned, technique_ids, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    s.get('date'), s.get('duration_seconds', 0), s.get('reps_count', 0), s.get('rating', 7),
                    s.get('score_control', 7), s.get('score_naturalness', 7), s.get('score_timing', 7),
                    s.get('score_confidence', 7), s.get('score_presentation', 7),
                    s.get('what_went_well'), s.get('what_was_problem'), s.get('what_to_improve'), s.get('hardest_part'),
                    s.get('problem_tags_json', '[]'), s.get('session_type', 'daily_plan'),
                    s.get('xp_earned', 20), s.get('technique_ids', '[]'), s.get('notes')
                ))

        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Baza danych została pomyślnie zaimportowana!"})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": f"Błąd podczas importu danych: {str(e)}"}), 500


@settings_bp.route('/api/settings/reset', methods=['POST'])
def reset_database():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.executescript("""
            DELETE FROM user_profile;
            DELETE FROM techniques;
            DELETE FROM technique_problems;
            DELETE FROM training_sessions;
            DELETE FROM session_technique_items;
            DELETE FROM goals;
            DELETE FROM achievements;
            DELETE FROM user_achievements;
            DELETE FROM quizzes;
            DELETE FROM quiz_questions;
            DELETE FROM quiz_attempts;
            DELETE FROM routines;
            DELETE FROM performance_sessions;
            DELETE FROM video_recordings;
            DELETE FROM notes;
        """)
        conn.commit()
        conn.close()

        # Re-seed fresh default content
        seed_database()

        return jsonify({"success": True, "message": "Baza danych została zresetowana i zainicjalizowana domyślną treścią."})
    except Exception as e:
        return jsonify({"error": f"Błąd resetu: {str(e)}"}), 500
