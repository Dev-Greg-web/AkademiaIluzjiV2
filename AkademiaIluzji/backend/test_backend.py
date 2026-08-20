import unittest
import json
import os
import shutil
from pathlib import Path
from app import create_app
from database import DB_PATH, DB_DIR, init_db
from seed import seed_database
from services.mastery_engine import compute_technique_mastery
from services.xp_system import get_level_info, update_user_streak
from services.recommendation_engine import get_next_single_step, generate_daily_training_plan
from services.routine_generator import generate_matching_routines

class CardMagicCoachTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Reset test DB
        if DB_PATH.exists():
            try:
                os.remove(DB_PATH)
            except Exception:
                pass
        init_db()
        seed_database()

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_01_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "online")
        self.assertIn("CARD MAGIC COACH", data["app"])

    def test_02_profile_and_level_tiers(self):
        res = self.client.get('/api/profile')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("level_info", data)
        self.assertIn("track_levels", data)
        self.assertEqual(data["rank_tier"], "Beginner")

    def test_03_techniques_and_skill_tree(self):
        res = self.client.get('/api/techniques')
        self.assertEqual(res.status_code, 200)
        techs = json.loads(res.data)
        self.assertGreaterEqual(len(techs), 15)

        # Check skill tree endpoint
        res_tree = self.client.get('/api/techniques/skill-tree')
        self.assertEqual(res_tree.status_code, 200)
        tree = json.loads(res_tree.data)
        self.assertIn("levels", tree)
        self.assertGreaterEqual(len(tree["levels"]), 4)

    def test_04_recommendation_and_next_step(self):
        res = self.client.get('/api/training/next-step')
        self.assertEqual(res.status_code, 200)
        step = json.loads(res.data)
        self.assertIn("action_text", step)
        self.assertIn("reason", step)

        # Generate custom plan for 15 minutes
        res_plan = self.client.post('/api/training/generate', json={"duration_minutes": 15})
        self.assertEqual(res_plan.status_code, 200)
        plan = json.loads(res_plan.data)
        self.assertEqual(plan["total_minutes"], 15)
        self.assertGreaterEqual(len(plan["plan_items"]), 2)

    def test_05_training_finish_multi_dimensional(self):
        res = self.client.post('/api/training/finish', json={
            "duration_seconds": 600,
            "reps_count": 50,
            "rating": 8,
            "score_control": 9,
            "score_naturalness": 8,
            "score_timing": 8,
            "score_confidence": 9,
            "score_presentation": 8,
            "what_went_well": "Czysty obrót kart",
            "hardest_part": "Napięcie w kciuku",
            "problem_tags": ["Tension"],
            "technique_ids": [1]
        })
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertGreater(data["xp_earned"], 0)
        self.assertIn("unlocked_achievements", data)

    def test_06_quizzes_system(self):
        res = self.client.get('/api/quizzes')
        self.assertEqual(res.status_code, 200)
        quizzes = json.loads(res.data)
        self.assertGreaterEqual(len(quizzes), 1)

        quiz_id = quizzes[0]["id"]
        res_q = self.client.get(f'/api/quizzes/{quiz_id}')
        self.assertEqual(res_q.status_code, 200)

        # Submit quiz
        res_sub = self.client.post(f'/api/quizzes/{quiz_id}/submit', json={
            "answers": {}
        })
        self.assertEqual(res_sub.status_code, 200)
        sub_data = json.loads(res_sub.data)
        self.assertIn("score", sub_data)

    def test_07_achievements_system(self):
        res = self.client.get('/api/achievements')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("achievements", data)
        self.assertGreaterEqual(len(data["achievements"]), 10)

    def test_08_goals_system(self):
        res = self.client.post('/api/goals', json={
            "title": "Przetestuj cel",
            "target_value": 50
        })
        self.assertEqual(res.status_code, 201)
        goal = json.loads(res.data)
        goal_id = goal["id"]

        res_update = self.client.patch(f'/api/goals/{goal_id}/progress', json={"current_value": 50})
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(json.loads(res_update.data)["goal"]["status"], "completed")

    def test_09_routines_and_generator(self):
        res = self.client.get('/api/routines')
        self.assertEqual(res.status_code, 200)
        routines = json.loads(res.data)
        self.assertGreaterEqual(len(routines), 3)

        res_gen = self.client.get('/api/routines/generator')
        self.assertEqual(res_gen.status_code, 200)
        gen_data = json.loads(res_gen.data)
        self.assertIn("ready", gen_data)
        self.assertIn("one_move_away", gen_data)

    def test_10_context_generator_modes(self):
        for mode in ['quick', 'full', 'training', 'trick', 'session_review']:
            res = self.client.post('/api/context', json={"type": mode})
            self.assertEqual(res.status_code, 200)
            data = json.loads(res.data)
            self.assertIn("CARD MAGIC COACH", data["context_text"])

    def test_11_api_404_json_protection(self):
        res = self.client.get('/api/nonexistent-route')
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.content_type, "application/json")
        data = json.loads(res.data)
        self.assertEqual(data.get("error"), "Endpoint not found")

if __name__ == '__main__':
    unittest.main()
