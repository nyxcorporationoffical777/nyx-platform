const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
const { getVipLevel } = require('../utils/vip');
const email = require('../services/emailService');

const router = express.Router();

function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

router.post('/register', async (req, res) => {
  const { full_name, email: userEmail, password, referral_code } = req.body;
  if (!full_name || !userEmail || !password)
    return res.status(400).json({ error: 'All fields required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(userEmail);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const vip = getVipLevel(0);

  let referred_by = null;
  if (referral_code) {
    const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referral_code.toUpperCase());
    if (referrer) referred_by = referrer.id;
  }

  let myCode = generateReferralCode();
  while (db.prepare('SELECT id FROM users WHERE referral_code = ?').get(myCode)) {
    myCode = generateReferralCode();
  }

  const result = db.prepare(
    'INSERT INTO users (full_name, email, password, vip_level, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(full_name, userEmail, hashed, vip.name, myCode, referred_by);

  const token = jwt.sign({ id: result.lastInsertRowid, email: userEmail }, JWT_SECRET, { expiresIn: '7d' });
  email.sendWelcome(userEmail, full_name).catch(() => {});
  res.json({ token, message: 'Registration successful' });
});

router.post('/login', async (req, res) => {
  const { email: userEmail, password, totp_code } = req.body;
  if (!userEmail || !password)
    return res.status(400).json({ error: 'All fields required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(userEmail);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  // If 2FA is enabled and no code provided — return challenge
  if (user.totp_enabled && !totp_code) {
    return res.json({ needs_2fa: true, user_id: user.id });
  }

  // If 2FA is enabled and code provided — verify it
  if (user.totp_enabled && totp_code) {
    const totpValid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totp_code.replace(/\s/g, ''),
      window: 1,
    });
    if (!totpValid) return res.status(401).json({ error: 'Invalid 2FA code' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, message: 'Login successful' });
});

module.exports = router;
