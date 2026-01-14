const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

const db = new sqlite3.Database(path.join(__dirname, '../database/verification.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  db.run(`
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
  `);
});

const sessions = new Map();

app.post('/session', (req, res) => {
  const sessionId = uuidv4();

  db.run(
    'INSERT INTO sessions (id) VALUES (?)',
    [sessionId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to create session' });
      }

      sessions.set(sessionId, {
        id: sessionId,
        idFront: null,
        idBack: null,
        selfie: null,
        faceMatchScore: null,
        faceMatchResult: null
      });

      res.json({ sessionId });
    }
  );
});

app.post('/session/:id/id', (req, res) => {
  const { id } = req.params;
  const { idFront, idBack } = req.body;

  if (!sessions.has(id)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!idFront || !idBack) {
    return res.status(400).json({ error: 'Both ID front and back images are required' });
  }

  db.run(
    'UPDATE sessions SET id_front = ?, id_back = ? WHERE id = ?',
    [idFront, idBack, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save ID images' });
      }

      const session = sessions.get(id);
      session.idFront = idFront;
      session.idBack = idBack;
      sessions.set(id, session);

      res.json({ status: 'success' });
    }
  );
});

app.post('/session/:id/selfie', async (req, res) => {
  const { id } = req.params;
  const { selfie, score, result } = req.body;

  if (!sessions.has(id)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const session = sessions.get(id);

  if (!session.idFront) {
    return res.status(400).json({ error: 'ID images must be uploaded first' });
  }

  if (!selfie || score === undefined || !result) {
    return res.status(400).json({ error: 'Selfie image, score, and result are required' });
  }

  try {
    db.run(
      'UPDATE sessions SET selfie = ?, face_match_score = ?, face_match_result = ? WHERE id = ?',
      [selfie, score, result, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to save selfie' });
        }

        session.selfie = selfie;
        session.faceMatchScore = score;
        session.faceMatchResult = result;
        sessions.set(id, session);

        res.json({ score, result });
      }
    );
  } catch (error) {
    console.error('Selfie processing error:', error);
    res.status(500).json({ error: 'Failed to process selfie' });
  }
});

app.post('/session/:id/submit', (req, res) => {
  const { id } = req.params;

  if (!sessions.has(id)) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const session = sessions.get(id);

  if (!session.idFront || !session.idBack || !session.selfie) {
    return res.status(400).json({ error: 'Incomplete verification data' });
  }

  db.run(
    'UPDATE sessions SET status = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['submitted', id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to submit session' });
      }

      res.json({
        status: 'SUCCESS',
        sessionId: id,
        result: session.faceMatchResult
      });
    }
  );
});

app.get('/session/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM sessions WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(row);
    }
  );
});

// Admin endpoint for dashboard
app.get('/admin/sessions', (req, res) => {
  db.all(
    'SELECT id, status, face_match_result, face_match_score, created_at, submitted_at FROM sessions ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}/dashboard.html`);
});

