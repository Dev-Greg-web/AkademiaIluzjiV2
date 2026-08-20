import sqlite3
import os
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent / "database"
DB_PATH = DB_DIR / "akademia.db"

def get_db_connection():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY,
        name TEXT DEFAULT 'Adept Iluzji',
        rank_tier TEXT DEFAULT 'Beginner',
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        last_trained_date TEXT,
        total_training_minutes INTEGER DEFAULT 0,
        total_sessions_count INTEGER DEFAULT 0,
        magic_xp INTEGER DEFAULT 0,
        cardistry_xp INTEGER DEFAULT 0,
        performance_xp INTEGER DEFAULT 0,
        magic_level INTEGER DEFAULT 1,
        cardistry_level INTEGER DEFAULT 1,
        performance_level INTEGER DEFAULT 1,
        preferred_daily_minutes INTEGER DEFAULT 20,
        focus_track TEXT DEFAULT 'all',
        primary_goal TEXT DEFAULT 'Opanuj Double Lift na poziomie Master (80%+)',
        onboarding_completed INTEGER DEFAULT 1,
        sound_enabled INTEGER DEFAULT 1,
        theme TEXT DEFAULT 'dark',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS techniques (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        track TEXT DEFAULT 'magic',
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        user_level INTEGER DEFAULT 0,
        mastery_percentage INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Locked',
        description TEXT,
        notes TEXT,
        prerequisites_json TEXT DEFAULT '[]',
        unlocks_json TEXT DEFAULT '[]',
        skill_tree_level INTEGER DEFAULT 1,
        training_minutes INTEGER DEFAULT 0,
        sessions_count INTEGER DEFAULT 0,
        total_reps_count INTEGER DEFAULT 0,
        best_score REAL DEFAULT 0,
        avg_score REAL DEFAULT 0,
        master_requirements_json TEXT DEFAULT '{}',
        video_url TEXT DEFAULT '',
        last_trained_at TEXT,
        next_review_due TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS technique_problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        technique_id INTEGER NOT NULL,
        priority TEXT DEFAULT 'Medium',
        problem_tag TEXT DEFAULT 'General',
        problem_text TEXT NOT NULL,
        is_resolved INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (technique_id) REFERENCES techniques(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS training_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT DEFAULT (datetime('now', 'localtime')),
        duration_seconds INTEGER NOT NULL,
        reps_count INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 7,
        score_control INTEGER DEFAULT 7,
        score_naturalness INTEGER DEFAULT 7,
        score_timing INTEGER DEFAULT 7,
        score_confidence INTEGER DEFAULT 7,
        score_presentation INTEGER DEFAULT 7,
        what_went_well TEXT,
        what_was_problem TEXT,
        what_to_improve TEXT,
        hardest_part TEXT,
        problem_tags_json TEXT DEFAULT '[]',
        session_type TEXT DEFAULT 'daily_plan',
        xp_earned INTEGER DEFAULT 20,
        technique_ids TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS session_technique_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        technique_id INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        reps INTEGER DEFAULT 0,
        score INTEGER DEFAULT 7,
        notes TEXT,
        FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (technique_id) REFERENCES techniques(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        target_metric TEXT DEFAULT 'reps',
        current_value INTEGER DEFAULT 0,
        target_value INTEGER DEFAULT 100,
        deadline TEXT,
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT DEFAULT '🏆',
        category TEXT DEFAULT 'training',
        xp_reward INTEGER DEFAULT 50,
        required_count INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        achievement_id INTEGER NOT NULL,
        unlocked INTEGER DEFAULT 0,
        unlocked_at TEXT,
        current_progress INTEGER DEFAULT 0,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT DEFAULT 'Beginner',
        description TEXT,
        xp_reward INTEGER DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT DEFAULT 'single_choice',
        options_json TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        passed INTEGER DEFAULT 1,
        xp_earned INTEGER DEFAULT 20,
        answers_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        effect TEXT,
        effect_type TEXT DEFAULT 'ambitious',
        difficulty TEXT DEFAULT 'Intermediate',
        patter TEXT,
        misdirection_tips TEXT,
        reset_instructions TEXT,
        notes TEXT,
        techniques_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS performance_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER,
        routine_name TEXT NOT NULL,
        venue TEXT DEFAULT 'Znajomi / Kameralnie',
        audience_reaction TEXT DEFAULT 'Zachwyt',
        overall_score INTEGER DEFAULT 8,
        checklist_json TEXT DEFAULT '{}',
        what_worked TEXT,
        what_to_improve TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS video_recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        technique_id INTEGER,
        routine_id INTEGER,
        title TEXT NOT NULL,
        stage_tag TEXT DEFAULT 'Trening',
        notes TEXT,
        video_data TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (technique_id) REFERENCES techniques(id) ON DELETE SET NULL,
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'Ogólne',
        technique_id INTEGER,
        routine_id INTEGER,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (technique_id) REFERENCES techniques(id) ON DELETE SET NULL,
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL
    );
    """)

    # Run auto-migration for existing DB schemas (add columns safely if they do not exist)
    columns_to_add = [
        ("user_profile", "rank_tier", "TEXT DEFAULT 'Beginner'"),
        ("user_profile", "best_streak", "INTEGER DEFAULT 0"),
        ("user_profile", "magic_xp", "INTEGER DEFAULT 0"),
        ("user_profile", "cardistry_xp", "INTEGER DEFAULT 0"),
        ("user_profile", "performance_xp", "INTEGER DEFAULT 0"),
        ("user_profile", "magic_level", "INTEGER DEFAULT 1"),
        ("user_profile", "cardistry_level", "INTEGER DEFAULT 1"),
        ("user_profile", "performance_level", "INTEGER DEFAULT 1"),
        ("user_profile", "preferred_daily_minutes", "INTEGER DEFAULT 20"),
        ("user_profile", "focus_track", "TEXT DEFAULT 'all'"),
        ("user_profile", "onboarding_completed", "INTEGER DEFAULT 1"),
        ("user_profile", "sound_enabled", "INTEGER DEFAULT 1"),
        ("user_profile", "theme", "TEXT DEFAULT 'dark'"),
        ("techniques", "track", "TEXT DEFAULT 'magic'"),
        ("techniques", "mastery_percentage", "INTEGER DEFAULT 0"),
        ("techniques", "prerequisites_json", "TEXT DEFAULT '[]'"),
        ("techniques", "unlocks_json", "TEXT DEFAULT '[]'"),
        ("techniques", "skill_tree_level", "INTEGER DEFAULT 1"),
        ("techniques", "total_reps_count", "INTEGER DEFAULT 0"),
        ("techniques", "best_score", "REAL DEFAULT 0"),
        ("techniques", "avg_score", "REAL DEFAULT 0"),
        ("techniques", "master_requirements_json", "TEXT DEFAULT '{}'"),
        ("techniques", "video_url", "TEXT DEFAULT ''"),
        ("techniques", "next_review_due", "TEXT"),
        ("technique_problems", "priority", "TEXT DEFAULT 'Medium'"),
        ("technique_problems", "problem_tag", "TEXT DEFAULT 'General'"),
        ("training_sessions", "score_control", "INTEGER DEFAULT 7"),
        ("training_sessions", "score_naturalness", "INTEGER DEFAULT 7"),
        ("training_sessions", "score_timing", "INTEGER DEFAULT 7"),
        ("training_sessions", "score_confidence", "INTEGER DEFAULT 7"),
        ("training_sessions", "score_presentation", "INTEGER DEFAULT 7"),
        ("training_sessions", "hardest_part", "TEXT"),
        ("training_sessions", "problem_tags_json", "TEXT DEFAULT '[]'"),
        ("training_sessions", "session_type", "TEXT DEFAULT 'daily_plan'"),
        ("routines", "effect_type", "TEXT DEFAULT 'ambitious'"),
        ("routines", "misdirection_tips", "TEXT"),
        ("routines", "reset_instructions", "TEXT")
    ]

    for table, col, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            # Column already exists
            pass

    conn.commit()
    conn.close()
