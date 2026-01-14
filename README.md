# Credence ID Assessment System

A web-based identity verification system with ID capture and face matching capabilities.

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. (Optional) Configure environment variables:
   Copy `env.example` to `.env` and modify as needed:
   ```bash
   cp ../env.example ../.env
   ```

## How to Run Frontend and Backend

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   python app.py
   ```

The server will start on the configured port (default: 3000)

### Access the Application
- Main Application: http://localhost:{PORT}
- Analytics Dashboard: http://localhost:{PORT}/dashboard.html

## Face Match Library Used

This system uses **InsightFace** library for advanced face detection and matching. InsightFace provides robust ML models for accurate facial recognition and comparison.

## Assumptions and Limitations

- Requires good lighting conditions for optimal face detection
- Face should be clearly visible and centered in images
- System works best with frontal face images
- Performance may vary based on hardware capabilities
- Requires camera access for image capture functionality
