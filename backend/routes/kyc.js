const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken: authenticate } = require('../middleware/auth');
const email = require('../services/emailService');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'kyc');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `kyc_${req.user.id}_${Date.now()}_${file.fieldname}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, PDF, WEBP allowed'));
  },
});

// GET /api/kyc/status
router.get('/status', authenticate, (req, res) => {
  const row = db.prepare('SELECT * FROM kyc_submissions WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1').get(req.user.id);
  res.json({ submission: row || null });
});

// POST /api/kyc/submit — upload ID front, ID back, selfie
router.post('/submit', authenticate, upload.fields([
  { name: 'id_front', maxCount: 1 },
  { name: 'id_back',  maxCount: 1 },
  { name: 'selfie',   maxCount: 1 },
]), (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Only allow re-submit if previous was rejected or none
    const existing = db.prepare(`SELECT * FROM kyc_submissions WHERE user_id = ? AND status IN ('pending','approved')`).get(req.user.id);
    if (existing) return res.status(400).json({ error: existing.status === 'approved' ? 'Already verified' : 'KYC already pending review' });

    const files = req.files || {};
    if (!files.id_front) return res.status(400).json({ error: 'ID front photo required' });
    if (!files.selfie)   return res.status(400).json({ error: 'Selfie with ID required' });

    const { doc_type = 'passport', full_name, dob, country } = req.body;

    db.prepare(`
      INSERT INTO kyc_submissions (user_id, doc_type, full_name, dob, country, id_front_path, id_back_path, selfie_path, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      req.user.id, doc_type,
      full_name || user.full_name,
      dob || null, country || null,
      files.id_front?.[0]?.filename || null,
      files.id_back?.[0]?.filename  || null,
      files.selfie?.[0]?.filename   || null,
    );

    db.prepare(`UPDATE users SET kyc_status = 'pending' WHERE id = ?`).run(req.user.id);
    db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'kyc', ?, ?)`)
      .run(req.user.id, 'KYC Submitted', 'Your identity documents have been submitted and are under review (24–48h).');

    res.json({ success: true, message: 'KYC submitted successfully. Review takes 24–48 hours.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/kyc/document/:filename — serve KYC document (admin or owner only)
router.get('/document/:filename', authenticate, (req, res) => {
  try {
    const { filename } = req.params;
    // Verify this file belongs to the requesting user
    const sub = db.prepare(`SELECT * FROM kyc_submissions WHERE user_id = ? AND (id_front_path = ? OR id_back_path = ? OR selfie_path = ?)`).get(req.user.id, filename, filename, filename);
    if (!sub) return res.status(403).json({ error: 'Access denied' });
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    res.sendFile(filePath);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
