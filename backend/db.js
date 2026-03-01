const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'quantifypro.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    transaction_password TEXT DEFAULT NULL,
    avatar TEXT DEFAULT NULL,
    balance REAL DEFAULT 0,
    total_deposited REAL DEFAULT 0,
    total_withdrawn REAL DEFAULT 0,
    total_earned REAL DEFAULT 0,
    referral_earnings REAL DEFAULT 0,
    vip_level TEXT DEFAULT 'Starter',
    bot_running INTEGER DEFAULT 0,
    bot_started_at TEXT DEFAULT NULL,
    active_days INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE DEFAULT NULL,
    referred_by INTEGER DEFAULT NULL,
    crypto_address TEXT DEFAULT NULL,
    crypto_network TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (referred_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'completed',
    note TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bot_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT DEFAULT NULL,
    earned REAL DEFAULT 0,
    vip_level TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_bonuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bonus_id TEXT NOT NULL,
    amount REAL NOT NULL,
    claimed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, bonus_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mission_id TEXT NOT NULL,
    progress REAL DEFAULT 0,
    completed INTEGER DEFAULT 0,
    claimed INTEGER DEFAULT 0,
    period TEXT DEFAULT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, mission_id, period),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    crypto_address TEXT NOT NULL,
    crypto_network TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_note TEXT DEFAULT NULL,
    requested_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS crypto_deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    txid TEXT UNIQUE NOT NULL,
    amount_usdt REAL NOT NULL,
    network TEXT DEFAULT 'TRC20',
    status TEXT DEFAULT 'confirmed',
    credited_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS wallet_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    asset TEXT NOT NULL,
    balance REAL DEFAULT 0,
    total_deposited REAL DEFAULT 0,
    total_withdrawn REAL DEFAULT 0,
    deposit_address TEXT DEFAULT NULL,
    UNIQUE(user_id, asset),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS futures_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL,
    leverage INTEGER NOT NULL,
    entry_price REAL NOT NULL,
    size REAL NOT NULL,
    margin REAL NOT NULL,
    take_profit REAL DEFAULT NULL,
    stop_loss REAL DEFAULT NULL,
    liquidation_price REAL NOT NULL,
    status TEXT DEFAULT 'open',
    close_price REAL DEFAULT NULL,
    pnl REAL DEFAULT NULL,
    opened_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS kyc_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    doc_type TEXT DEFAULT 'passport',
    full_name TEXT,
    dob TEXT,
    country TEXT,
    id_front_path TEXT,
    id_back_path TEXT,
    selfie_path TEXT,
    status TEXT DEFAULT 'pending',
    admin_note TEXT,
    submitted_at TEXT DEFAULT (datetime('now')),
    reviewed_at TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS staking_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    plan TEXT NOT NULL,
    apy REAL NOT NULL,
    duration_days INTEGER NOT NULL,
    earned REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    staked_at TEXT DEFAULT (datetime('now')),
    unlocks_at TEXT NOT NULL,
    unstaked_at TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Add new columns to existing DB if they don't exist (migration)
const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
const newCols = [
  { name: 'transaction_password', def: 'TEXT DEFAULT NULL' },
  { name: 'referral_earnings',    def: 'REAL DEFAULT 0' },
  { name: 'referral_code',        def: 'TEXT DEFAULT NULL' },
  { name: 'referred_by',          def: 'INTEGER DEFAULT NULL' },
  { name: 'crypto_address',       def: 'TEXT DEFAULT NULL' },
  { name: 'crypto_network',       def: 'TEXT DEFAULT NULL' },
  { name: 'session_duration',     def: 'INTEGER DEFAULT 300' },
  { name: 'last_bot_date',        def: 'TEXT DEFAULT NULL' },
  { name: 'deposit_address',      def: 'TEXT DEFAULT NULL' },
  { name: 'totp_secret',          def: 'TEXT DEFAULT NULL' },
  { name: 'totp_enabled',         def: 'INTEGER DEFAULT 0' },
  { name: 'kyc_status',           def: "TEXT DEFAULT 'unverified'" },
];
for (const col of newCols) {
  if (!userCols.includes(col.name)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
  }
}

module.exports = db;
