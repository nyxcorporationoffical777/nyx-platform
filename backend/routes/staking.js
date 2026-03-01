const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken: authenticate } = require('../middleware/auth');

const PLANS = {
  flexible: { label: 'Flexible',  apy: 0.08,  duration_days: 0,   min: 10,   early_penalty: 0 },
  '30d':    { label: '30 Days',   apy: 0.14,  duration_days: 30,  min: 50,   early_penalty: 0.05 },
  '90d':    { label: '90 Days',   apy: 0.22,  duration_days: 90,  min: 100,  early_penalty: 0.08 },
  '180d':   { label: '180 Days',  apy: 0.32,  duration_days: 180, min: 250,  early_penalty: 0.10 },
  '365d':   { label: '365 Days',  apy: 0.48,  duration_days: 365, min: 500,  early_penalty: 0.12 },
};

// Accrue daily interest on all active staking positions (called by cron)
function accrueStaking() {
  try {
    const active = db.prepare(`SELECT * FROM staking_positions WHERE status = 'active'`).all();
    for (const s of active) {
      const dailyRate = s.apy / 365;
      const interest = s.amount * dailyRate;
      db.prepare(`UPDATE staking_positions SET earned = earned + ? WHERE id = ?`).run(interest, s.id);
      db.prepare(`UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?`)
        .run(interest, interest, s.user_id);

      // Auto-complete fixed plans when unlocks_at is reached
      if (s.duration_days > 0) {
        const unlocks = new Date(s.unlocks_at);
        if (new Date() >= unlocks) {
          db.prepare(`UPDATE staking_positions SET status = 'completed', unstaked_at = datetime('now') WHERE id = ?`).run(s.id);
          db.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).run(s.amount, s.user_id);
          db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'staking', ?, ?)`)
            .run(s.user_id, `Staking Matured — ${s.plan}`, `Your $${s.amount.toFixed(2)} stake has matured. Principal + $${s.earned.toFixed(2)} interest returned.`);
        }
      }
    }
  } catch (e) {
    console.error('Staking accrue error:', e.message);
  }
}

// Run accrual every hour
setInterval(accrueStaking, 3600 * 1000);

// GET /api/staking/plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// GET /api/staking/positions
router.get('/positions', authenticate, (req, res) => {
  try {
    const positions = db.prepare(
      `SELECT * FROM staking_positions WHERE user_id = ? ORDER BY staked_at DESC`
    ).all(req.user.id);
    res.json({ positions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/staking/stake
router.post('/stake', authenticate, (req, res) => {
  try {
    const { plan, amount } = req.body;
    const planCfg = PLANS[plan];
    if (!planCfg) return res.status(400).json({ error: 'Invalid plan' });
    if (!amount || amount < planCfg.min) return res.status(400).json({ error: `Minimum for this plan is $${planCfg.min}` });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    const unlocksAt = planCfg.duration_days === 0
      ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString() // flexible: 1yr default
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * planCfg.duration_days).toISOString();

    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
    const result = db.prepare(`
      INSERT INTO staking_positions (user_id, amount, plan, apy, duration_days, unlocks_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, amount, plan, planCfg.apy, planCfg.duration_days, unlocksAt);

    db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'staking', ?, ?)`)
      .run(req.user.id, `Staked $${amount.toFixed(2)} — ${planCfg.label}`, `Earning ${(planCfg.apy * 100).toFixed(0)}% APY. ${planCfg.duration_days > 0 ? `Unlocks in ${planCfg.duration_days} days.` : 'Flexible — unstake anytime.'}`);

    res.json({ success: true, position_id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/staking/unstake/:id
router.post('/unstake/:id', authenticate, (req, res) => {
  try {
    const pos = db.prepare(`SELECT * FROM staking_positions WHERE id = ? AND user_id = ? AND status = 'active'`)
      .get(req.params.id, req.user.id);
    if (!pos) return res.status(404).json({ error: 'Position not found or already closed' });

    const plan = PLANS[pos.plan];
    const isEarly = pos.duration_days > 0 && new Date() < new Date(pos.unlocks_at);
    const penalty = isEarly ? pos.amount * (plan?.early_penalty || 0.05) : 0;
    const returned = pos.amount - penalty;

    db.prepare(`UPDATE staking_positions SET status = 'unstaked', unstaked_at = datetime('now') WHERE id = ?`).run(pos.id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(returned, req.user.id);

    const msg = isEarly
      ? `Early unstake: $${penalty.toFixed(2)} penalty applied. $${returned.toFixed(2)} returned.`
      : `$${returned.toFixed(2)} returned to your balance.`;
    db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'staking', ?, ?)`)
      .run(req.user.id, `Unstaked — ${pos.plan}`, msg);

    res.json({ success: true, returned, penalty, early: isEarly });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/staking/stats
router.get('/stats', authenticate, (req, res) => {
  try {
    const positions = db.prepare(`SELECT * FROM staking_positions WHERE user_id = ?`).all(req.user.id);
    const active = positions.filter(p => p.status === 'active');
    const totalStaked = active.reduce((s, p) => s + p.amount, 0);
    const totalEarned = positions.reduce((s, p) => s + p.earned, 0);
    const avgApy = active.length ? active.reduce((s, p) => s + p.apy, 0) / active.length : 0;
    res.json({ totalStaked, totalEarned, avgApy, activeCount: active.length, totalPositions: positions.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
