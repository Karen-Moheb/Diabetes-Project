import sqlite3

db_path = "instance/diabetes.db"

connection = sqlite3.connect(db_path)

columns = [
    row[1]
    for row in connection.execute("PRAGMA table_info(user)").fetchall()
]

if "role" not in columns:
    connection.execute(
        "ALTER TABLE user ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'"
    )
    connection.commit()
    print("role column added successfully. Existing users are users.")
else:
    print("role column already exists.")

connection.close()
