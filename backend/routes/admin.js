const express = require('express');
const db = require('../db');
const { adminLogin, authenticateAdmin } = require('../middleware/adminAuth');
const { getVipLevel } = require('../utils/vip');
const email = require('../services/emailService');

const router = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/login', adminLogin);

// ── Dashboard stats ───────────────────────────────────────────────────────────
router.get('/stats', authenticateAdmin, (req, res) => {
  const totalUsers      = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalDeposited  = db.prepare('SELECT COALESCE(SUM(total_deposited),0) as s FROM users').get().s;
  const totalWithdrawn  = db.prepare('SELECT COALESCE(SUM(total_withdrawn),0) as s FROM users').get().s;
  const totalEarned     = db.prepare('SELECT COALESCE(SUM(total_earned),0) as s FROM users').get().s;
  const totalBalance    = db.prepare('SELECT COALESCE(SUM(balance),0) as s FROM users').get().s;
  const activeBot       = db.prepare('SELECT COUNT(*) as c FROM users WHERE bot_running = 1').get().c;
  const totalSessions   = db.prepare('SELECT COUNT(*) as c FROM bot_sessions').get().c;
  const totalTx         = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;
  const newToday        = db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at) = date('now')").get().c;

  const vipCounts = db.prepare(
    "SELECT vip_level, COUNT(*) as count FROM users GROUP BY vip_level"
  ).all();

  res.json({
    totalUsers, totalDeposited, totalWithdrawn, totalEarned,
    totalBalance, activeBot, totalSessions, totalTx, newToday, vipCounts
  });
});

// ── Users list ────────────────────────────────────────────────────────────────
router.get('/users', authenticateAdmin, (req, res) => {
  const { search, vip, sort = 'created_at', order = 'desc', limit = 50, offset = 0 } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ' AND (full_name LIKE ? OR email LIKE ? OR referral_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (vip) {
    where += ' AND vip_level = ?';
    params.push(vip);
  }

  const allowed = ['created_at','balance','total_deposited','total_earned','full_name','email'];
  const sortCol = allowed.includes(sort) ? sort : 'created_at';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';

  const users = db.prepare(
    `SELECT id, full_name, email, balance, vip_level, bot_running, total_deposited,
            total_withdrawn, total_earned, referral_earnings, referral_code,
            referred_by, crypto_address, crypto_network, created_at, last_bot_date,
            active_days
     FROM users ${where}
     ORDER BY ${sortCol} ${sortDir}
     LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), Number(offset));

  const total = db.prepare(`SELECT COUNT(*) as c FROM users ${where}`).get(...params).c;

  res.json({ users, total });
});

// ── Single user detail ────────────────────────────────────────────────────────
router.get('/users/:id', authenticateAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const transactions = db.prepare(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
  ).all(req.params.id);

  const sessions = db.prepare(
    'SELECT * FROM bot_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 50'
  ).all(req.params.id);

  const referrals = db.prepare(
    'SELECT id, full_name, email, balance, vip_level, total_earned, created_at FROM users WHERE referred_by = ?'
  ).all(req.params.id);

  res.json({ user, transactions, sessions, referrals });
});

// ── Edit user ─────────────────────────────────────────────────────────────────
router.put('/users/:id', authenticateAdmin, (req, res) => {
  const { balance, vip_level, full_name, email, bot_running,
          total_deposited, total_withdrawn, total_earned, referral_earnings,
          crypto_address, crypto_network, note } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newBalance      = balance       !== undefined ? Number(balance)       : user.balance;
  const newDeposited    = total_deposited !== undefined ? Number(total_deposited) : user.total_deposited;
  const newWithdrawn    = total_withdrawn !== undefined ? Number(total_withdrawn) : user.total_withdrawn;
  const newEarned       = total_earned  !== undefined ? Number(total_earned)  : user.total_earned;
  const newRefEarnings  = referral_earnings !== undefined ? Number(referral_earnings) : user.referral_earnings;
  const newVip          = vip_level     || getVipLevel(newBalance).name;
  const newName         = full_name     || user.full_name;
  const newEmail        = email         || user.email;
  const newBotRunning   = bot_running   !== undefined ? (bot_running ? 1 : 0) : user.bot_running;
  const newCryptoAddr   = crypto_address !== undefined ? crypto_address : user.crypto_address;
  const newCryptoNet    = crypto_network !== undefined ? crypto_network : user.crypto_network;

  db.prepare(
    `UPDATE users SET balance=?, vip_level=?, full_name=?, email=?, bot_running=?,
     total_deposited=?, total_withdrawn=?, total_earned=?, referral_earnings=?,
     crypto_address=?, crypto_network=? WHERE id=?`
  ).run(newBalance, newVip, newName, newEmail, newBotRunning,
        newDeposited, newWithdrawn, newEarned, newRefEarnings,
        newCryptoAddr, newCryptoNet, req.params.id);

  // Log admin adjustment as transaction if balance changed
  if (balance !== undefined && Number(balance) !== user.balance) {
    const diff = Number(balance) - user.balance;
    const type = diff > 0 ? 'deposit' : 'withdraw';
    const adminNote = note || `Admin adjustment: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}`;
    db.prepare(
      "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, ?, ?, 'completed', ?)"
    ).run(req.params.id, type, Math.abs(diff), adminNote);
  }

  res.json({ message: 'User updated', user: db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) });
});

// ── Delete user ───────────────────────────────────────────────────────────────
router.delete('/users/:id', authenticateAdmin, (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('DELETE FROM transactions WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM bot_sessions WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted' });
});

// ── Reset user bot (force stop) ───────────────────────────────────────────────
router.post('/users/:id/reset-bot', authenticateAdmin, (req, res) => {
  db.prepare('UPDATE users SET bot_running=0, bot_started_at=NULL WHERE id=?').run(req.params.id);
  res.json({ message: 'Bot reset' });
});

// ── Reset daily limit ─────────────────────────────────────────────────────────
router.post('/users/:id/reset-daily', authenticateAdmin, (req, res) => {
  db.prepare('UPDATE users SET last_bot_date=NULL WHERE id=?').run(req.params.id);
  res.json({ message: 'Daily limit reset' });
});

// ── Add manual transaction ────────────────────────────────────────────────────
router.post('/users/:id/transaction', authenticateAdmin, (req, res) => {
  const { type, amount, note } = req.body;
  if (!type || !amount) return res.status(400).json({ error: 'type and amount required' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const amt = Math.abs(Number(amount));
  let newBalance = user.balance;
  if (['deposit','yield','referral'].includes(type)) newBalance += amt;
  else if (type === 'withdraw') newBalance = Math.max(0, newBalance - amt);

  const newVip = getVipLevel(newBalance).name;
  db.prepare('UPDATE users SET balance=?, vip_level=? WHERE id=?').run(newBalance, newVip, req.params.id);
  db.prepare(
    'INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, type, amt, 'completed', note || `Admin: ${type}`);

  res.json({ message: 'Transaction added', new_balance: newBalance });
});

// ── All transactions (global) ─────────────────────────────────────────────────
router.get('/transactions', authenticateAdmin, (req, res) => {
  const { type, limit = 100, offset = 0 } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (type) { where += ' AND t.type = ?'; params.push(type); }

  const rows = db.prepare(
    `SELECT t.*, u.full_name, u.email FROM transactions t
     JOIN users u ON t.user_id = u.id
     ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), Number(offset));

  res.json(rows);
});

// ── All bot sessions (global) ─────────────────────────────────────────────────
router.get('/sessions', authenticateAdmin, (req, res) => {
  const rows = db.prepare(
    `SELECT s.*, u.full_name, u.email FROM bot_sessions s
     JOIN users u ON s.user_id = u.id
     ORDER BY s.started_at DESC LIMIT 200`
  ).all();
  res.json(rows);
});

// ── Withdrawal requests ───────────────────────────────────────────────────────
router.get('/withdrawal-requests', authenticateAdmin, (req, res) => {
  const { status = '' } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (status) { where += ' AND wr.status = ?'; params.push(status); }
  const rows = db.prepare(
    `SELECT wr.*, u.full_name, u.email, u.vip_level
     FROM withdrawal_requests wr
     JOIN users u ON wr.user_id = u.id
     ${where}
     ORDER BY wr.requested_at DESC LIMIT 200`
  ).all(...params);
  const pending = db.prepare("SELECT COUNT(*) as c FROM withdrawal_requests WHERE status='pending'").get().c;
  res.json({ requests: rows, pending_count: pending });
});

// POST /admin/withdrawal-requests/:id/approve
router.post('/withdrawal-requests/:id/approve', authenticateAdmin, (req, res) => {
  const wr = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(req.params.id);
  if (!wr) return res.status(404).json({ error: 'Request not found' });
  if (wr.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

  const { note = '' } = req.body;

  db.prepare(
    "UPDATE withdrawal_requests SET status='approved', admin_note=?, processed_at=datetime('now') WHERE id=?"
  ).run(note || null, wr.id);

  // Update transaction status
  db.prepare(
    "UPDATE transactions SET status='completed' WHERE user_id=? AND type='withdraw' AND status='pending' ORDER BY created_at DESC LIMIT 1"
  ).run(wr.user_id);

  // Update total_withdrawn
  const user = db.prepare('SELECT total_withdrawn FROM users WHERE id=?').get(wr.user_id);
  db.prepare('UPDATE users SET total_withdrawn=? WHERE id=?').run(user.total_withdrawn + wr.amount, wr.user_id);

  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'withdraw', 'Withdrawal Approved', ?)"
  ).run(wr.user_id, `Your withdrawal of $${wr.amount.toFixed(2)} has been approved and sent to ${wr.crypto_address.slice(0,12)}... (${wr.crypto_network}).${note ? ' Note: ' + note : ''}`);

  res.json({ ok: true });
});

// POST /admin/withdrawal-requests/:id/reject
router.post('/withdrawal-requests/:id/reject', authenticateAdmin, (req, res) => {
  const wr = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(req.params.id);
  if (!wr) return res.status(404).json({ error: 'Request not found' });
  if (wr.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

  const { note = '' } = req.body;

  db.prepare(
    "UPDATE withdrawal_requests SET status='rejected', admin_note=?, processed_at=datetime('now') WHERE id=?"
  ).run(note || null, wr.id);

  // Refund balance
  const user = db.prepare('SELECT balance, vip_level FROM users WHERE id=?').get(wr.user_id);
  const newBalance = user.balance + wr.amount;
  const vip = getVipLevel(newBalance);
  db.prepare('UPDATE users SET balance=?, vip_level=? WHERE id=?').run(newBalance, vip.name, wr.user_id);

  // Update transaction status
  db.prepare(
    "UPDATE transactions SET status='rejected' WHERE user_id=? AND type='withdraw' AND status='pending' ORDER BY created_at DESC LIMIT 1"
  ).run(wr.user_id);

  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'withdraw', 'Withdrawal Rejected', ?)"
  ).run(wr.user_id, `Your withdrawal of $${wr.amount.toFixed(2)} was rejected and refunded to your balance.${note ? ' Reason: ' + note : ''}`);

  res.json({ ok: true });
});

// ── KYC review ────────────────────────────────────────────────────────────────
router.get('/kyc', authenticateAdmin, (req, res) => {
  const { status = 'pending' } = req.query;
  const rows = db.prepare(`
    SELECT k.*, u.full_name as user_name, u.email as user_email
    FROM kyc_submissions k
    JOIN users u ON u.id = k.user_id
    WHERE k.status = ?
    ORDER BY k.submitted_at DESC
  `).all(status);
  const pendingCount = db.prepare(`SELECT COUNT(*) as c FROM kyc_submissions WHERE status = 'pending'`).get().c;
  res.json({ submissions: rows, pendingCount });
});

router.post('/kyc/:id/approve', authenticateAdmin, (req, res) => {
  const sub = db.prepare('SELECT * FROM kyc_submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  if (sub.status !== 'pending') return res.status(400).json({ error: 'Already reviewed' });

  db.prepare(`UPDATE kyc_submissions SET status = 'approved', reviewed_at = datetime('now') WHERE id = ?`).run(sub.id);
  db.prepare(`UPDATE users SET kyc_status = 'approved' WHERE id = ?`).run(sub.user_id);
  db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'kyc', 'KYC Approved', ?)`)
    .run(sub.user_id, 'Your identity has been verified. Withdrawal limits are now increased.');

  const u = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(sub.user_id);
  if (u) email.sendKycUpdate(u.email, u.full_name, 'approved').catch(() => {});
  res.json({ ok: true });
});

router.post('/kyc/:id/reject', authenticateAdmin, (req, res) => {
  const sub = db.prepare('SELECT * FROM kyc_submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  if (sub.status !== 'pending') return res.status(400).json({ error: 'Already reviewed' });

  const { note = '' } = req.body;
  db.prepare(`UPDATE kyc_submissions SET status = 'rejected', admin_note = ?, reviewed_at = datetime('now') WHERE id = ?`).run(note || null, sub.id);
  db.prepare(`UPDATE users SET kyc_status = 'rejected' WHERE id = ?`).run(sub.user_id);
  db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'kyc', 'KYC Rejected', ?)`)
    .run(sub.user_id, `Your KYC submission was rejected.${note ? ' Reason: ' + note : ' Please re-submit with clearer documents.'}`);

  const u = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(sub.user_id);
  if (u) email.sendKycUpdate(u.email, u.full_name, 'rejected').catch(() => {});
  res.json({ ok: true });
});

// ── Platform health metrics ───────────────────────────────────────────────────
router.get('/health', authenticateAdmin, (req, res) => {
  // Daily signups last 30 days
  const dailySignups = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM users
    WHERE created_at >= date('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all();

  // Daily yield earned last 30 days
  const dailyYield = db.prepare(`
    SELECT date(created_at) as day, COALESCE(SUM(amount),0) as amount
    FROM transactions
    WHERE type = 'yield' AND created_at >= date('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all();

  // Daily deposits last 30 days
  const dailyDeposits = db.prepare(`
    SELECT date(created_at) as day, COALESCE(SUM(amount),0) as amount
    FROM transactions
    WHERE type = 'deposit' AND created_at >= date('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all();

  // Daily withdrawals last 30 days
  const dailyWithdrawals = db.prepare(`
    SELECT date(created_at) as day, COALESCE(SUM(amount),0) as amount
    FROM transactions
    WHERE type = 'withdraw' AND created_at >= date('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all();

  // VIP distribution
  const vipDistribution = db.prepare(`
    SELECT vip_level, COUNT(*) as count, COALESCE(SUM(balance),0) as total_balance
    FROM users GROUP BY vip_level ORDER BY total_balance DESC
  `).all();

  // Top 10 earners
  const topEarners = db.prepare(`
    SELECT id, full_name, email, vip_level, balance, total_earned, total_deposited, active_days
    FROM users ORDER BY total_earned DESC LIMIT 10
  `).all();

  // Top 10 by balance
  const topBalances = db.prepare(`
    SELECT id, full_name, email, vip_level, balance, total_earned
    FROM users ORDER BY balance DESC LIMIT 10
  `).all();

  // Retention: users with >1 active day
  const retention = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN active_days >= 1 THEN 1 END) as day1,
      COUNT(CASE WHEN active_days >= 7 THEN 1 END) as day7,
      COUNT(CASE WHEN active_days >= 30 THEN 1 END) as day30
    FROM users
  `).get();

  // Hourly bot activity today
  const hourlyBots = db.prepare(`
    SELECT strftime('%H', started_at) as hour, COUNT(*) as count
    FROM bot_sessions
    WHERE date(started_at) = date('now')
    GROUP BY hour ORDER BY hour ASC
  `).all();

  // Platform totals summary
  const totals = db.prepare(`
    SELECT
      COUNT(*) as users,
      COALESCE(SUM(balance),0) as total_balance,
      COALESCE(SUM(total_deposited),0) as total_deposited,
      COALESCE(SUM(total_withdrawn),0) as total_withdrawn,
      COALESCE(SUM(total_earned),0) as total_earned,
      COALESCE(SUM(referral_earnings),0) as total_referral_earnings,
      COUNT(CASE WHEN bot_running=1 THEN 1 END) as active_bots,
      COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as new_today,
      COUNT(CASE WHEN date(created_at) >= date('now','-7 days') THEN 1 END) as new_week
    FROM users
  `).get();

  const totalSessions = db.prepare('SELECT COUNT(*) as c FROM bot_sessions').get().c;
  const pendingWithdrawals = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(amount),0) as s FROM withdrawal_requests WHERE status='pending'").get();

  res.json({
    dailySignups, dailyYield, dailyDeposits, dailyWithdrawals,
    vipDistribution, topEarners, topBalances,
    retention, hourlyBots, totals, totalSessions,
    pendingWithdrawals,
  });
});

module.exports = router;
