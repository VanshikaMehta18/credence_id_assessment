# Database Schema Documentation

## Overview

The ID Verification System uses SQLite as its database. The database file `verification.db` is automatically created in the database directory under the root directory when the server starts for the first time.

## Tables

### sessions

Stores all verification session data including captured images and face match results.

#### Column Descriptions

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | TEXT | NO | Unique session identifier (UUID v4) |
| `id_front` | TEXT | YES | Base64-encoded front of ID image |
| `id_back` | TEXT | YES | Base64-encoded back of ID image |
| `selfie` | TEXT | YES | Base64-encoded selfie image |
| `face_match_score` | REAL | YES | Face matching score (0.00 - 1.00) |
| `face_match_result` | TEXT | YES | Face match result ('PASS' or 'FAIL') |
| `status` | TEXT | NO | Session status ('pending' or 'submitted') |
| `created_at` | DATETIME | NO | Timestamp when session was created |
| `submitted_at` | DATETIME | YES | Timestamp when session was submitted |


## Methods to View the Database

### **Method 1: Command Line (SQLite CLI)**

#### View all sessions (summary):
```bash
sqlite3 verification.db "SELECT id, status, face_match_result, face_match_score, created_at FROM sessions;"
```

#### View with better formatting:
```bash
sqlite3 verification.db << EOF
.headers on
.mode column
SELECT id, status, face_match_result, face_match_score, created_at 
FROM sessions 
ORDER BY created_at DESC;
EOF
```

#### Interactive mode:
```bash
sqlite3 verification.db
```
Then you can run queries
---

### **Method 2: GUI Database Browser**

#### **DB Browser for SQLite** (Free, Visual)
1. Download from: https://sqlitebrowser.org/
2. Install and open the app
3. Click "Open Database"
4. Navigate to: `/Users/vanshikamehta/Desktop/credence_id_assessment/verification.db`
5. Browse data visually with tables, filters, and search

---

### **Method 3: Export to CSV from the dashboard**

- Download the CSV file from the analytics dashboard by clicking on the "Export CSV" button under Recent Verification Sessions.
- This will download a CSV file containing all the sessions in the database.

---

