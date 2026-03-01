const jwt = require('jsonwebtoken');

const ADMIN_SECRET = 'quantifypro_admin_secret_2025';

// Hardcoded admin credentials - change these to your preferred login
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@QuantifyPro2025!';

function adminLogin(req, res) {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ role: 'admin' }, ADMIN_SECRET, { expiresIn: '8h' });
  res.json({ token });
}

function authenticateAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin token required' });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), ADMIN_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired admin token' });
  }
}

module.exports = { adminLogin, authenticateAdmin };
