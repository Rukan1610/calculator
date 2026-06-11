const express = require('express');
const router  = express.Router();
const Session = require('../models/Session');

// GET all sessions (newest first)
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ uploadedAt: -1 }).lean();
    res.json({ ok: true, sessions });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET single session
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, session });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST save a new session (called after Calculate)
router.post('/', async (req, res) => {
  try {
    const { sessionName, sourceFile, inputs, results } = req.body;
    const session = await Session.create({ sessionName, sourceFile, inputs, results });
    res.json({ ok: true, session });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE a session
router.delete('/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
