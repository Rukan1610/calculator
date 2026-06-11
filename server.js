require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── Static frontend ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/upload',   require('./routes/upload'));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = ['disconnected','connected','connecting','disconnecting'];
  res.json({
    ok:     true,
    db:     dbState[mongoose.connection.readyState] || 'unknown',
    uptime: process.uptime().toFixed(1) + 's'
  });
});

// ── SPA fallback (serve index.html for all non-API routes) ────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── MongoDB connection ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const URI  = process.env.MONGODB_URI;

if (!URI || URI.includes('<username>')) {
  console.warn('⚠️  MONGODB_URI not set — running without database (sessions will not persist).');
  app.listen(PORT, () =>
    console.log(`🚀  CENPEEP running at http://localhost:${PORT}  [DB: offline]`)
  );
} else {
  mongoose.connect(URI)
    .then(() => {
      console.log('✅  MongoDB connected');
      app.listen(PORT, () =>
        console.log(`🚀  CENPEEP running at http://localhost:${PORT}  [DB: online]`)
      );
    })
    .catch(err => {
      console.error('❌  MongoDB connection failed:', err.message);
      app.listen(PORT, () =>
        console.log(`🚀  CENPEEP running at http://localhost:${PORT}  [DB: failed — ${err.message}]`)
      );
    });
}
