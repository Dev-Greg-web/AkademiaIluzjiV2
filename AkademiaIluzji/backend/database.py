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
        name TEXT DEFAULT 'Iluzjonista',
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        last_trained_date TEXT,
        total_training_minutes INTEGER DEFAULT 0,
        total_sessions_count INTEGER DEFAULT 0,
        primary_goal TEXT DEFAULT 'Opanuj Double Lift na poziomie 8/10.',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS techniques (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        user_level INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Nie rozpoczęto',
        description TEXT,
        notes TEXT,
        training_minutes INTEGER DEFAULT 0,
        sessions_count INTEGER DEFAULT 0,
        last_trained_at TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS technique_problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        technique_id INTEGER NOT NULL,
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
        what_went_well TEXT,
        what_was_problem TEXT,
        what_to_improve TEXT,
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
        notes TEXT,
        FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (technique_id) REFERENCES techniques(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        effect TEXT,
        difficulty TEXT DEFAULT 'Intermediate',
        patter TEXT,
        notes TEXT,
        techniques_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
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

    conn.commit()
    conn.close()
