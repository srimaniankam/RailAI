import sqlite3
from datetime import datetime

DATABASE_NAME = "railai.db"

def init_database():
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint TEXT NOT NULL,
            category TEXT,
            issue TEXT,
            train_number TEXT,
            coach TEXT,
            location TEXT,
            severity TEXT,
            safety_risk BOOLEAN,
            department TEXT,
            confidence REAL,
            decision TEXT,
            status TEXT,
            created_at TEXT
        )
    """)
    connection.commit()
    connection.close()

def save_complaint(data):
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()
    cursor.execute("""
        INSERT INTO complaints (
            complaint, category, issue, train_number, coach, location,
            severity, safety_risk, department, confidence, decision,
            status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("complaint"), data.get("category"), data.get("issue"),
        data.get("train_number"), data.get("coach"), data.get("location"),
        data.get("severity"), data.get("safety_risk"), data.get("department"),
        data.get("confidence"), data.get("decision"), "Pending",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    connection.commit()
    complaint_id = cursor.lastrowid
    connection.close()
    return complaint_id

def get_complaints():
    connection = sqlite3.connect(DATABASE_NAME)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM complaints ORDER BY id DESC")
    rows = cursor.fetchall()
    connection.close()
    return [dict(row) for row in rows]

def update_complaint_status(complaint_id, status):
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()
    cursor.execute(
        "UPDATE complaints SET status = ? WHERE id = ?",
        (status, complaint_id)
    )
    connection.commit()
    updated_rows = cursor.rowcount
    connection.close()
    return updated_rows