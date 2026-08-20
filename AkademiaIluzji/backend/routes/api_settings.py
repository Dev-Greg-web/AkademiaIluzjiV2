import json
from datetime import datetime
from flask import Blueprint, jsonify, request, Response
from database import get_db_connection
from seed import seed_database

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/api/settings/export-json', methods=['GET'])
def export_database_json():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM user_profile")
    profile = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM techniques")
    techniques = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM technique_problems")
    problems = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM training_sessions")
    sessions = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM session_technique_items")
    session_items = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM routines")
    routines = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM notes")
    notes = [dict(r) for r in cursor.fetchall()]

    conn.close()

    export_payload = {
        "app": "Akademia Iluzji",
        "version": "1.0.0",
        "exported_at": datetime.now().isoformat(),
        "data": {
            "user_profile": profile,
            "techniques": techniques,
            "technique_problems": problems,
            "training_sessions": sessions,
            "session_technique_items": session_items,
            "routines": routines,
            "notes": notes
        }
    }

    json_str = json.dumps(export_payload, indent=2, ensure_ascii=False)
    filename = f"akademia_iluzji_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    return Response(
        json_str,
        mimetype="application/json; charset=utf-8",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )


@settings_bp.route('/api/settings/import-json', methods=['POST'])
def import_database_json():
    data = request.get_json()
    if not data or "data" not in data:
        return jsonify({"error": "Nieprawidłowy format pliku JSON backupu"}), 400

    db_data = data["data"]
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Clear existing tables
        cursor.execute("DELETE FROM session_technique_items")
        cursor.execute("DELETE FROM technique_problems")
        cursor.execute("DELETE FROM notes")
        cursor.execute("DELETE FROM routines")
        cursor.execute("DELETE FROM training_sessions")
        cursor.execute("DELETE FROM techniques")
        cursor.execute("DELETE FROM user_profile")

        # 1. Profile
        for p in db_data.get("user_profile", []):
            cursor.execute("""
                INSERT INTO user_profile (id, name, level, xp, streak, last_trained_date, total_training_minutes, total_sessions_count, primary_goal, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (p.get("id", 1), p.get("name", "Iluzjonista"), p.get("level", 1), p.get("xp", 0),
                  p.get("streak", 0), p.get("last_trained_date"), p.get("total_training_minutes", 0),
                  p.get("total_sessions_count", 0), p.get("primary_goal", ""), p.get("created_at"), p.get("updated_at")))

        # 2. Techniques
        for t in db_data.get("techniques", []):
            cursor.execute("""
                INSERT INTO techniques (id, name, category, difficulty, user_level, status, description, notes, training_minutes, sessions_count, last_trained_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (t.get("id"), t.get("name"), t.get("category"), t.get("difficulty"),
                  t.get("user_level", 0), t.get("status", "Nie rozpoczęto"), t.get("description", ""),
                  t.get("notes", ""), t.get("training_minutes", 0), t.get("sessions_count", 0),
                  t.get("last_trained_at"), t.get("created_at"), t.get("updated_at")))

        # 3. Problems
        for prob in db_data.get("technique_problems", []):
            cursor.execute("""
                INSERT INTO technique_problems (id, technique_id, problem_text, is_resolved, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (prob.get("id"), prob.get("technique_id"), prob.get("problem_text"), prob.get("is_resolved", 0), prob.get("created_at")))

        # 4. Sessions
        for s in db_data.get("training_sessions", []):
            cursor.execute("""
                INSERT INTO training_sessions (id, date, duration_seconds, reps_count, rating, what_went_well, what_was_problem, what_to_improve, xp_earned, technique_ids, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (s.get("id"), s.get("date"), s.get("duration_seconds", 0), s.get("reps_count", 0),
                  s.get("rating", 7), s.get("what_went_well", ""), s.get("what_was_problem", ""),
                  s.get("what_to_improve", ""), s.get("xp_earned", 20), s.get("technique_ids", "[]"),
                  s.get("notes", ""), s.get("created_at")))

        # 5. Session Items
        for item in db_data.get("session_technique_items", []):
            cursor.execute("""
                INSERT INTO session_technique_items (id, session_id, technique_id, duration_seconds, reps, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (item.get("id"), item.get("session_id"), item.get("technique_id"), item.get("duration_seconds", 0), item.get("reps", 0), item.get("notes", "")))

        # 6. Routines
        for r in db_data.get("routines", []):
            tech_json = r.get("techniques_json")
            if isinstance(tech_json, list):
                tech_json = json.dumps(tech_json)
            cursor.execute("""
                INSERT INTO routines (id, name, description, effect, difficulty, patter, notes, techniques_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (r.get("id"), r.get("name"), r.get("description", ""), r.get("effect", ""),
                  r.get("difficulty", "Intermediate"), r.get("patter", ""), r.get("notes", ""),
                  tech_json or "[]", r.get("created_at"), r.get("updated_at")))

        # 7. Notes
        for n in db_data.get("notes", []):
            cursor.execute("""
                INSERT INTO notes (id, title, content, category, technique_id, routine_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (n.get("id"), n.get("title", ""), n.get("content", ""), n.get("category", "Ogólne"),
                  n.get("technique_id"), n.get("routine_id"), n.get("created_at"), n.get("updated_at")))

        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Baza danych została pomyślnie zaimportowana!"})

    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": f"Błąd importu bazy: {str(e)}"}), 500


@settings_bp.route('/api/settings/reset', methods=['POST'])
def reset_database():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM session_technique_items")
    cursor.execute("DELETE FROM technique_problems")
    cursor.execute("DELETE FROM notes")
    cursor.execute("DELETE FROM routines")
    cursor.execute("DELETE FROM training_sessions")
    cursor.execute("DELETE FROM techniques")
    cursor.execute("DELETE FROM user_profile")
    conn.commit()
    conn.close()

    # Re-seed
    seed_database()

    return jsonify({"success": True, "message": "Zresetowano stan bazy danych do wartości początkowych."})
