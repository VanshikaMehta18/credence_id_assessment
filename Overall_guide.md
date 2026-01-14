
# Overall Guide


### Analytics Dashboard 📊
- **Real-time statistics** - Total sessions, completion rate, pass rate
- **Interactive visualizations** - Doughnut charts, bar charts, line graphs
- **Session management** - View detailed session information with images
- **Data export** - Export session data to CSV
- **Beautiful UI** - Modern dark theme with smooth animations
- **Live updates** - Refresh data on demand


## Database Schema

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  id_front TEXT,
  id_back TEXT,
  selfie TEXT,
  face_match_score REAL,
  face_match_result TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME
);
```



## API Endpoints

### Create Session
```
POST /session
Response: { "sessionId": "uuid" }
```

### Upload ID Images
```
POST /session/{id}/id
Request: {
  "idFront": "<base64>",
  "idBack": "<base64>"
}
Response: { "status": "success" }
```

### Upload Selfie & Face Match
```
POST /session/{id}/selfie
Request: { "selfie": "<base64>" }
Response: {
  "score": 0.78,
  "result": "PASS"
}
```

### Submit Session
```
POST /session/{id}/submit
Response: {
  "status": "SUCCESS",
  "sessionId": "uuid",
  "result": "PASS"
}
```


### Get Session
```
GET /session/{id}
Response: {
  "id": "uuid",
  "id_front": "<base64>",
  "id_back": "<base64>",
  "selfie": "<base64>",
  "face_match_score": 0.78,
  "face_match_result": "PASS",
  "status": "submitted",
  "created_at": "timestamp",
  "submitted_at": "timestamp"
}
```


## Technology Stack

### Backend
- Node.js with Express
- SQLite for data persistence
- RESTful API endpoints

### Frontend
- Vanilla HTML/CSS/JavaScript
- face-api.js (@vladmandic/face-api) loaded from CDN for client-side face matching
- Chart.js v4.4.0 for data visualizations
- MediaDevices API for camera access
- Fetch API for backend communication

### Analytics
- Interactive dashboard with real-time data
- Chart.js for graphs and visualizations
- Responsive design with modern CSS
- CSV export functionality



## Project Structure

```
credence_id_assessment/
├── frontend/           # UI files (HTML, CSS, JS)
│   ├── index.html      # Main application entry
│   ├── dashboard.html  # Analytics dashboard
│   ├── app.js          # Core logic
│   ├── dashboard.js    # Dashboard logic
│   └── styles.css      # Styling
├── backend/            # Express server and API
│   ├── server.js       # Main server file
│   └── package.json    # Dependencies and scripts
└── database/           # SQLite database and documentation
    ├── verification.db # SQLite database
    └── DATABASE_SCHEMA.md # Database documentation
```

