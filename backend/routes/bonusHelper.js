const db = require('../db');
const { getVipLevel } = require('../utils/vip');

function creditBonus(userId, bonusId, amount, note) {
  const existing = db.prepare('SELECT id FROM user_bonuses WHERE user_id=? AND bonus_id=?').get(userId, bonusId);
  if (existing) return false;

  const user = db.prepare('SELECT balance FROM users WHERE id=?').get(userId);
  const newBalance = user.balance + amount;
  const vip = getVipLevel(newBalance);

  db.prepare('UPDATE users SET balance=?, vip_level=? WHERE id=?').run(newBalance, vip.name, userId);
  db.prepare('INSERT INTO user_bonuses (user_id, bonus_id, amount) VALUES (?,?,?)').run(userId, bonusId, amount);
  db.prepare(
    "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'bonus', ?, 'completed', ?)"
  ).run(userId, amount, note || `Bonus: ${bonusId}`);
  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'bonus', 'Bonus Credited!', ?)"
  ).run(userId, `$${amount.toFixed(2)} bonus credited: ${note || bonusId}`);
  return true;
}

function checkAndAwardBonuses(userId) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
    if (!user) return [];
    const awarded = [];

    // VIP upgrade bonuses
    const vipBonuses = { Gold: ['vip_gold', 50], Platinum: ['vip_platinum', 150], Diamond: ['vip_diamond', 500] };
    if (vipBonuses[user.vip_level]) {
      const [bid, amt] = vipBonuses[user.vip_level];
      if (creditBonus(userId, bid, amt, `VIP ${user.vip_level} Upgrade Bonus`)) {
        awarded.push({ bonus_id: bid, amount: amt });
      }
    }

    // Loyalty 7-day streak
    const activeDays = db.prepare(
      "SELECT COUNT(DISTINCT date(ended_at)) as c FROM bot_sessions WHERE user_id=? AND ended_at >= date('now','-7 days') AND ended_at IS NOT NULL"
    ).get(userId)?.c ?? 0;
    if (activeDays >= 7) {
      if (creditBonus(userId, 'loyalty_7', 25, '7-Day Streak Bonus')) {
        awarded.push({ bonus_id: 'loyalty_7', amount: 25 });
      }
    }

    return awarded;
  } catch (e) {
    console.error('Bonus check error:', e.message);
    return [];
  }
}

module.exports = { checkAndAwardBonuses, creditBonus };
