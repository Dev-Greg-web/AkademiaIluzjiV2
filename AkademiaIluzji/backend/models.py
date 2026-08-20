import json
from datetime import datetime

class UserProfile:
    def __init__(self, id=1, name='Adept Iluzji', rank_tier='Beginner', level=1, xp=0,
                 streak=0, best_streak=0, last_trained_date=None, total_training_minutes=0,
                 total_sessions_count=0, magic_xp=0, cardistry_xp=0, performance_xp=0,
                 magic_level=1, cardistry_level=1, performance_level=1,
                 preferred_daily_minutes=20, focus_track='all',
                 primary_goal='Opanuj Double Lift na poziomie Master (80%+)',
                 onboarding_completed=1, sound_enabled=1, theme='dark',
                 created_at=None, updated_at=None):
        self.id = id
        self.name = name
        self.rank_tier = rank_tier
        self.level = level
        self.xp = xp
        self.streak = streak
        self.best_streak = best_streak
        self.last_trained_date = last_trained_date
        self.total_training_minutes = total_training_minutes
        self.total_sessions_count = total_sessions_count
        self.magic_xp = magic_xp
        self.cardistry_xp = cardistry_xp
        self.performance_xp = performance_xp
        self.magic_level = magic_level
        self.cardistry_level = cardistry_level
        self.performance_level = performance_level
        self.preferred_daily_minutes = preferred_daily_minutes
        self.focus_track = focus_track
        self.primary_goal = primary_goal
        self.onboarding_completed = onboarding_completed
        self.sound_enabled = sound_enabled
        self.theme = theme
        self.created_at = created_at
        self.updated_at = updated_at

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "rank_tier": self.rank_tier,
            "level": self.level,
            "xp": self.xp,
            "streak": self.streak,
            "best_streak": self.best_streak,
            "last_trained_date": self.last_trained_date,
            "total_training_minutes": self.total_training_minutes,
            "total_sessions_count": self.total_sessions_count,
            "magic_xp": self.magic_xp,
            "cardistry_xp": self.cardistry_xp,
            "performance_xp": self.performance_xp,
            "magic_level": self.magic_level,
            "cardistry_level": self.cardistry_level,
            "performance_level": self.performance_level,
            "preferred_daily_minutes": self.preferred_daily_minutes,
            "focus_track": self.focus_track,
            "primary_goal": self.primary_goal,
            "onboarding_completed": self.onboarding_completed,
            "sound_enabled": self.sound_enabled,
            "theme": self.theme,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


class Technique:
    def __init__(self, id=None, name='', track='magic', category='Grips', difficulty='Beginner',
                 user_level=0, mastery_percentage=0, status='Locked', description='', notes='',
                 prerequisites_json='[]', unlocks_json='[]', skill_tree_level=1,
                 training_minutes=0, sessions_count=0, total_reps_count=0,
                 best_score=0, avg_score=0, master_requirements_json='{}',
                 video_url='', last_trained_at=None, next_review_due=None,
                 created_at=None, updated_at=None, problems=None):
        self.id = id
        self.name = name
        self.track = track
        self.category = category
        self.difficulty = difficulty
        self.user_level = user_level
        self.mastery_percentage = mastery_percentage
        self.status = status
        self.description = description
        self.notes = notes
        self.prerequisites_json = prerequisites_json
        self.unlocks_json = unlocks_json
        self.skill_tree_level = skill_tree_level
        self.training_minutes = training_minutes
        self.sessions_count = sessions_count
        self.total_reps_count = total_reps_count
        self.best_score = best_score
        self.avg_score = avg_score
        self.master_requirements_json = master_requirements_json
        self.video_url = video_url
        self.last_trained_at = last_trained_at
        self.next_review_due = next_review_due
        self.created_at = created_at
        self.updated_at = updated_at
        self.problems = problems or []

    def to_dict(self):
        prereqs = []
        unlocks = []
        reqs = {}
        try:
            prereqs = json.loads(self.prerequisites_json) if isinstance(self.prerequisites_json, str) else (self.prerequisites_json or [])
        except Exception:
            prereqs = []
        try:
            unlocks = json.loads(self.unlocks_json) if isinstance(self.unlocks_json, str) else (self.unlocks_json or [])
        except Exception:
            unlocks = []
        try:
            reqs = json.loads(self.master_requirements_json) if isinstance(self.master_requirements_json, str) else (self.master_requirements_json or {})
        except Exception:
            reqs = {}

        return {
            "id": self.id,
            "name": self.name,
            "track": self.track,
            "category": self.category,
            "difficulty": self.difficulty,
            "user_level": self.user_level,
            "mastery_percentage": self.mastery_percentage,
            "status": self.status,
            "description": self.description,
            "notes": self.notes,
            "prerequisites": prereqs,
            "unlocks": unlocks,
            "skill_tree_level": self.skill_tree_level,
            "training_minutes": self.training_minutes,
            "sessions_count": self.sessions_count,
            "total_reps_count": self.total_reps_count,
            "best_score": round(self.best_score, 1),
            "avg_score": round(self.avg_score, 1),
            "master_requirements": reqs,
            "video_url": self.video_url,
            "last_trained_at": self.last_trained_at,
            "next_review_due": self.next_review_due,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "problems": self.problems
        }
