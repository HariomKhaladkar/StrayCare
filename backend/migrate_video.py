"""
migrate_video.py
─────────────────────────────────────────────────────────────────
One-shot migration:  adds `video_url TEXT` column to the `pets`
table in the existing SQLite database without touching any data.

Run from the backend directory:
    cd C:\\Users\\Hariom\\SC\\backend
    python migrate_video.py
"""

import sqlite3
import os

# Path to your SQLite database (adjust if needed)
DB_PATH = os.path.join(os.path.dirname(__file__), "straycare.db")

def migrate():
    if not os.path.exists(DB_PATH):
        # Try the fallback name
        alt = os.path.join(os.path.dirname(__file__), "local.db")
        if os.path.exists(alt):
            db_path = alt
        else:
            print(f"❌  Database not found at {DB_PATH} or {alt}")
            return
    else:
        db_path = DB_PATH

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check whether the column already exists
    cursor.execute("PRAGMA table_info(pets);")
    columns = [row[1] for row in cursor.fetchall()]

    if "video_url" in columns:
        print("ℹ️  Column `video_url` already exists in `pets` — nothing to do.")
    else:
        cursor.execute("ALTER TABLE pets ADD COLUMN video_url TEXT;")
        conn.commit()
        print("✅  Migration complete — `video_url TEXT` added to `pets` table.")

    conn.close()

if __name__ == "__main__":
    migrate()
