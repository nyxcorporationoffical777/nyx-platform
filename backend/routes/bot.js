const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { getVipLevel, getDailyRate } = require('../utils/vip');
const { checkAndAwardBonuses } = require('./bonusHelper');

const router = express.Router();

const SESSION_SECONDS = 300; // fixed 5 minutes

router.post('/start', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (user.bot_running) return res.status(400).json({ error: 'Bot already running' });
  if (user.balance < 100) return res.status(400).json({ error: 'Minimum balance of $100 required to start the engine' });

  // Once-per-day check (UTC date)
  const todayUTC = new Date().toISOString().slice(0, 10);
  if (user.last_bot_date === todayUTC) {
    return res.status(400).json({ error: 'Daily session already used. Come back tomorrow.', next_available: todayUTC + 'T00:00:00Z' });
  }

  const vip = getVipLevel(user.balance);
  const now = new Date().toISOString();
  const sessionDuration = SESSION_SECONDS;

  db.prepare('UPDATE users SET bot_running = 1, bot_started_at = ?, session_duration = ?, last_bot_date = ? WHERE id = ?')
    .run(now, sessionDuration, todayUTC, req.user.id);

  const session = db.prepare(
    'INSERT INTO bot_sessions (user_id, started_at, vip_level) VALUES (?, ?, ?)'
  ).run(req.user.id, now, vip.name);

  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'bot_start', 'Engine Started', ?)"
  ).run(req.user.id, `Quant Engine activated on ${vip.name} tier. Expected yield: $${(user.balance * vip.dailyRate).toFixed(2)} today.`);

  res.json({
    message: 'Bot started',
    started_at: now,
    vip_level: vip.name,
    daily_rate: vip.dailyRate,
    session_duration: sessionDuration,
    session_id: session.lastInsertRowid
  });
});

router.post('/stop', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user.bot_running) return res.status(400).json({ error: 'Bot is not running' });

  const now = new Date();
  const startedAt = new Date(user.bot_started_at);
  const elapsedSeconds = (now - startedAt) / 1000;
  const sessionDuration = user.session_duration || 300; // fallback 5 min
  const progress = Math.min(1, elapsedSeconds / sessionDuration);

  const vip = getVipLevel(user.balance);
  // Full daily profit is earned when session completes (progress = 1)
  // Partial profit if stopped early (proportional to progress)
  const fullProfit = user.balance * vip.dailyRate;
  const earned = fullProfit * progress;

  const newBalance = user.balance + earned;
  const newVip = getVipLevel(newBalance);

  db.prepare(
    'UPDATE users SET bot_running = 0, bot_started_at = NULL, balance = ?, total_earned = ?, vip_level = ?, active_days = active_days + 1 WHERE id = ?'
  ).run(newBalance, user.total_earned + earned, newVip.name, req.user.id);

  db.prepare(
    "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'yield', ?, 'completed', ?)"
  ).run(req.user.id, earned, `Yield from ${vip.name} session`);

  // Pay referral commission to referrer (5% of yield)
  if (user.referred_by) {
    const COMMISSION_RATE = 0.05;
    const commission = earned * COMMISSION_RATE;
    const referrer = db.prepare('SELECT id, balance, referral_earnings FROM users WHERE id = ?').get(user.referred_by);
    if (referrer) {
      db.prepare('UPDATE users SET balance = balance + ?, referral_earnings = referral_earnings + ? WHERE id = ?')
        .run(commission, commission, referrer.id);
      db.prepare(
        "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'referral', ?, 'completed', ?)"
      ).run(referrer.id, commission, `Referral commission from ${user.full_name}`);
    }
  }

  const session = db.prepare(
    'SELECT id FROM bot_sessions WHERE user_id = ? AND ended_at IS NULL ORDER BY id DESC LIMIT 1'
  ).get(req.user.id);

  if (session) {
    db.prepare('UPDATE bot_sessions SET ended_at = ?, earned = ? WHERE id = ?')
      .run(now.toISOString(), earned, session.id);
  }

  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'bot_stop', 'Yield Credited', ?)"
  ).run(req.user.id, `Session complete. $${earned.toFixed(4)} earned and added to your balance. New balance: $${newBalance.toFixed(2)}.`);

  // Auto-check for newly unlocked bonuses
  checkAndAwardBonuses(req.user.id);

  res.json({
    message: 'Bot stopped',
    earned: earned,
    new_balance: newBalance,
    elapsed_seconds: elapsedSeconds,
    session_duration: sessionDuration,
    progress: progress,
    vip_level: newVip.name
  });
});

router.get('/status', authenticateToken, (req, res) => {
  let user = db.prepare(
    'SELECT balance, bot_running, bot_started_at, vip_level, total_earned, session_duration, last_bot_date FROM users WHERE id = ?'
  ).get(req.user.id);

  const vip = getVipLevel(user.balance);
  let currentEarned = 0;
  let elapsedSeconds = 0;
  let sessionDuration = user.session_duration || 300;

  if (user.bot_running && user.bot_started_at) {
    const now = new Date();
    const startedAt = new Date(user.bot_started_at);
    elapsedSeconds = (now - startedAt) / 1000;

    // Auto-complete: if session has fully elapsed, credit earnings and stop the bot
    if (elapsedSeconds >= sessionDuration) {
      const fullProfit = user.balance * vip.dailyRate;
      const newBalance = user.balance + fullProfit;
      const newVip = getVipLevel(newBalance);

      db.prepare(
        'UPDATE users SET bot_running = 0, bot_started_at = NULL, balance = ?, total_earned = ?, vip_level = ?, active_days = active_days + 1 WHERE id = ?'
      ).run(newBalance, user.total_earned + fullProfit, newVip.name, req.user.id);

      db.prepare(
        "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'yield', ?, 'completed', ?)"
      ).run(req.user.id, fullProfit, `Auto-completed yield from ${vip.name} session`);

      const session = db.prepare(
        'SELECT id FROM bot_sessions WHERE user_id = ? AND ended_at IS NULL ORDER BY id DESC LIMIT 1'
      ).get(req.user.id);
      if (session) {
        db.prepare('UPDATE bot_sessions SET ended_at = ?, earned = ? WHERE id = ?')
          .run(now.toISOString(), fullProfit, session.id);
      }

      // Pay referral commission
      if (user.referred_by) {
        const commission = fullProfit * 0.05;
        const referrer = db.prepare('SELECT id FROM users WHERE id = ?').get(user.referred_by);
        if (referrer) {
          db.prepare('UPDATE users SET balance = balance + ?, referral_earnings = referral_earnings + ? WHERE id = ?')
            .run(commission, commission, referrer.id);
          db.prepare(
            "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'referral', ?, 'completed', ?)"
          ).run(referrer.id, commission, `Referral commission (auto-complete)`);
        }
      }

      db.prepare(
        "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'bot_stop', 'Yield Auto-Credited', ?)"
      ).run(req.user.id, `Session auto-completed. $${fullProfit.toFixed(4)} earned. New balance: $${newBalance.toFixed(2)}.`);

      checkAndAwardBonuses(req.user.id);

      // Re-read fresh user data
      user = db.prepare(
        'SELECT balance, bot_running, bot_started_at, vip_level, total_earned, session_duration, last_bot_date FROM users WHERE id = ?'
      ).get(req.user.id);
      currentEarned = fullProfit;
      elapsedSeconds = sessionDuration;
    } else {
      const progress = elapsedSeconds / sessionDuration;
      const fullProfit = user.balance * vip.dailyRate;
      currentEarned = fullProfit * progress;
    }
  }

  const freshVip = getVipLevel(user.balance);
  const todayUTC = new Date().toISOString().slice(0, 10);
  const usedToday = user.last_bot_date === todayUTC;

  res.json({
    bot_running: !!user.bot_running,
    bot_started_at: user.bot_started_at,
    vip_level: freshVip.name,
    daily_rate: freshVip.dailyRate,
    current_session_earned: currentEarned,
    elapsed_seconds: elapsedSeconds,
    session_duration: sessionDuration,
    balance: user.balance,
    total_earned: user.total_earned,
    used_today: usedToday,
    last_bot_date: user.last_bot_date
  });
});

router.get('/sessions', authenticateToken, (req, res) => {
  const sessions = db.prepare(
    'SELECT * FROM bot_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 20'
  ).all(req.user.id);
  res.json(sessions);
});

module.exports = router;
