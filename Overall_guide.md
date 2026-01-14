
# Overall Guide

## Features

### Identity Verification Flow
Capture ID images and a live selfie, perform server-side face matching using ML models, and review results before final submission.

### Analytics Dashboard - Realtime 
Monitor live verification sessions with interactive charts, detailed session views, exportable data, and a modern, responsive UI.


## API Endpoints

### Session Management
- `POST /session` - Create new verification session
- `POST /session/{id}/id` - Upload ID images
- `POST /session/{id}/selfie` - Upload selfie and perform face matching
- `POST /session/{id}/submit` - Submit verification session
- `GET /session/{id}` - Get session details

### Analytics
- `GET /analytics/sessions` - Get all sessions for dashboard


## Technology Stack

### Backend
- Python with Flask
- InsightFace for advanced face recognition
- SQLite for data persistence
- RESTful API endpoints

### Frontend
- Vanilla HTML/CSS/JavaScript
- Chart.js v4.4.0 for data visualizations
- MediaDevices API for camera access
- Fetch API for backend communication

### Analytics
- Interactive dashboard with real-time data
- Chart.js for graphs and visualizations
- Responsive design with modern CSS
- CSV export functionality



## Development

### Project Structure
```
credence_id_assessment/
├── backend/              # Python Flask server
│   ├── app.py           # Main application
│   ├── config.py        # Configuration settings
│   └── requirements.txt # Python dependencies
├── frontend/            # Web interface
│   ├── index.html       # Main application
│   ├── dashboard.html   # Analytics dashboard
│   ├── app.js          # Core application logic
│   ├── dashboard.js    # Dashboard logic
│   └── styles.css      # Styling
├── database/           # SQLite database
│   ├── verification.db # Database file
│   └── Database_guide.md # Database documentation
├── env.example         # Environment configuration template
└── README.md           # This file
```


## License

This project is licensed under the terms specified in the LICENSE file.
