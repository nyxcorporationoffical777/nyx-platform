const VIP_LEVELS = [
  { name: 'Starter',  minBalance: 100,    dailyRate: 0.0180 },
  { name: 'Silver',   minBalance: 500,    dailyRate: 0.0220 },
  { name: 'Gold',     minBalance: 2000,   dailyRate: 0.0280 },
  { name: 'Platinum', minBalance: 5000,   dailyRate: 0.0350 },
  { name: 'Diamond',  minBalance: 10000,  dailyRate: 0.0500 },
];

function getVipLevel(balance) {
  let level = VIP_LEVELS[0];
  for (const l of VIP_LEVELS) {
    if (balance >= l.minBalance) level = l;
  }
  return level;
}

function getDailyRate(balance) {
  return getVipLevel(balance).dailyRate;
}

module.exports = { VIP_LEVELS, getVipLevel, getDailyRate };
