const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const db = require('../db');
const { authenticateToken: authenticate } = require('../middleware/auth');
const email = require('../services/emailService');

// GET /api/2fa/setup — generate secret + QR code URI
router.get('/setup', authenticate, async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.totp_enabled) return res.status(400).json({ error: '2FA is already enabled' });

    const secret = speakeasy.generateSecret({
      name: `NYX Platform (${user.email})`,
      issuer: 'NYX Platform',
      length: 20,
    });

    // Store secret temporarily (not yet activated)
    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret.base32, req.user.id);

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      qr_code: qrDataUrl,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/2fa/enable — verify code and activate 2FA
router.post('/enable', authenticate, (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user?.totp_secret) return res.status(400).json({ error: 'Run /setup first' });
    if (user.totp_enabled) return res.status(400).json({ error: '2FA already enabled' });

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });

    if (!valid) return res.status(400).json({ error: 'Invalid code. Check your authenticator app.' });

    db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(req.user.id);
    email.send2FAEnabled(user.email, user.full_name).catch(() => {});
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/2fa/disable — verify code and deactivate 2FA
router.post('/disable', authenticate, (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user?.totp_enabled) return res.status(400).json({ error: '2FA is not enabled' });

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });

    if (!valid) return res.status(400).json({ error: 'Invalid code' });

    db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(req.user.id);
    res.json({ success: true, message: '2FA disabled' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/2fa/verify — used during login to verify TOTP code
router.post('/verify', (req, res) => {
  try {
    const { user_id, code } = req.body;
    if (!user_id || !code) return res.status(400).json({ error: 'user_id and code required' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    if (!user?.totp_enabled || !user.totp_secret) return res.status(400).json({ error: '2FA not enabled' });

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });

    if (!valid) return res.status(401).json({ error: 'Invalid 2FA code' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/2fa/status
router.get('/status', authenticate, (req, res) => {
  const user = db.prepare('SELECT totp_enabled FROM users WHERE id = ?').get(req.user.id);
  res.json({ enabled: !!user?.totp_enabled });
});

module.exports = router;
