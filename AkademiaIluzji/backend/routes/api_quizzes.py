import json
from flask import Blueprint, jsonify, request
from database import get_db_connection
from services.xp_system import XP_REWARDS, get_level_info
from services.achievements_engine import evaluate_achievements

quizzes_bp = Blueprint('quizzes', __name__)

@quizzes_bp.route('/api/quizzes', methods=['GET'])
def get_quizzes():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT q.*, 
               COUNT(qq.id) as questions_count,
               (SELECT MAX(score) FROM quiz_attempts WHERE quiz_id = q.id) as best_score,
               (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempts_count
        FROM quizzes q
        LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
        GROUP BY q.id
    """)
    rows = cursor.fetchall()
    quizzes = [dict(r) for r in rows]
    conn.close()
    return jsonify(quizzes)


@quizzes_bp.route('/api/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,))
    quiz = cursor.fetchone()
    if not quiz:
        conn.close()
        return jsonify({"error": "Quiz nie znaleziony"}), 404

    q_dict = dict(quiz)

    cursor.execute("SELECT id, question_text, question_type, options_json, explanation FROM quiz_questions WHERE quiz_id = ?", (quiz_id,))
    questions = []
    for r in cursor.fetchall():
        item = dict(r)
        try:
            item["options"] = json.loads(item.get("options_json") or "[]")
        except Exception:
            item["options"] = []
        questions.append(item)

    q_dict["questions"] = questions
    conn.close()
    return jsonify(q_dict)


@quizzes_bp.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id):
    data = request.get_json() or {}
    user_answers = data.get('answers', {}) # question_id -> chosen_answer string

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, question_text, options_json, correct_answer, explanation FROM quiz_questions WHERE quiz_id = ?", (quiz_id,))
    questions = cursor.fetchall()

    if not questions:
        conn.close()
        return jsonify({"error": "Brak pytań w quizie"}), 400

    score = 0
    total = len(questions)
    results = []

    for q in questions:
        q_id = str(q["id"])
        chosen = str(user_answers.get(q_id, "")).strip()
        correct = str(q["correct_answer"]).strip()
        is_correct = chosen.lower() == correct.lower()

        if is_correct:
            score += 1

        results.append({
            "question_id": q["id"],
            "question_text": q["question_text"],
            "chosen_answer": chosen,
            "correct_answer": correct,
            "is_correct": is_correct,
            "explanation": q["explanation"]
        })

    passed = 1 if score >= round(total * 0.6) else 0
    xp_earned = XP_REWARDS["PASS_QUIZ"] if passed else 5
    if score == total:
        xp_earned = XP_REWARDS["PERFECT_QUIZ"]

    # Record attempt
    cursor.execute("""
        INSERT INTO quiz_attempts (quiz_id, score, total_questions, passed, xp_earned, answers_json)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (quiz_id, score, total, passed, xp_earned, json.dumps(user_answers)))

    # Award XP
    cursor.execute("UPDATE user_profile SET xp = xp + ?, updated_at = datetime('now', 'localtime') WHERE id = 1", (xp_earned,))

    # Evaluate achievements
    unlocked_achievements = evaluate_achievements(cursor)

    conn.commit()

    cursor.execute("SELECT xp FROM user_profile WHERE id = 1")
    user_xp = cursor.fetchone()[0]
    level_info = get_level_info(user_xp)

    conn.close()

    return jsonify({
        "score": score,
        "total_questions": total,
        "percentage": round((score / total) * 100),
        "passed": bool(passed),
        "xp_earned": xp_earned,
        "results": results,
        "level_info": level_info,
        "unlocked_achievements": unlocked_achievements
    })
