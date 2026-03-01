const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { getVipLevel } = require('../utils/vip');

const router = express.Router();

// ── Bonus definitions ─────────────────────────────────────────────────────────
// One-time bonuses keyed by bonus_id
const BONUS_DEFS = {
  first_deposit: {
    id: 'first_deposit',
    title: 'First Deposit Bonus',
    desc: 'Extra 10% on your first deposit',
    type: 'one_time',
    calcAmount: (user) => Math.round(user.total_deposited * 0.10 * 100) / 100,
  },
  vip_gold: {
    id: 'vip_gold',
    title: 'VIP Gold Bonus',
    desc: 'One-time $50 credit for reaching Gold',
    type: 'one_time',
    amount: 50,
  },
  vip_platinum: {
    id: 'vip_platinum',
    title: 'VIP Platinum Bonus',
    desc: 'One-time $150 credit for reaching Platinum',
    type: 'one_time',
    amount: 150,
  },
  vip_diamond: {
    id: 'vip_diamond',
    title: 'VIP Diamond Bonus',
    desc: 'One-time $500 credit for reaching Diamond',
    type: 'one_time',
    amount: 500,
  },
  loyalty_7: {
    id: 'loyalty_7',
    title: '7-Day Streak Bonus',
    desc: '+0.2% daily rate boost for 7 days',
    type: 'streak',
    amount: 25, // $25 cash equivalent of boost
  },
};

// ── Mission definitions ───────────────────────────────────────────────────────
const MISSION_DEFS = [
  {
    id: 'daily_run_bot',
    title: 'Run the Engine Today',
    desc: 'Complete 1 bot session today',
    category: 'daily',
    type: 'sessions',
    target: 1,
    reward: 0.50,
    icon: 'bot',
  },
  {
    id: 'daily_check_markets',
    title: 'Check the Markets',
    desc: 'Visit the Markets page today (auto-credited)',
    category: 'daily',
    type: 'visit',
    target: 1,
    reward: 0.10,
    icon: 'chart',
  },
  {
    id: 'daily_earn_any',
    title: 'Earn Something Today',
    desc: 'Earn at least $1 from the bot today',
    category: 'daily',
    type: 'earn',
    target: 1,
    reward: 0.25,
    icon: 'dollar',
  },
  {
    id: 'weekly_5_sessions',
    title: '5 Sessions This Week',
    desc: 'Complete 5 bot sessions this week',
    category: 'weekly',
    type: 'sessions',
    target: 5,
    reward: 2.00,
    icon: 'bot',
  },
  {
    id: 'weekly_refer_3',
    title: 'Refer 3 Friends This Week',
    desc: 'Get 3 new referrals who deposit this week',
    category: 'weekly',
    type: 'referrals',
    target: 3,
    reward: 75.00,
    icon: 'users',
  },
  {
    id: 'weekly_earn_50',
    title: 'Earn $50 This Week',
    desc: 'Earn at least $50 from bot sessions this week',
    category: 'weekly',
    type: 'earn',
    target: 50,
    reward: 5.00,
    icon: 'dollar',
  },
  {
    id: 'onetime_first_session',
    title: 'First Engine Run',
    desc: 'Run the Quant Engine for the first time',
    category: 'onetime',
    type: 'sessions',
    target: 1,
    reward: 1.00,
    icon: 'bot',
  },
  {
    id: 'onetime_invite_10',
    title: 'Invite 10 Friends',
    desc: 'Refer 10 friends who each make a deposit',
    category: 'onetime',
    type: 'referrals',
    target: 10,
    reward: 250.00,
    icon: 'users',
  },
  {
    id: 'onetime_invite_25',
    title: 'Invite 25 Friends',
    desc: 'Refer 25 friends who each make a deposit',
    category: 'onetime',
    type: 'referrals',
    target: 25,
    reward: 750.00,
    icon: 'users',
  },
  {
    id: 'onetime_invite_50',
    title: 'Invite 50 Friends',
    desc: 'Refer 50 friends who each make a deposit',
    category: 'onetime',
    type: 'referrals',
    target: 50,
    reward: 2000.00,
    icon: 'users',
  },
  {
    id: 'onetime_earn_500',
    title: 'Earn $500 Total',
    desc: 'Earn $500 cumulative from the bot',
    category: 'onetime',
    type: 'earn_total',
    target: 500,
    reward: 10.00,
    icon: 'dollar',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWeekPeriod() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getDayPeriod() {
  return new Date().toISOString().slice(0, 10);
}

function getPeriod(category) {
  if (category === 'daily') return getDayPeriod();
  if (category === 'weekly') return getWeekPeriod();
  return 'all';
}

// Compute live progress for a mission given fresh user stats
function computeProgress(def, userId) {
  const period = getPeriod(def.category);

  if (def.type === 'sessions') {
    if (def.category === 'daily') {
      const count = db.prepare(
        "SELECT COUNT(*) as c FROM bot_sessions WHERE user_id=? AND date(ended_at)=date('now') AND ended_at IS NOT NULL"
      ).get(userId)?.c ?? 0;
      return { progress: count, period };
    }
    if (def.category === 'weekly') {
      const count = db.prepare(
        "SELECT COUNT(*) as c FROM bot_sessions WHERE user_id=? AND ended_at IS NOT NULL AND ended_at >= date('now','-7 days')"
      ).get(userId)?.c ?? 0;
      return { progress: count, period };
    }
    // onetime: total sessions ever
    const count = db.prepare(
      "SELECT COUNT(*) as c FROM bot_sessions WHERE user_id=? AND ended_at IS NOT NULL"
    ).get(userId)?.c ?? 0;
    return { progress: count, period };
  }

  if (def.type === 'earn') {
    if (def.category === 'daily') {
      const amt = db.prepare(
        "SELECT COALESCE(SUM(earned),0) as s FROM bot_sessions WHERE user_id=? AND date(ended_at)=date('now')"
      ).get(userId)?.s ?? 0;
      return { progress: amt, period };
    }
    if (def.category === 'weekly') {
      const amt = db.prepare(
        "SELECT COALESCE(SUM(earned),0) as s FROM bot_sessions WHERE user_id=? AND ended_at >= date('now','-7 days')"
      ).get(userId)?.s ?? 0;
      return { progress: amt, period };
    }
  }

  if (def.type === 'earn_total') {
    const user = db.prepare('SELECT total_earned FROM users WHERE id=?').get(userId);
    return { progress: user?.total_earned ?? 0, period };
  }

  if (def.type === 'referrals') {
    if (def.category === 'weekly') {
      const count = db.prepare(
        "SELECT COUNT(*) as c FROM users WHERE referred_by=? AND date(created_at) >= date('now','-7 days') AND total_deposited > 0"
      ).get(userId)?.c ?? 0;
      return { progress: count, period };
    }
    // onetime: total active referrals
    const count = db.prepare(
      "SELECT COUNT(*) as c FROM users WHERE referred_by=? AND total_deposited > 0"
    ).get(userId)?.c ?? 0;
    return { progress: count, period };
  }

  if (def.type === 'visit') {
    // Handled by explicit mark endpoint
    const row = db.prepare(
      'SELECT progress FROM user_missions WHERE user_id=? AND mission_id=? AND period=?'
    ).get(userId, def.id, period);
    return { progress: row?.progress ?? 0, period };
  }

  return { progress: 0, period };
}

// Credit balance + record bonus
function creditBonus(userId, bonusId, amount, note) {
  const existing = db.prepare('SELECT id FROM user_bonuses WHERE user_id=? AND bonus_id=?').get(userId, bonusId);
  if (existing) return false;

  const user = db.prepare('SELECT balance, total_deposited FROM users WHERE id=?').get(userId);
  const newBalance = user.balance + amount;
  const vip = getVipLevel(newBalance);

  db.prepare('UPDATE users SET balance=?, vip_level=? WHERE id=?').run(newBalance, vip.name, userId);
  db.prepare('INSERT INTO user_bonuses (user_id, bonus_id, amount) VALUES (?,?,?)').run(userId, bonusId, amount);
  db.prepare(
    "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'bonus', ?, 'completed', ?)"
  ).run(userId, amount, note || `Bonus: ${bonusId}`);
  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'bonus', 'Bonus Credited!', ?)"
  ).run(userId, `$${amount.toFixed(2)} bonus credited to your account: ${note || bonusId}`);
  return true;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /bonuses — list all bonuses with claimed status for current user
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const claimed = db.prepare('SELECT bonus_id, amount, claimed_at FROM user_bonuses WHERE user_id=?').all(userId);
  const claimedMap = Object.fromEntries(claimed.map(c => [c.bonus_id, c]));

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);

  const bonuses = Object.values(BONUS_DEFS).map(def => {
    const claimRow = claimedMap[def.id];
    const amount = def.calcAmount ? def.calcAmount(user) : def.amount;
    return {
      ...def,
      amount,
      claimed: !!claimRow,
      claimed_at: claimRow?.claimed_at ?? null,
      claimed_amount: claimRow?.amount ?? null,
    };
  });

  res.json({ bonuses, user: { vip_level: user.vip_level, total_deposited: user.total_deposited, active_days: user.active_days } });
});

// POST /bonuses/check — auto-award any newly eligible bonuses (called after deposit/bot stop)
router.post('/check', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
  const awarded = [];

  // First deposit bonus
  if (user.total_deposited >= 100) {
    const amount = Math.round(user.total_deposited * 0.10 * 100) / 100;
    if (creditBonus(userId, 'first_deposit', amount, 'First Deposit Bonus (+10%)')) {
      awarded.push({ bonus_id: 'first_deposit', amount });
    }
  }

  // VIP upgrade bonuses
  const vipBonuses = { Gold: 'vip_gold', Platinum: 'vip_platinum', Diamond: 'vip_diamond' };
  const vipAmounts = { Gold: 50, Platinum: 150, Diamond: 500 };
  if (vipBonuses[user.vip_level]) {
    const bid = vipBonuses[user.vip_level];
    const amt = vipAmounts[user.vip_level];
    if (creditBonus(userId, bid, amt, `VIP ${user.vip_level} Upgrade Bonus`)) {
      awarded.push({ bonus_id: bid, amount: amt });
    }
  }

  // Loyalty streak: 7 consecutive active days
  const activeDays = db.prepare(
    "SELECT COUNT(DISTINCT date(ended_at)) as c FROM bot_sessions WHERE user_id=? AND ended_at >= date('now','-7 days') AND ended_at IS NOT NULL"
  ).get(userId)?.c ?? 0;
  if (activeDays >= 7) {
    if (creditBonus(userId, 'loyalty_7', 25, '7-Day Streak Bonus')) {
      awarded.push({ bonus_id: 'loyalty_7', amount: 25 });
    }
  }

  res.json({ awarded });
});

// GET /bonuses/missions — list missions with live progress for current user
router.get('/missions', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const missions = MISSION_DEFS.map(def => {
    const { progress, period } = computeProgress(def, userId);
    const completed = progress >= def.target;

    // Check if claimed for this period
    const claimRow = db.prepare(
      'SELECT claimed FROM user_missions WHERE user_id=? AND mission_id=? AND period=?'
    ).get(userId, def.id, period);

    const claimed = !!(claimRow?.claimed);

    // Upsert progress (not claimed status — that's done at claim time)
    db.prepare(`
      INSERT INTO user_missions (user_id, mission_id, progress, completed, period, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, mission_id, period) DO UPDATE SET
        progress=excluded.progress,
        completed=excluded.completed,
        updated_at=excluded.updated_at
    `).run(userId, def.id, progress, completed ? 1 : 0, period);

    return {
      ...def,
      progress,
      completed,
      claimed,
      period,
    };
  });

  res.json({ missions });
});

// POST /bonuses/missions/:id/claim — claim reward for completed mission
router.post('/missions/:id/claim', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const def = MISSION_DEFS.find(m => m.id === req.params.id);
  if (!def) return res.status(404).json({ error: 'Mission not found' });

  const period = getPeriod(def.category);
  const { progress } = computeProgress(def, userId);

  if (progress < def.target) {
    return res.status(400).json({ error: 'Mission not completed yet' });
  }

  const claimRow = db.prepare(
    'SELECT claimed FROM user_missions WHERE user_id=? AND mission_id=? AND period=?'
  ).get(userId, def.id, period);

  if (claimRow?.claimed) {
    return res.status(400).json({ error: 'Already claimed for this period' });
  }

  // Credit reward
  const user = db.prepare('SELECT balance FROM users WHERE id=?').get(userId);
  const newBalance = user.balance + def.reward;
  const vip = getVipLevel(newBalance);
  db.prepare('UPDATE users SET balance=?, vip_level=? WHERE id=?').run(newBalance, vip.name, userId);

  db.prepare(`
    INSERT INTO user_missions (user_id, mission_id, progress, completed, claimed, period, updated_at)
    VALUES (?, ?, ?, 1, 1, ?, datetime('now'))
    ON CONFLICT(user_id, mission_id, period) DO UPDATE SET claimed=1, updated_at=datetime('now')
  `).run(userId, def.id, progress, period);

  db.prepare(
    "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'bonus', ?, 'completed', ?)"
  ).run(userId, def.reward, `Mission reward: ${def.title}`);

  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'bonus', 'Mission Reward Claimed!', ?)"
  ).run(userId, `$${def.reward.toFixed(2)} rewarded for completing: "${def.title}"`);

  res.json({ message: `$${def.reward.toFixed(2)} added to your balance!`, new_balance: newBalance });
});

// POST /bonuses/missions/mark-visit — mark daily market visit mission
router.post('/missions/mark-visit', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const period = getDayPeriod();

  db.prepare(`
    INSERT INTO user_missions (user_id, mission_id, progress, completed, period, updated_at)
    VALUES (?, 'daily_check_markets', 1, 1, ?, datetime('now'))
    ON CONFLICT(user_id, mission_id, period) DO UPDATE SET
      progress=1, completed=1, updated_at=datetime('now')
  `).run(userId, period);

  res.json({ ok: true });
});

module.exports = router;
