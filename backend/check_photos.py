import sqlite3, os

conn = sqlite3.connect('local.db')
c = conn.cursor()
c.execute('SELECT id, photo_url, status FROM cases')
rows = c.fetchall()
print(f"=== Cases ({len(rows)} total) ===")
for r in rows:
    case_id, photo_url, status = r
    exists = os.path.exists(photo_url) if photo_url else False
    print(f"  Case {case_id}: status={status}, photo_url={photo_url!r}, file_exists={exists}")
conn.close()
