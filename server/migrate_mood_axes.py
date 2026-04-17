from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres@localhost:5432/moodboard')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE frames
        ADD COLUMN IF NOT EXISTS mood_x FLOAT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS mood_y FLOAT DEFAULT NULL;
    """))
    conn.commit()

print("Столбцы mood_x, mood_y добавлены")