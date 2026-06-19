import sqlite3
import os

DB_PATH = "signbridge.db"

def init_db():
    """Initializes the SQLite database with the requested tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create translations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS translations (
        id TEXT PRIMARY KEY,
        input_type TEXT NOT NULL,
        extracted_text TEXT NOT NULL,
        language TEXT NOT NULL,
        confidence REAL NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Create settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        language TEXT NOT NULL DEFAULT 'English',
        auto_speech INTEGER NOT NULL DEFAULT 1,
        auto_save INTEGER NOT NULL DEFAULT 1,
        theme TEXT NOT NULL DEFAULT 'Dark'
    )
    """)

    # Populate settings table with defaults if empty
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO settings (language, auto_speech, auto_save, theme)
        VALUES ('English', 1, 1, 'Dark')
        """)

    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        username TEXT,
        created_at TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

def get_db_connection():
    """Returns a thread-safe connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
