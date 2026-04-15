"""
Migration: add users, likes, comments tables
Run: python migrate_social.py
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres@localhost:5432/moodboard')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR UNIQUE NOT NULL,
            email VARCHAR UNIQUE NOT NULL,
            password_hash VARCHAR NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """))

    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS likes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            creator_id INTEGER REFERENCES creators(id) ON DELETE CASCADE,
            frame_id INTEGER NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT now(),
            CONSTRAINT uq_user_like UNIQUE (user_id, frame_id),
            CONSTRAINT uq_creator_like UNIQUE (creator_id, frame_id)
        );
    """))

    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            creator_id INTEGER REFERENCES creators(id) ON DELETE CASCADE,
            frame_id INTEGER NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """))

    conn.commit()

print("✅ Tables users, likes, comments created")