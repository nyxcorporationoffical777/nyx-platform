const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { getVipLevel } = require('../utils/vip');
const https = require('https');
const { checkAndAwardBonuses } = require('./bonusHelper');
const email = require('../services/emailService');

const router = express.Router();

// Platform USDT deposit address (TRC20) — replace with your real wallet address
const PLATFORM_DEPOSIT_ADDRESS = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';
const MIN_DEPOSIT_USDT = 100;

// Helper: fetch JSON over HTTPS (no extra deps)
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NyxPlatform/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// POST /assets/deposit-txid — verify a TRC20 USDT transaction and credit balance
router.post('/deposit-txid', authenticateToken, async (req, res) => {
  const { txid } = req.body;
  if (!txid || typeof txid !== 'string' || txid.trim().length < 10) {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }
  const cleanTxid = txid.trim();

  // Check if this TxID has already been processed
  const existing = db.prepare('SELECT id FROM crypto_deposits WHERE txid = ?').get(cleanTxid);
  if (existing) {
    return res.status(400).json({ error: 'This transaction has already been credited' });
  }

  try {
    // Query TronScan API for transaction details (free, no API key needed)
    const apiUrl = `https://apilist.tronscanapi.com/api/transaction-info?hash=${cleanTxid}`;
    const txData = await fetchJson(apiUrl);

    // Validate the transaction exists and is confirmed
    if (!txData || txData.contractRet !== 'SUCCESS') {
      return res.status(400).json({ error: 'Transaction not found or not confirmed yet. Please wait a few minutes and try again.' });
    }

    // Check it's a TRC20 USDT transfer
    const trc20 = txData.trc20TransferInfo;
    if (!trc20 || !Array.isArray(trc20) || trc20.length === 0) {
      return res.status(400).json({ error: 'This is not a USDT TRC20 transfer transaction.' });
    }

    const transfer = trc20[0];
    // USDT TRC20 contract on Tron mainnet
    const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    if (!transfer.contract_address || transfer.contract_address.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
      return res.status(400).json({ error: 'Transaction is not a USDT transfer.' });
    }

    // Check destination address matches platform deposit address
    const toAddress = transfer.to_address || txData.toAddress;
    if (!toAddress || toAddress.toLowerCase() !== PLATFORM_DEPOSIT_ADDRESS.toLowerCase()) {
      return res.status(400).json({
        error: `Transaction was not sent to the Nyx deposit address. Expected: ${PLATFORM_DEPOSIT_ADDRESS}`
      });
    }

    // Parse USDT amount (6 decimals for TRC20 USDT)
    const rawAmount = Number(transfer.amount_str || transfer.amount || 0);
    const usdtAmount = rawAmount / 1_000_000;

    if (usdtAmount < MIN_DEPOSIT_USDT) {
      return res.status(400).json({ error: `Minimum deposit is $${MIN_DEPOSIT_USDT} USDT. This transaction was ${usdtAmount.toFixed(2)} USDT.` });
    }

    // All checks passed — credit the user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const newBalance = user.balance + usdtAmount;
    const vip = getVipLevel(newBalance);

    db.prepare(
      'UPDATE users SET balance = ?, total_deposited = ?, vip_level = ? WHERE id = ?'
    ).run(newBalance, user.total_deposited + usdtAmount, vip.name, req.user.id);

    db.prepare(
      "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'deposit', ?, 'completed', ?)"
    ).run(req.user.id, usdtAmount, `USDT TRC20 deposit · TxID: ${cleanTxid.slice(0, 16)}...`);

    db.prepare(
      'INSERT INTO crypto_deposits (user_id, txid, amount_usdt, network, status) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, cleanTxid, usdtAmount, 'TRC20', 'confirmed');

    db.prepare(
      "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'deposit', 'USDT Deposit Confirmed', ?)"
    ).run(req.user.id, `$${usdtAmount.toFixed(2)} USDT received on-chain. New balance: $${newBalance.toFixed(2)}. VIP: ${vip.name}.`);

    checkAndAwardBonuses(req.user.id);
    // Send confirmation email
    const depositUser = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(req.user.id);
    if (depositUser) email.sendDepositConfirmed(depositUser.email, depositUser.full_name, usdtAmount, cleanTxid).catch(() => {});
    res.json({
      message: `Deposit confirmed! $${usdtAmount.toFixed(2)} USDT added to your balance.`,
      amount: usdtAmount,
      new_balance: newBalance,
      vip_level: vip.name,
    });

  } catch (err) {
    console.error('TxID verification error:', err.message);
    res.status(502).json({ error: 'Failed to verify transaction. TronScan may be temporarily unavailable. Try again in a moment.' });
  }
});

router.post('/deposit', authenticateToken, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (Number(amount) < 50) return res.status(400).json({ error: 'Minimum deposit is $50' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const newBalance = user.balance + Number(amount);
  const vip = getVipLevel(newBalance);

  db.prepare(
    'UPDATE users SET balance = ?, total_deposited = ?, vip_level = ? WHERE id = ?'
  ).run(newBalance, user.total_deposited + Number(amount), vip.name, req.user.id);

  db.prepare(
    "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'deposit', ?, 'completed', 'Manual deposit')"
  ).run(req.user.id, Number(amount));

  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'deposit', 'Deposit Confirmed', ?)"
  ).run(req.user.id, `$${Number(amount).toFixed(2)} deposited successfully. New balance: $${newBalance.toFixed(2)}. VIP: ${vip.name}.`);

  checkAndAwardBonuses(req.user.id);
  const depUser = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(req.user.id);
  if (depUser) email.sendDepositConfirmed(depUser.email, depUser.full_name, Number(amount), 'manual').catch(() => {});
  res.json({ message: 'Deposit successful', new_balance: newBalance, vip_level: vip.name });
});

router.post('/withdraw', authenticateToken, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (user.bot_running) return res.status(400).json({ error: 'Stop the bot before withdrawing' });
  if (Number(amount) > user.balance) return res.status(400).json({ error: 'Insufficient balance' });
  if (user.balance < 100) return res.status(400).json({ error: 'Minimum balance of $100 required to withdraw.' });
  if (!user.crypto_address) return res.status(400).json({ error: 'Set a withdrawal address in Account settings first.' });

  // Check for already-pending request
  const pending = db.prepare("SELECT id FROM withdrawal_requests WHERE user_id = ? AND status = 'pending'").get(req.user.id);
  if (pending) return res.status(400).json({ error: 'You already have a pending withdrawal request. Wait for it to be processed.' });

  const amt = Number(amount);
  const newBalance = user.balance - amt;
  const vip = getVipLevel(newBalance);

  // Deduct balance immediately (held in escrow until admin approves/rejects)
  db.prepare('UPDATE users SET balance = ?, vip_level = ? WHERE id = ?').run(newBalance, vip.name, req.user.id);

  db.prepare(
    'INSERT INTO withdrawal_requests (user_id, amount, crypto_address, crypto_network) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, amt, user.crypto_address, user.crypto_network || 'TRC20');

  db.prepare(
    "INSERT INTO transactions (user_id, type, amount, status, note) VALUES (?, 'withdraw', ?, 'pending', ?)"
  ).run(req.user.id, amt, `Withdrawal request submitted · To: ${user.crypto_address.slice(0, 12)}...`);

  db.prepare(
    "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'withdraw', 'Withdrawal Request Submitted', ?)"
  ).run(req.user.id, `$${amt.toFixed(2)} withdrawal request submitted. Funds will be sent to your ${user.crypto_network || 'crypto'} address within 24–72 hours after admin review.`);

  const wdUser = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(req.user.id);
  if (wdUser) email.sendWithdrawalRequested(wdUser.email, wdUser.full_name, amt, user.crypto_address).catch(() => {});
  res.json({ message: `Withdrawal request of $${amt.toFixed(2)} submitted. Processing within 24–72 hours.`, new_balance: newBalance });
});

// GET /assets/withdrawal-requests — user's own requests
router.get('/withdrawal-requests', authenticateToken, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT 20'
  ).all(req.user.id);
  res.json(rows);
});

router.get('/transactions', authenticateToken, (req, res) => {
  const transactions = db.prepare(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);
  res.json(transactions);
});

router.get('/balance', authenticateToken, (req, res) => {
  const user = db.prepare(
    'SELECT balance, total_deposited, total_withdrawn, total_earned, vip_level FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json(user);
});

module.exports = router;
