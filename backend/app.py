from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import uuid
import base64
import io
from datetime import datetime
import os
import warnings
warnings.filterwarnings("ignore", message="Error fetching version info")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from config import Config

try:
    from PIL import Image
    import insightface
    import numpy as np
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    Image = None
    insightface = None
    np = None
    FACE_RECOGNITION_AVAILABLE = False

app = Flask(__name__)
CORS(app)
DATABASE_PATH = Config.DATABASE_PATH

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            id_front TEXT,
            id_back TEXT,
            selfie TEXT,
            face_match_score REAL,
            face_match_result TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            submitted_at DATETIME
        )
    ''')
    conn.commit()
    conn.close()

def decode_base64_image(base64_string):
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]

        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return image
    except Exception as e:
        raise ValueError(f"Failed to decode base64 image: {str(e)}")

def extract_face_encoding(image):
    try:
        # Convert PIL to numpy array
        image_array = np.array(image)

        # Find face locations
        face_locations = face_recognition.face_locations(image_array)

        if not face_locations:
            raise ValueError("No face detected in image")

        # Get face encodings
        face_encodings = face_recognition.face_encodings(image_array, face_locations)

        if not face_encodings:
            raise ValueError("Could not encode face in image")

        return face_encodings[0]  # Return first face found

    except Exception as e:
        raise ValueError(f"Face encoding failed: {str(e)}")

def compare_faces(id_image, selfie_image):
    if not FACE_RECOGNITION_AVAILABLE:
        # Return a mock result for testing when face recognition is not available
        print("⚠️  Face recognition not available - returning mock result")
        return {
            'score': 0.75,
            'result': 'PASS',
            'distance': 0.25,
            'note': 'Mock result - face recognition libraries not installed'
        }

    try:
        model = insightface.app.FaceAnalysis(name='buffalo_l')
        model.prepare(ctx_id=-1, det_size=(640, 640))

        id_array = np.array(id_image)
        selfie_array = np.array(selfie_image)

        id_faces = model.get(id_array)
        selfie_faces = model.get(selfie_array)

        if not id_faces:
            raise ValueError("No face detected in ID image")
        if not selfie_faces:
            raise ValueError("No face detected in selfie image")

        id_embedding = id_faces[0].embedding
        selfie_embedding = selfie_faces[0].embedding

        similarity = np.dot(id_embedding, selfie_embedding) / (
            np.linalg.norm(id_embedding) * np.linalg.norm(selfie_embedding)
        )

        distance = 1 - similarity

        result = 'PASS' if distance <= 0.4 else 'FAIL'

        return {
            'score': round(float(similarity), 2),
            'result': result,
            'distance': round(float(distance), 4)
        }

    except Exception as e:
        raise ValueError(f"Face comparison failed: {str(e)}")

@app.route('/session', methods=['POST'])
def create_session():
    session_id = str(uuid.uuid4())
    conn = get_db_connection()
    conn.execute('INSERT INTO sessions (id) VALUES (?)', (session_id,))
    conn.commit()
    conn.close()

    return jsonify({'sessionId': session_id})

@app.route('/session/<session_id>/id', methods=['POST'])
def upload_id_images(session_id):
    data = request.get_json()

    if not data or 'idFront' not in data or 'idBack' not in data:
        return jsonify({'error': 'Missing idFront or idBack images'}), 400

    conn = get_db_connection()
    conn.execute(
        'UPDATE sessions SET id_front = ?, id_back = ? WHERE id = ?',
        (data['idFront'], data['idBack'], session_id)
    )
    conn.commit()
    conn.close()

    return jsonify({'status': 'success'})

@app.route('/session/<session_id>/selfie', methods=['POST'])
def upload_selfie(session_id):
    data = request.get_json()

    if not data or 'selfie' not in data:
        return jsonify({'error': 'Missing selfie image'}), 400

    try:
        conn = get_db_connection()
        session = conn.execute('SELECT id_front FROM sessions WHERE id = ?', (session_id,)).fetchone()
        conn.close()

        if not session or not session['id_front']:
            return jsonify({'error': 'ID images not found for session'}), 400

        id_image = decode_base64_image(session['id_front'])
        selfie_image = decode_base64_image(data['selfie'])

        match_result = compare_faces(id_image, selfie_image)

        conn = get_db_connection()
        conn.execute(
            'UPDATE sessions SET selfie = ?, face_match_score = ?, face_match_result = ? WHERE id = ?',
            (data['selfie'], match_result['score'], match_result['result'], session_id)
        )
        conn.commit()
        conn.close()

        return jsonify(match_result)

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Face matching failed: {str(e)}'}), 500

@app.route('/session/<session_id>/submit', methods=['POST'])
def submit_session(session_id):
    conn = get_db_connection()
    conn.execute(
        'UPDATE sessions SET status = ?, submitted_at = ? WHERE id = ?',
        ('submitted', datetime.now().isoformat(), session_id)
    )
    conn.commit()

    session = conn.execute('SELECT * FROM sessions WHERE id = ?', (session_id,)).fetchone()
    conn.close()

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    return jsonify({
        'status': 'SUCCESS',
        'sessionId': session['id'],
        'result': session['face_match_result'] or 'NO_RESULT'
    })

@app.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    conn = get_db_connection()
    session = conn.execute('SELECT * FROM sessions WHERE id = ?', (session_id,)).fetchone()
    conn.close()

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    return jsonify({
        'id': session['id'],
        'id_front': session['id_front'],
        'id_back': session['id_back'],
        'selfie': session['selfie'],
        'face_match_score': session['face_match_score'],
        'face_match_result': session['face_match_result'],
        'status': session['status'],
        'created_at': session['created_at'],
        'submitted_at': session['submitted_at']
    })

@app.route('/analytics/sessions', methods=['GET'])
def get_sessions_analytics():
    conn = get_db_connection()
    sessions = conn.execute('SELECT * FROM sessions ORDER BY created_at DESC').fetchall()
    conn.close()

    return jsonify([dict(session) for session in sessions])
@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/dashboard.html')
def dashboard():
    return send_from_directory('../frontend', 'dashboard.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('../frontend', filename)

if __name__ == '__main__':
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)

    init_db()
    print("Credence ID Verification Server (Python)")
    print(f"Dashboard: http://localhost:{Config.PORT}/dashboard.html")
    print(f"API: http://localhost:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)