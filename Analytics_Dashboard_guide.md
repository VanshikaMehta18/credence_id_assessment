# Analytics Dashboard Guide


## How to Access

Dashboard URL: http://localhost:{PORT}/dashboard.html
(The server automatically logs this URL when you start it)

---

## Dashboard Features

### 1. Statistics Cards (Top Section)
- Total Sessions - All verification attempts
- Completed - Successfully submitted verifications
- Pending - Incomplete sessions
- Pass Rate - Percentage of successful face matches

### 2. Interactive Charts

#### Session Status Distribution (Doughnut Chart)
- Visual breakdown of submitted vs pending sessions
- Hover to see exact counts

#### Face Match Results (Doughnut Chart)
- Pass vs Fail vs No Result
- Shows verification success rate

#### Face Match Score Distribution (Bar Chart)
- Histogram showing confidence score ranges
- Helps identify verification quality patterns

#### Sessions Over Time (Line Chart)
- Daily verification activity
- Track usage trends

### 3. Recent Sessions Table
- Session ID (clickable to view details)
- Status badge (submitted/pending)
- Result badge (pass/fail)
- Match score
- Timestamps
- View button - Opens detailed modal

### 4. Session Detail Modal
Click "View" on any session to see:
- Complete session information
- All captured images (ID front, ID back, selfie)
- Face match score and result
- Full timestamps

---

## Dashboard Actions

### Refresh Data
Click the Refresh Data button to reload all statistics and charts from the database.

### Export to CSV
Click the Export CSV button to download all session data as a spreadsheet.

### Back to App
Click Back to App to return to the verification interface.

---

### Data Flow
```
SQLite DB → Flask API → Dashboard JS → Chart.js → Beautiful Graphs
```

---


## Color Coding

- **Green** - Success, Pass, Completed
- **Yellow/Orange** - Pending, In Progress
- **Red** - Failed, Error
- **Blue** - Info, Primary Actions
- **Purple** - Accents, Highlights

---
