import sqlite3
conn = sqlite3.connect('truck_app.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables:", cursor.fetchall())
cursor.execute("PRAGMA table_info(users);")
print("Users columns:", cursor.fetchall())
conn.close()
