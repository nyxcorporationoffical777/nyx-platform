const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications — get all for current user
router.get('/', authenticateToken, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);
  const unread = rows.filter(n => !n.read).length;
  res.json({ notifications: rows, unread });
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

// PUT /api/notifications/:id/read — mark single as read
router.put('/:id/read', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// DELETE /api/notifications/clear — delete all
router.delete('/clear', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
