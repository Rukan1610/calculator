require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  const dbState = [
    'disconnected',
    'connected',
    'connecting',
    'disconnecting'
  ];

  res.json({
    ok: true,
    db: dbState[mongoose.connection.readyState] || 'unknown',
    uptime: process.uptime().toFixed(1) + 's'
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection
const URI = process.env.MONGODB_URI;

if (URI && !URI.includes('<username>')) {
  mongoose.connect(URI)
    .then(() => {
      console.log('✅ MongoDB connected');
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
    });
} else {
  console.warn('⚠️ MONGODB_URI not set');
}

// Run locally only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 CENPEEP running at http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;