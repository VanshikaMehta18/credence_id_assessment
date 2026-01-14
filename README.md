
# ID Verification System

A comprehensive web-based identity verification application with ID capture, face matching capabilities, and real-time analytics dashboard.

## Features

### Core Verification
- 3-step verification flow: ID Capture → Selfie & Face Match → Review & Submit
- Live camera preview for capturing ID front, back, and selfie
- Real-time face matching using face-api.js
- Persistent storage with SQLite database
- Clean, modern UI with responsive design
- RESTful API architecture

### Analytics Dashboard 📊
- **Real-time statistics** - Total sessions, completion rate, pass rate
- **Interactive visualizations** - Doughnut charts, bar charts, line graphs
- **Session management** - View detailed session information with images
- **Data export** - Export session data to CSV
- **Beautiful UI** - Modern dark theme with smooth animations
- **Live updates** - Refresh data on demand

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

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone or extract the project:
```bash
cd credence_id_assessment/backend
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

1. Start the backend server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

2. Open your browser and navigate to:

**Main Application:**
```
http://localhost:3000
```

**Analytics Dashboard:**
```
http://localhost:3000/dashboard.html
```

3. Allow camera permissions when prompted for the verification flow


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

## Face Match Library

This application uses **@vladmandic/face-api** (version 1.7.13), loaded from CDN, a modern fork of face-api.js that provides:

- Face detection using SSD MobileNet V1
- 68-point facial landmark detection
- Face recognition with 128-dimensional face descriptors
- Euclidean distance calculation for face matching

Face matching is performed **client-side** in the browser, which:
- Reduces server load
- Provides faster processing
- Keeps biometric processing in the user's control
- Simplifies deployment (no native dependencies)

### Face Match Algorithm

1. Load face-api.js models from CDN on first use
2. Detect faces in both ID and selfie images
3. Extract 128-dimensional face descriptors
4. Calculate Euclidean distance between descriptors
5. Convert distance to similarity score (0-1 range)
6. Apply threshold: score ≥ 0.6 = PASS, score < 0.6 = FAIL
7. Send results to server for storage


## Usage Flow

1. **Step 1: Capture ID**
   - Capture front of ID
   - Capture back of ID
   - Both images required to proceed

2. **Step 2: Capture Selfie**
   - Take a selfie photo
   - System automatically performs face match
   - View match score and result

3. **Step 3: Review & Submit**
   - Review all captured images
   - Verify face match result
   - Submit verification

4. **Completion**
   - Receive session ID and confirmation
   - Data persisted in database

## Assumptions & Limitations

### Assumptions
- Users have a device with camera access
- Modern browser with MediaDevices API support
- Stable internet connection
- Well-lit environment for clear photos
- Government-issued ID with visible face photo

### Limitations
- Face matching accuracy depends on image quality
- Requires camera permissions
- Base64 storage increases database size
- Single face detection per image
- No authentication/authorization
- No image compression optimization
- Face match threshold is fixed at 0.6

## Browser Compatibility

- Chrome 53+
- Firefox 36+
- Safari 11+
- Edge 12+

## Security Considerations

This is a demonstration application. For production use, consider:
- HTTPS for secure transmission
- Image encryption at rest
- Rate limiting on API endpoints
- Input validation and sanitization
- Authentication and authorization
- GDPR compliance for biometric data
- Audit logging

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

## Troubleshooting

### Camera not working
- Ensure browser has camera permissions
- Check if camera is being used by another application
- Try using HTTPS (required by some browsers)

### Face match failing
- Ensure good lighting conditions
- Face should be clearly visible in both ID and selfie
- Remove glasses or accessories if possible
- Try retaking photos

### Server errors
- Check if port 3000 is available
- Ensure all dependencies are installed
- Verify models are downloaded correctly

## License

Copyright 2015 - 2026 by Credence ID. All rights reserved.
>>>>>>> d993830 (feat: implement ID/selfie capture and face match flow)
