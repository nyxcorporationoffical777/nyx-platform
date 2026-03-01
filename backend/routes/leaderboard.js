const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/leaderboard — top 20 earners (anonymized)
router.get('/', authenticateToken, (req, res) => {
  const top = db.prepare(`
    SELECT
      id,
      substr(full_name,1,1) || repeat('*', max(length(full_name)-2,1)) || substr(full_name,-1,1) AS display_name,
      vip_level,
      total_earned,
      total_deposited,
      active_days,
      created_at
    FROM users
    ORDER BY total_earned DESC
    LIMIT 20
  `).all();

  // Mark which entry is the current user
  const result = top.map((u, i) => ({
    rank: i + 1,
    display_name: u.display_name,
    vip_level: u.vip_level,
    total_earned: u.total_earned,
    total_deposited: u.total_deposited,
    active_days: u.active_days,
    is_me: u.id === req.user.id,
  }));

  // Also get current user's own rank if not in top 20
  const myRank = db.prepare(`
    SELECT COUNT(*) + 1 AS rank FROM users WHERE total_earned > (
      SELECT total_earned FROM users WHERE id = ?
    )
  `).get(req.user.id);

  const me = db.prepare('SELECT vip_level, total_earned, active_days FROM users WHERE id = ?').get(req.user.id);

  res.json({ leaderboard: result, my_rank: myRank.rank, me });
});

// GET /api/leaderboard/stats — platform-wide stats
router.get('/stats', authenticateToken, (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_users,
      SUM(total_earned) as total_yield,
      SUM(total_deposited) as total_deposited,
      AVG(total_earned) as avg_earned,
      COUNT(CASE WHEN bot_running = 1 THEN 1 END) as active_bots
    FROM users
  `).get();
  res.json(stats);
});

module.exports = router;
