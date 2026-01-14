
# ID Verification System

A comprehensive web-based identity verification application with ID capture, face matching capabilities, and real-time analytics dashboard.


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


## Assumptions & Limitations

### Assumptions
- Users have a device with camera access
- Modern browser with MediaDevices API support
- Stable internet connection
- Well-lit environment for clear photos
- Government-issued ID with visible face photo
- Compatible browser: Chrome 53+, Firefox 36+, Safari 11+, Edge 12+



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


## License

Copyright 2015 - 2026 by Credence ID. All rights reserved.
>>>>>>> d993830 (feat: implement ID/selfie capture and face match flow)
