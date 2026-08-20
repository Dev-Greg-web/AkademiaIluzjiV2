import unittest
import json
import os
import tempfile
from app import create_app
from database import init_db, get_db_connection
from seed import seed_database, DEFAULT_TECHNIQUES

def reset_test_db():
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
    seed_database()

class AkademiaIluzjiBackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        reset_test_db()
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "online")

    def test_02_profile_and_seed(self):
        res = self.client.get('/api/profile')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("level", data)
        self.assertIn("xp", data)
        self.assertIn("level_info", data)
        self.assertEqual(data["level_info"]["level"], 1)

    def test_03_techniques_list_and_levels(self):
        res = self.client.get('/api/techniques')
        self.assertEqual(res.status_code, 200)
        techs = res.get_json()
        self.assertGreaterEqual(len(techs), 23)
        
        # Verify Double Lift exists
        dl = next((t for t in techs if t["name"] == "Double Lift"), None)
        self.assertIsNotNone(dl)
        self.assertEqual(dl["status"], "Nie rozpoczęto")

        # Test updating Double Lift level to 7/10
        tech_id = dl["id"]
        res_lvl = self.client.patch(f'/api/techniques/{tech_id}/level', json={"user_level": 7})
        self.assertEqual(res_lvl.status_code, 200)
        lvl_data = res_lvl.get_json()
        self.assertEqual(lvl_data["technique"]["user_level"], 7)
        self.assertEqual(lvl_data["technique"]["status"], "W trakcie")
        self.assertGreater(lvl_data["xp_gained"], 0)

    def test_04_problems_crud(self):
        # Find Double Lift
        res = self.client.get('/api/techniques?search=Double+Lift')
        dl = res.get_json()[0]
        tech_id = dl["id"]

        # Add problem
        res_p = self.client.post(f'/api/techniques/{tech_id}/problems', json={
            "problem_text": "Czasami karty się rozjeżdżają przy obrocie"
        })
        self.assertEqual(res_p.status_code, 201)
        prob = res_p.get_json()
        self.assertEqual(prob["problem_text"], "Czasami karty się rozjeżdżają przy obrocie")
        self.assertEqual(prob["is_resolved"], 0)

        # Toggle resolved
        prob_id = prob["id"]
        res_res = self.client.put(f'/api/problems/{prob_id}', json={"is_resolved": 1})
        self.assertEqual(res_res.status_code, 200)
        self.assertEqual(res_res.get_json()["problem"]["is_resolved"], 1)

    def test_05_training_engine_and_finish_session(self):
        # Generate 30 min workout plan
        res_gen = self.client.post('/api/training/generate', json={"duration_minutes": 30})
        self.assertEqual(res_gen.status_code, 200)
        plan = res_gen.get_json()
        self.assertEqual(plan["total_minutes"], 30)
        self.assertGreaterEqual(len(plan["plan_items"]), 3)

        # Start session (+5 XP)
        res_start = self.client.post('/api/training/start')
        self.assertEqual(res_start.status_code, 200)

        # Finish session (+20 XP + bonuses)
        tech_ids = [plan["plan_items"][0]["technique_id"]]
        res_fin = self.client.post('/api/training/finish', json={
            "duration_seconds": 600, # 10 mins
            "reps_count": 50,
            "rating": 8,
            "what_went_well": "Czysty dźwięk i get-ready",
            "what_was_problem": "Lekkie napięcie w kciuku",
            "what_to_improve": "Luźniejszy chwyt",
            "technique_ids": tech_ids,
            "notes": "Bardzo dobra sesja wieczorna"
        })
        self.assertEqual(res_fin.status_code, 201)
        fin_data = res_fin.get_json()
        self.assertGreaterEqual(fin_data["xp_earned"], 25)
        self.assertGreaterEqual(fin_data["new_streak"], 1)

    def test_06_gpt_context_generation(self):
        for mode in ['quick', 'full', 'training', 'trick']:
            res = self.client.get(f'/api/context?type={mode}')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data["type"], mode)
            self.assertIn("AKADEMIA ILUZJI", data["context_text"])
            self.assertIn("INSTRUKCJA DLA CHATGPT", data["context_text"])

    def test_07_routines_and_notes(self):
        # Check seeded routine
        res_r = self.client.get('/api/routines')
        self.assertEqual(res_r.status_code, 200)
        routines = res_r.get_json()
        self.assertGreaterEqual(len(routines), 1)

        # Create note
        res_n = self.client.post('/api/notes', json={
            "title": "Sekret kątów",
            "content": "Kąt 45 stopni względem widza z lewej strony jest najbardziej krytyczny.",
            "category": "Teoria"
        })
        self.assertEqual(res_n.status_code, 201)

    def test_08_progress_and_charts(self):
        res_prog = self.client.get('/api/progress/summary')
        self.assertEqual(res_prog.status_code, 200)
        p_data = res_prog.get_json()
        self.assertIn("techniques", p_data)
        self.assertIn("mastery_rate", p_data["techniques"])

        res_act = self.client.get('/api/progress/activity-30-days')
        self.assertEqual(res_act.status_code, 200)
        self.assertEqual(len(res_act.get_json()), 30)

    def test_09_export_import_json(self):
        res_exp = self.client.get('/api/settings/export-json')
        self.assertEqual(res_exp.status_code, 200)
        backup = res_exp.get_json()
        self.assertEqual(backup["app"], "Akademia Iluzji")
        self.assertIn("data", backup)

        # Import test
        res_imp = self.client.post('/api/settings/import-json', json=backup)
        self.assertEqual(res_imp.status_code, 200)
        self.assertTrue(res_imp.get_json()["success"])

    def test_10_spa_frontend_serving(self):
        # 1. Root / should return index.html (200)
        res_root = self.client.get('/')
        self.assertEqual(res_root.status_code, 200)
        self.assertIn(b'<!doctype html>', res_root.data)
        self.assertIn(b'Akademia Iluzji', res_root.data)

        # 2. SPA client routes should fallback to index.html (200)
        res_techniques = self.client.get('/techniques')
        self.assertEqual(res_techniques.status_code, 200)
        self.assertIn(b'<!doctype html>', res_techniques.data)

        res_training = self.client.get('/training')
        self.assertEqual(res_training.status_code, 200)
        self.assertIn(b'<!doctype html>', res_training.data)

        res_context = self.client.get('/context')
        self.assertEqual(res_context.status_code, 200)
        self.assertIn(b'<!doctype html>', res_context.data)

        # 3. Static assets should be served
        res_favicon = self.client.get('/favicon.svg')
        self.assertEqual(res_favicon.status_code, 200)

    def test_11_api_404_json(self):
        # Unknown API endpoints MUST return JSON 404 and NOT index.html
        res_api_404 = self.client.get('/api/unknown-endpoint')
        self.assertEqual(res_api_404.status_code, 404)
        data = res_api_404.get_json()
        self.assertIsNotNone(data)
        self.assertEqual(data.get("error"), "Endpoint not found")

        # Unknown POST API endpoint
        res_api_post_404 = self.client.post('/api/unknown-action')
        self.assertEqual(res_api_post_404.status_code, 404)
        data_post = res_api_post_404.get_json()
        self.assertIsNotNone(data_post)
        self.assertEqual(data_post.get("error"), "Endpoint not found")

if __name__ == '__main__':
    unittest.main()
