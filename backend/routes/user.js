const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { getVipLevel, VIP_LEVELS } = require('../utils/vip');
const { checkAndAwardBonuses } = require('./bonusHelper');

const router = express.Router();

const REFERRAL_COMMISSION = 0.05; // 5% of referral's yield earnings

router.get('/me', authenticateToken, (req, res) => {
  let user = db.prepare(
    `SELECT id, full_name, email, avatar, balance, total_deposited, total_withdrawn,
     total_earned, referral_earnings, vip_level, bot_running, bot_started_at,
     active_days, referral_code, referred_by, crypto_address, crypto_network,
     created_at, session_duration, last_bot_date FROM users WHERE id = ?`
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Auto-complete stale bot session so balance is always correct on reload
  if (user.bot_running && user.bot_started_at) {
    const sessionDuration = user.session_duration || 300;
    const elapsedSeconds = (Date.now() - new Date(user.bot_started_at).getTime()) / 1000;
    if (elapsedSeconds >= sessionDuration) {
      const vip = getVipLevel(user.balance);
      const fullProfit = user.balance * vip.dailyRate;
      const newBalance = user.balance + fullProfit;
      const newVip = getVipLevel(newBalance);
      const now = new Date().toISOString();

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
          .run(now, fullProfit, session.id);
      }

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
      ).run(req.user.id, `Session auto-completed. $${fullProfit.toFixed(4)} credited. New balance: $${newBalance.toFixed(2)}.`);

      checkAndAwardBonuses(req.user.id);

      user = db.prepare(
        `SELECT id, full_name, email, avatar, balance, total_deposited, total_withdrawn,
         total_earned, referral_earnings, vip_level, bot_running, bot_started_at,
         active_days, referral_code, referred_by, crypto_address, crypto_network,
         created_at, session_duration, last_bot_date FROM users WHERE id = ?`
      ).get(req.user.id);
    }
  }

  const vip = getVipLevel(user.balance);
  const nextVip = VIP_LEVELS.find(l => l.minBalance > user.balance) || null;

  const referralCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by = ?').get(req.user.id);
  const activeReferrals = db.prepare(
    'SELECT COUNT(*) as count FROM users WHERE referred_by = ? AND total_deposited > 0'
  ).get(req.user.id);

  res.json({
    ...user,
    vip_info: vip,
    next_vip: nextVip,
    vip_levels: VIP_LEVELS,
    referral_count: referralCount.count,
    active_referral_count: activeReferrals.count,
    referral_commission_rate: REFERRAL_COMMISSION,
  });
});

router.put('/profile', authenticateToken, (req, res) => {
  const { full_name, avatar } = req.body;
  db.prepare('UPDATE users SET full_name = ?, avatar = ? WHERE id = ?')
    .run(full_name, avatar || null, req.user.id);
  res.json({ message: 'Profile updated' });
});

router.put('/crypto', authenticateToken, (req, res) => {
  const { crypto_address, crypto_network } = req.body;
  if (!crypto_address || !crypto_network)
    return res.status(400).json({ error: 'Address and network required' });
  db.prepare('UPDATE users SET crypto_address = ?, crypto_network = ? WHERE id = ?')
    .run(crypto_address, crypto_network, req.user.id);
  res.json({ message: 'Crypto address updated' });
});

router.put('/transaction-password', authenticateToken, async (req, res) => {
  const { login_password, transaction_password } = req.body;
  if (!login_password || !transaction_password)
    return res.status(400).json({ error: 'All fields required' });
  if (transaction_password.length < 6)
    return res.status(400).json({ error: 'Transaction password must be at least 6 characters' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const valid = await bcrypt.compare(login_password, user.password);
  if (!valid) return res.status(401).json({ error: 'Login password incorrect' });

  const hashed = await bcrypt.hash(transaction_password, 10);
  db.prepare('UPDATE users SET transaction_password = ? WHERE id = ?').run(hashed, req.user.id);
  res.json({ message: 'Transaction password set successfully' });
});

router.put('/password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  const valid = await bcrypt.compare(current_password, user.password);
  if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

  const hashed = await bcrypt.hash(new_password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
  res.json({ message: 'Password updated' });
});

router.get('/referrals', authenticateToken, (req, res) => {
  const referrals = db.prepare(
    `SELECT id, full_name, email, vip_level, total_earned, total_deposited, created_at
     FROM users WHERE referred_by = ? ORDER BY created_at DESC`
  ).all(req.user.id);

  const me = db.prepare('SELECT referral_earnings FROM users WHERE id = ?').get(req.user.id);

  res.json({
    referrals,
    total_referral_earnings: me.referral_earnings || 0,
    commission_rate: REFERRAL_COMMISSION,
  });
});

router.get('/stats', authenticateToken, (req, res) => {
  const user = db.prepare(
    'SELECT balance, total_deposited, total_withdrawn, total_earned, referral_earnings, active_days FROM users WHERE id = ?'
  ).get(req.user.id);

  const tradeCount = db.prepare(
    "SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND type = 'yield'"
  ).get(req.user.id);

  res.json({ ...user, total_sessions: tradeCount.count });
});

module.exports = router;
