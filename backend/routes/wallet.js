const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken: authenticate } = require('../middleware/auth');
const { getPrice } = require('../services/priceFeed');

// Deposit addresses per asset (platform-controlled)
const DEPOSIT_ADDRESSES = {
  USDT: { address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', network: 'TRC20' },
  BTC:  { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf', network: 'BTC Network' },
  ETH:  { address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', network: 'ERC20' },
  BNB:  { address: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2', network: 'BEP20' },
  SOL:  { address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', network: 'Solana' },
  XRP:  { address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', network: 'XRP Ledger' },
  DOGE: { address: 'D8vFETfo3CSXQ7TBKL4WfRGtSAE6WqzGAc', network: 'DOGE Network' },
};

const SUPPORTED_ASSETS = Object.keys(DEPOSIT_ADDRESSES);

// Ensure wallet row exists for user+asset
function ensureWallet(userId, asset) {
  db.prepare(`
    INSERT OR IGNORE INTO wallet_assets (user_id, asset, balance, deposit_address)
    VALUES (?, ?, 0, ?)
  `).run(userId, asset, DEPOSIT_ADDRESSES[asset]?.address || null);
}

// GET /api/wallet - full portfolio
router.get('/', authenticate, async (req, res) => {
  try {
    // Ensure all asset rows exist
    for (const asset of SUPPORTED_ASSETS) {
      ensureWallet(req.user.id, asset);
    }

    const rows = db.prepare(`SELECT * FROM wallet_assets WHERE user_id = ?`).all(req.user.id);

    // Enrich with live USD values
    const assets = await Promise.all(rows.map(async (row) => {
      let usdValue = row.balance;
      if (row.asset !== 'USDT') {
        const price = await getPrice(row.asset + 'USDT');
        usdValue = price ? row.balance * price : 0;
      }
      return {
        ...row,
        usd_value: parseFloat(usdValue.toFixed(2)),
        deposit_address: DEPOSIT_ADDRESSES[row.asset]?.address || null,
        network: DEPOSIT_ADDRESSES[row.asset]?.network || null,
      };
    }));

    const totalUsd = assets.reduce((s, a) => s + a.usd_value, 0);
    res.json({ assets, total_usd: parseFloat(totalUsd.toFixed(2)) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/wallet/transactions - wallet transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const txs = db.prepare(`
      SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
    `).all(req.user.id);
    res.json({ transactions: txs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/wallet/convert - convert between assets (USDT <-> crypto, using live price)
router.post('/convert', authenticate, async (req, res) => {
  try {
    const { from_asset, to_asset, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!SUPPORTED_ASSETS.includes(from_asset) || !SUPPORTED_ASSETS.includes(to_asset)) {
      return res.status(400).json({ error: 'Unsupported asset' });
    }
    if (from_asset === to_asset) return res.status(400).json({ error: 'Cannot convert to same asset' });

    ensureWallet(req.user.id, from_asset);
    ensureWallet(req.user.id, to_asset);

    const fromWallet = db.prepare(`SELECT * FROM wallet_assets WHERE user_id = ? AND asset = ?`).get(req.user.id, from_asset);
    if (!fromWallet || fromWallet.balance < amount) {
      return res.status(400).json({ error: `Insufficient ${from_asset} balance` });
    }

    // Calculate conversion
    let toAmount;
    const FEE = 0.001; // 0.1% conversion fee

    if (from_asset === 'USDT') {
      const price = await getPrice(to_asset + 'USDT');
      if (!price) return res.status(503).json({ error: 'Price feed unavailable' });
      toAmount = (amount / price) * (1 - FEE);
    } else if (to_asset === 'USDT') {
      const price = await getPrice(from_asset + 'USDT');
      if (!price) return res.status(503).json({ error: 'Price feed unavailable' });
      toAmount = amount * price * (1 - FEE);
    } else {
      // Cross-pair via USDT
      const fromPrice = await getPrice(from_asset + 'USDT');
      const toPrice = await getPrice(to_asset + 'USDT');
      if (!fromPrice || !toPrice) return res.status(503).json({ error: 'Price feed unavailable' });
      const usdValue = amount * fromPrice;
      toAmount = (usdValue / toPrice) * (1 - FEE);
    }

    db.prepare(`UPDATE wallet_assets SET balance = balance - ? WHERE user_id = ? AND asset = ?`).run(amount, req.user.id, from_asset);
    db.prepare(`UPDATE wallet_assets SET balance = balance + ? WHERE user_id = ? AND asset = ?`).run(toAmount, req.user.id, to_asset);

    // Log transaction
    db.prepare(`INSERT INTO transactions (user_id, type, amount, note) VALUES (?, 'convert', ?, ?)`).run(
      req.user.id, amount, `Convert ${amount} ${from_asset} → ${toAmount.toFixed(8)} ${to_asset}`
    );

    res.json({ success: true, from_amount: amount, to_amount: toAmount, from_asset, to_asset });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
