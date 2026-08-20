import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.recommendation_engine import get_next_single_step, generate_daily_training_plan
from services.spaced_repetition import get_review_needed_techniques
from services.mastery_engine import compute_technique_mastery, unlock_eligible_techniques
from services.achievements_engine import evaluate_achievements
from services.xp_system import get_level_info, update_user_streak, XP_REWARDS

training_bp = Blueprint('training', __name__)

@training_bp.route('/api/training/next-step', methods=['GET'])
def get_next_step():
    conn = get_db_connection()
    cursor = conn.cursor()
    step = get_next_single_step(cursor)
    conn.close()
    return jsonify(step)


@training_bp.route('/api/training/generate', methods=['POST'])
def generate_plan():
    data = request.get_json() or {}
    duration = int(data.get('duration_minutes', 20))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    plan = generate_daily_training_plan(cursor, duration)
    conn.close()
    return jsonify(plan)


@training_bp.route('/api/training/review-needed', methods=['GET'])
def get_review_needed():
    conn = get_db_connection()
    cursor = conn.cursor()
    items = get_review_needed_techniques(cursor, limit=6)
    conn.close()
    return jsonify(items)


@training_bp.route('/api/training/start', methods=['POST'])
def start_training():
    conn = get_db_connection()
    cursor = conn.cursor()

    xp_gained = XP_REWARDS["START_TRAINING"]
    cursor.execute("UPDATE user_profile SET xp = xp + ?, updated_at = datetime('now', 'localtime') WHERE id = 1", (xp_gained,))
    conn.commit()

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)
    conn.close()

    return jsonify({
        "message": "Trening rozpoczęty! Skupienie i czucie kart to klucz.",
        "xp_gained": xp_gained,
        "level_info": level_info
    })


@training_bp.route('/api/training/finish', methods=['POST'])
def finish_training():
    data = request.get_json() or {}
    duration_seconds = int(data.get('duration_seconds', 0))
    reps_count = int(data.get('reps_count', 0))
    rating = int(data.get('rating', 7))

    # Multi-dimensional ratings
    score_control = int(data.get('score_control', rating))
    score_naturalness = int(data.get('score_naturalness', rating))
    score_timing = int(data.get('score_timing', rating))
    score_confidence = int(data.get('score_confidence', rating))
    score_presentation = int(data.get('score_presentation', rating))

    what_went_well = data.get('what_went_well', '').strip()
    what_was_problem = data.get('what_was_problem', '').strip()
    what_to_improve = data.get('what_to_improve', '').strip()
    hardest_part = data.get('hardest_part', '').strip()
    problem_tags = data.get('problem_tags', [])
    notes = data.get('notes', '').strip()
    technique_ids = data.get('technique_ids', [])
    session_type = data.get('session_type', 'daily_plan')
    items = data.get('items', [])

    duration_minutes = max(1, round(duration_seconds / 60))

    # Calculate XP
    base_xp = XP_REWARDS["FINISH_TRAINING_BASE"]
    duration_bonus = (duration_minutes // 10) * XP_REWARDS["MINUTES_BONUS_PER_10"]
    reps_bonus = (reps_count // 50) * XP_REWARDS["REPS_BONUS_PER_50"]
    total_xp_earned = base_xp + duration_bonus + reps_bonus

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Update streak
    new_streak, new_best, today_str = update_user_streak(cursor, 1)

    # 2. Update user profile stats
    cursor.execute("""
        UPDATE user_profile 
        SET xp = xp + ?,
            streak = ?,
            best_streak = ?,
            last_trained_date = ?,
            total_training_minutes = total_training_minutes + ?,
            total_sessions_count = total_sessions_count + 1,
            updated_at = datetime('now', 'localtime')
        WHERE id = 1
    """, (total_xp_earned, new_streak, new_best, today_str, duration_minutes))

    # 3. Save training session record
    tech_ids_json = json.dumps(technique_ids)
    tags_json = json.dumps(problem_tags)

    cursor.execute("""
        INSERT INTO training_sessions (
            duration_seconds, reps_count, rating,
            score_control, score_naturalness, score_timing, score_confidence, score_presentation,
            what_went_well, what_was_problem, what_to_improve, hardest_part,
            problem_tags_json, session_type, xp_earned, technique_ids, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        duration_seconds, reps_count, rating,
        score_control, score_naturalness, score_timing, score_confidence, score_presentation,
        what_went_well, what_was_problem, what_to_improve, hardest_part,
        tags_json, session_type, total_xp_earned, tech_ids_json, notes
    ))
    session_id = cursor.lastrowid

    # 4. Process each trained technique: update mastery, reps, scores, requirements
    if technique_ids:
        split_mins = max(1, duration_minutes // len(technique_ids))
        split_reps = max(1, reps_count // len(technique_ids))

        for t_id in technique_ids:
            cursor.execute("SELECT * FROM techniques WHERE id = ?", (t_id,))
            t_row = cursor.fetchone()
            if not t_row:
                continue
            t = dict(t_row)

            # Update averages
            old_sessions = t.get("sessions_count", 0)
            old_avg = t.get("avg_score", 0)
            new_sessions = old_sessions + 1
            new_avg = round(((old_avg * old_sessions) + rating) / new_sessions, 1)
            new_best = max(t.get("best_score", 0), rating)
            new_total_reps = t.get("total_reps_count", 0) + split_reps
            new_total_mins = t.get("training_minutes", 0) + split_mins

            # Problems count
            cursor.execute("SELECT COUNT(*) FROM technique_problems WHERE technique_id = ? AND is_resolved = 0", (t_id,))
            prob_count = cursor.fetchone()[0]

            try:
                m_reqs = json.loads(t.get("master_requirements_json") or "{}")
            except Exception:
                m_reqs = {}

            mastery, new_status, updated_reqs = compute_technique_mastery(
                training_minutes=new_total_mins,
                sessions_count=new_sessions,
                total_reps=new_total_reps,
                avg_score=new_avg,
                unresolved_problems_count=prob_count,
                last_trained_at_str=today_str,
                master_reqs=m_reqs,
                current_status=t.get("status", "Unlocked")
            )

            cursor.execute("""
                UPDATE techniques 
                SET training_minutes = ?,
                    sessions_count = ?,
                    total_reps_count = ?,
                    best_score = ?,
                    avg_score = ?,
                    mastery_percentage = ?,
                    user_level = ?,
                    status = ?,
                    master_requirements_json = ?,
                    last_trained_at = datetime('now', 'localtime'),
                    updated_at = datetime('now', 'localtime')
                WHERE id = ?
            """, (
                new_total_mins, new_sessions, new_total_reps, new_best, new_avg,
                mastery, max(0, min(10, round(mastery / 10))), new_status,
                json.dumps(updated_reqs), t_id
            ))

            # Auto-record track XP
            track = t.get("track", "magic")
            if track == "magic":
                cursor.execute("UPDATE user_profile SET magic_xp = magic_xp + ? WHERE id = 1", (split_mins * 5,))
            elif track == "cardistry":
                cursor.execute("UPDATE user_profile SET cardistry_xp = cardistry_xp + ? WHERE id = 1", (split_mins * 5,))
            elif track == "performance":
                cursor.execute("UPDATE user_profile SET performance_xp = performance_xp + ? WHERE id = 1", (split_mins * 5,))

    # 5. Record tagged problems if specified
    if problem_tags and technique_ids and len(technique_ids) == 1:
        for tag in problem_tags:
            cursor.execute("""
                INSERT INTO technique_problems (technique_id, priority, problem_tag, problem_text, is_resolved)
                VALUES (?, 'High', ?, ?, 0)
            """, (technique_ids[0], tag, f"Problem w sesji: {tag} ({hardest_part or what_was_problem or 'Wymaga uwagi'})"))

    # 6. Unlock eligible techniques & evaluate achievements
    unlocked_names = unlock_eligible_techniques(cursor)
    unlocked_achievements = evaluate_achievements(cursor)

    conn.commit()

    # Get updated profile
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    prof_dict = dict(cursor.fetchone())
    level_info = get_level_info(prof_dict.get("xp", 0))

    cursor.execute("SELECT * FROM training_sessions WHERE id = ?", (session_id,))
    saved_session = dict(cursor.fetchone())
    saved_session["technique_ids"] = technique_ids
    saved_session["problem_tags"] = problem_tags

    conn.close()

    return jsonify({
        "session": saved_session,
        "xp_earned": total_xp_earned,
        "new_streak": new_streak,
        "new_best_streak": new_best,
        "unlocked_techniques": unlocked_names,
        "unlocked_achievements": unlocked_achievements,
        "profile": {
            **prof_dict,
            "level_info": level_info
        }
    }), 201


@training_bp.route('/api/training/sessions', methods=['GET'])
def get_sessions():
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT s.* 
        FROM training_sessions s
        ORDER BY s.date DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))
    rows = cursor.fetchall()
    
    sessions = []
    for r in rows:
        s_dict = dict(r)
        try:
            tech_ids = json.loads(s_dict.get("technique_ids") or "[]")
        except Exception:
            tech_ids = []
        try:
            s_dict["problem_tags"] = json.loads(s_dict.get("problem_tags_json") or "[]")
        except Exception:
            s_dict["problem_tags"] = []
        
        tech_names = []
        if tech_ids:
            placeholders = ",".join("?" for _ in tech_ids)
            cursor.execute(f"SELECT id, name, category, track FROM techniques WHERE id IN ({placeholders})", tech_ids)
            tech_names = [dict(t) for t in cursor.fetchall()]

        s_dict["techniques"] = tech_names
        sessions.append(s_dict)

    conn.close()
    return jsonify(sessions)
