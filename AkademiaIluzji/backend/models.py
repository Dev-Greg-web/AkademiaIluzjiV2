import json
from datetime import datetime

class UserProfile:
    def __init__(self, id=1, name='Iluzjonista', level=1, xp=0, streak=0, 
                 last_trained_date=None, total_training_minutes=0, 
                 total_sessions_count=0, primary_goal='Opanuj Double Lift na poziomie 8/10.',
                 created_at=None, updated_at=None):
        self.id = id
        self.name = name
        self.level = level
        self.xp = xp
        self.streak = streak
        self.last_trained_date = last_trained_date
        self.total_training_minutes = total_training_minutes
        self.total_sessions_count = total_sessions_count
        self.primary_goal = primary_goal
        self.created_at = created_at
        self.updated_at = updated_at

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "level": self.level,
            "xp": self.xp,
            "streak": self.streak,
            "last_trained_date": self.last_trained_date,
            "total_training_minutes": self.total_training_minutes,
            "total_sessions_count": self.total_sessions_count,
            "primary_goal": self.primary_goal,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


class Technique:
    def __init__(self, id=None, name='', category='Fundamenty', difficulty='Beginner',
                 user_level=0, status='Nie rozpoczęto', description='', notes='',
                 training_minutes=0, sessions_count=0, last_trained_at=None,
                 created_at=None, updated_at=None, problems=None):
        self.id = id
        self.name = name
        self.category = category
        self.difficulty = difficulty
        self.user_level = user_level
        self.status = status
        self.description = description
        self.notes = notes
        self.training_minutes = training_minutes
        self.sessions_count = sessions_count
        self.last_trained_at = last_trained_at
        self.created_at = created_at
        self.updated_at = updated_at
        self.problems = problems or []

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "difficulty": self.difficulty,
            "user_level": self.user_level,
            "status": self.status,
            "description": self.description,
            "notes": self.notes,
            "training_minutes": self.training_minutes,
            "sessions_count": self.sessions_count,
            "last_trained_at": self.last_trained_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "problems": self.problems
        }


class TrainingSession:
    def __init__(self, id=None, date=None, duration_seconds=0, reps_count=0,
                 rating=7, what_went_well='', what_was_problem='', what_to_improve='',
                 xp_earned=20, technique_ids=None, notes='', created_at=None, items=None):
        self.id = id
        self.date = date
        self.duration_seconds = duration_seconds
        self.reps_count = reps_count
        self.rating = rating
        self.what_went_well = what_went_well
        self.what_was_problem = what_was_problem
        self.what_to_improve = what_to_improve
        self.xp_earned = xp_earned
        self.technique_ids = technique_ids or []
        self.notes = notes
        self.created_at = created_at
        self.items = items or []

    def to_dict(self):
        tech_ids = self.technique_ids
        if isinstance(tech_ids, str):
            try:
                tech_ids = json.loads(tech_ids)
            except Exception:
                tech_ids = [tech_ids] if tech_ids else []
        return {
            "id": self.id,
            "date": self.date,
            "duration_seconds": self.duration_seconds,
            "duration_minutes": round(self.duration_seconds / 60, 1),
            "reps_count": self.reps_count,
            "rating": self.rating,
            "what_went_well": self.what_went_well,
            "what_was_problem": self.what_was_problem,
            "what_to_improve": self.what_to_improve,
            "xp_earned": self.xp_earned,
            "technique_ids": tech_ids,
            "notes": self.notes,
            "created_at": self.created_at,
            "items": self.items
        }


class Routine:
    def __init__(self, id=None, name='', description='', effect='',
                 difficulty='Intermediate', patter='', notes='',
                 techniques_json='[]', created_at=None, updated_at=None):
        self.id = id
        self.name = name
        self.description = description
        self.effect = effect
        self.difficulty = difficulty
        self.patter = patter
        self.notes = notes
        self.techniques_json = techniques_json
        self.created_at = created_at
        self.updated_at = updated_at

    def to_dict(self):
        techs = []
        if isinstance(self.techniques_json, str):
            try:
                techs = json.loads(self.techniques_json)
            except Exception:
                techs = []
        elif isinstance(self.techniques_json, list):
            techs = self.techniques_json

        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "effect": self.effect,
            "difficulty": self.difficulty,
            "patter": self.patter,
            "notes": self.notes,
            "techniques": techs,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


class Note:
    def __init__(self, id=None, title='', content='', category='Ogólne',
                 technique_id=None, routine_id=None, created_at=None, updated_at=None,
                 technique_name=None, routine_name=None):
        self.id = id
        self.title = title
        self.content = content
        self.category = category
        self.technique_id = technique_id
        self.routine_id = routine_id
        self.created_at = created_at
        self.updated_at = updated_at
        self.technique_name = technique_name
        self.routine_name = routine_name

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "technique_id": self.technique_id,
            "routine_id": self.routine_id,
            "technique_name": self.technique_name,
            "routine_name": self.routine_name,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
