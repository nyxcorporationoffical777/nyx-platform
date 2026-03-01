const express = require('express');
const router = express.Router();
const https = require('https');
const db = require('../db');
const { authenticateToken: authenticate } = require('../middleware/auth');
const { getPrice } = require('../services/priceFeed');
const email = require('../services/emailService');

// Fetch Binance klines (OHLC) for charting
function fetchKlines(symbol, interval, limit) {
  return new Promise((resolve) => {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    https.get(url, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          const candles = data.map(k => ({
            time: k[0],
            open:  parseFloat(k[1]),
            high:  parseFloat(k[2]),
            low:   parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
          }));
          resolve(candles);
        } catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

// Supported pairs and max leverage
const PAIRS = {
  // Tier 1 — high liquidity
  'BTCUSDT':    { maxLev: 125, maintMarginRate: 0.004 },
  'ETHUSDT':    { maxLev: 100, maintMarginRate: 0.005 },
  'BNBUSDT':    { maxLev: 75,  maintMarginRate: 0.006 },
  'SOLUSDT':    { maxLev: 75,  maintMarginRate: 0.006 },
  'XRPUSDT':    { maxLev: 75,  maintMarginRate: 0.006 },
  // Tier 2 — major alts
  'ADAUSDT':    { maxLev: 50,  maintMarginRate: 0.008 },
  'DOGEUSDT':   { maxLev: 50,  maintMarginRate: 0.008 },
  'AVAXUSDT':   { maxLev: 50,  maintMarginRate: 0.008 },
  'LTCUSDT':    { maxLev: 75,  maintMarginRate: 0.006 },
  'DOTUSDT':    { maxLev: 50,  maintMarginRate: 0.008 },
  'LINKUSDT':   { maxLev: 50,  maintMarginRate: 0.008 },
  'UNIUSDT':    { maxLev: 50,  maintMarginRate: 0.010 },
  'ATOMUSDT':   { maxLev: 50,  maintMarginRate: 0.010 },
  'ETCUSDT':    { maxLev: 50,  maintMarginRate: 0.010 },
  'XLMUSDT':    { maxLev: 50,  maintMarginRate: 0.010 },
  // Tier 3 — mid caps
  'TRXUSDT':    { maxLev: 50,  maintMarginRate: 0.010 },
  'FILUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'AAVEUSDT':   { maxLev: 25,  maintMarginRate: 0.015 },
  'NEARUSDT':   { maxLev: 50,  maintMarginRate: 0.010 },
  'APTUSDT':    { maxLev: 50,  maintMarginRate: 0.010 },
  'ARBUSDT':    { maxLev: 50,  maintMarginRate: 0.010 },
  'OPUSDT':     { maxLev: 50,  maintMarginRate: 0.010 },
  'INJUSDT':    { maxLev: 50,  maintMarginRate: 0.010 },
  'SUIUSDT':    { maxLev: 50,  maintMarginRate: 0.010 },
  'SEIUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'TIAUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'WIFUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'BONKUSDT':   { maxLev: 20,  maintMarginRate: 0.020 },
  'PEPEUSDT':   { maxLev: 20,  maintMarginRate: 0.020 },
  // Tier 4 — layer1/layer2
  'MATICUSDT':  { maxLev: 50,  maintMarginRate: 0.010 },
  'FTMUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'ALGOUSDT':   { maxLev: 25,  maintMarginRate: 0.015 },
  'ICPUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'SANDUSDT':   { maxLev: 25,  maintMarginRate: 0.015 },
  'MANAUSDT':   { maxLev: 25,  maintMarginRate: 0.015 },
  'AXSUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'GALAUSDT':   { maxLev: 20,  maintMarginRate: 0.020 },
  'APEUSDT':    { maxLev: 20,  maintMarginRate: 0.020 },
  'GMTUSDT':    { maxLev: 20,  maintMarginRate: 0.020 },
  'LDOUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'STXUSDT':    { maxLev: 25,  maintMarginRate: 0.015 },
  'RUNEUSDT':   { maxLev: 25,  maintMarginRate: 0.015 },
  'CFXUSDT':    { maxLev: 20,  maintMarginRate: 0.020 },
};

// Calculate liquidation price
function calcLiqPrice(direction, entryPrice, leverage, maintMarginRate) {
  if (direction === 'long') {
    return entryPrice * (1 - 1 / leverage + maintMarginRate);
  } else {
    return entryPrice * (1 + 1 / leverage - maintMarginRate);
  }
}

// GET /api/futures/chart - real OHLC klines from Binance
router.get('/chart', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', interval = '15m', limit = 100 } = req.query;
    const validIntervals = ['1m','3m','5m','15m','30m','1h','2h','4h','6h','12h','1d','1w'];
    if (!validIntervals.includes(interval)) return res.status(400).json({ error: 'Invalid interval' });
    const candles = await fetchKlines(symbol, interval, Math.min(parseInt(limit) || 100, 500));
    res.json({ symbol, interval, candles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/futures/ticker - 24h stats for all pairs
router.get('/ticker', async (req, res) => {
  try {
    const url = 'https://api.binance.com/api/v3/ticker/24hr';
    https.get(url, (response) => {
      let raw = '';
      response.on('data', d => raw += d);
      response.on('end', () => {
        try {
          const all = JSON.parse(raw);
          const pairs = Object.keys(PAIRS);
          const filtered = all
            .filter(t => pairs.includes(t.symbol))
            .map(t => ({
              symbol: t.symbol,
              price: parseFloat(t.lastPrice),
              change: parseFloat(t.priceChangePercent),
              high: parseFloat(t.highPrice),
              low: parseFloat(t.lowPrice),
              volume: parseFloat(t.quoteVolume),
            }));
          res.json({ tickers: filtered });
        } catch { res.json({ tickers: [] }); }
      });
    }).on('error', () => res.json({ tickers: [] }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/futures/prices - live prices for all pairs
router.get('/prices', async (req, res) => {
  try {
    const prices = {};
    for (const sym of Object.keys(PAIRS)) {
      prices[sym] = await getPrice(sym);
    }
    res.json({ prices, pairs: PAIRS });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/futures/positions - open positions for user
router.get('/positions', authenticate, async (req, res) => {
  try {
    const positions = db.prepare(
      `SELECT * FROM futures_positions WHERE user_id = ? AND status = 'open' ORDER BY opened_at DESC`
    ).all(req.user.id);

    // Enrich with live PnL
    const enriched = await Promise.all(positions.map(async (p) => {
      const livePrice = await getPrice(p.symbol);
      let pnl = 0;
      if (livePrice) {
        const priceDiff = p.direction === 'long'
          ? livePrice - p.entry_price
          : p.entry_price - livePrice;
        pnl = (priceDiff / p.entry_price) * p.margin * p.leverage;
      }
      return { ...p, live_price: livePrice, unrealized_pnl: parseFloat(pnl.toFixed(4)) };
    }));

    res.json({ positions: enriched });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/futures/history - closed positions
router.get('/history', authenticate, async (req, res) => {
  try {
    const history = db.prepare(
      `SELECT * FROM futures_positions WHERE user_id = ? AND status != 'open' ORDER BY closed_at DESC LIMIT 50`
    ).all(req.user.id);
    res.json({ history });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/futures/open - open a position
router.post('/open', authenticate, async (req, res) => {
  try {
    const { symbol, direction, leverage, margin, take_profit, stop_loss } = req.body;

    if (!PAIRS[symbol]) return res.status(400).json({ error: 'Unsupported pair' });
    if (!['long', 'short'].includes(direction)) return res.status(400).json({ error: 'Invalid direction' });
    if (!leverage || leverage < 1 || leverage > PAIRS[symbol].maxLev) {
      return res.status(400).json({ error: `Leverage must be 1–${PAIRS[symbol].maxLev}x for ${symbol}` });
    }
    if (!margin || margin < 1) return res.status(400).json({ error: 'Minimum margin is $1' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.balance < margin) return res.status(400).json({ error: 'Insufficient balance' });

    const entryPrice = await getPrice(symbol);
    if (!entryPrice) return res.status(503).json({ error: 'Price feed unavailable' });

    const size = (margin * leverage) / entryPrice;
    const liqPrice = calcLiqPrice(direction, entryPrice, leverage, PAIRS[symbol].maintMarginRate);

    // Deduct margin from balance
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(margin, req.user.id);

    const result = db.prepare(`
      INSERT INTO futures_positions (user_id, symbol, direction, leverage, entry_price, size, margin, take_profit, stop_loss, liquidation_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, symbol, direction, leverage, entryPrice, size, margin,
      take_profit || null, stop_loss || null, liqPrice);

    // Notification
    db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'trade_open', ?, ?)`)
      .run(req.user.id,
        `${direction.toUpperCase()} ${symbol} Opened`,
        `Opened ${direction} ${symbol} @ $${entryPrice.toFixed(2)} | ${leverage}x leverage | Margin: $${margin}`
      );

    res.json({
      success: true,
      position_id: result.lastInsertRowid,
      entry_price: entryPrice,
      liquidation_price: liqPrice,
      size,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/futures/close/:id - close a position
router.post('/close/:id', authenticate, async (req, res) => {
  try {
    const position = db.prepare(
      `SELECT * FROM futures_positions WHERE id = ? AND user_id = ? AND status = 'open'`
    ).get(req.params.id, req.user.id);

    if (!position) return res.status(404).json({ error: 'Position not found or already closed' });

    const closePrice = await getPrice(position.symbol);
    if (!closePrice) return res.status(503).json({ error: 'Price feed unavailable' });

    const priceDiff = position.direction === 'long'
      ? closePrice - position.entry_price
      : position.entry_price - closePrice;
    const pnl = (priceDiff / position.entry_price) * position.margin * position.leverage;
    const returned = position.margin + pnl;

    // Credit back margin + pnl (if positive), or deduct loss
    const creditAmount = Math.max(0, returned);
    db.prepare('UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?')
      .run(creditAmount, Math.max(0, pnl), req.user.id);

    db.prepare(`
      UPDATE futures_positions SET status = 'closed', close_price = ?, pnl = ?, closed_at = datetime('now') WHERE id = ?
    `).run(closePrice, pnl, position.id);

    const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
    db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'trade_close', ?, ?)`)
      .run(req.user.id,
        `${position.direction.toUpperCase()} ${position.symbol} Closed`,
        `Closed @ $${closePrice.toFixed(2)} | PnL: ${pnlStr}`
      );

    res.json({ success: true, close_price: closePrice, pnl, returned: creditAmount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Internal liquidation check (called periodically)
async function runLiquidationCheck() {
  try {
    const openPositions = db.prepare(`SELECT * FROM futures_positions WHERE status = 'open'`).all();
    for (const pos of openPositions) {
      const livePrice = await getPrice(pos.symbol);
      if (!livePrice) continue;

      const isLiquidated = pos.direction === 'long'
        ? livePrice <= pos.liquidation_price
        : livePrice >= pos.liquidation_price;

      // Check TP/SL
      const tpHit = pos.take_profit && (
        pos.direction === 'long' ? livePrice >= pos.take_profit : livePrice <= pos.take_profit
      );
      const slHit = pos.stop_loss && (
        pos.direction === 'long' ? livePrice <= pos.stop_loss : livePrice >= pos.stop_loss
      );

      if (isLiquidated) {
        db.prepare(`UPDATE futures_positions SET status = 'liquidated', close_price = ?, pnl = ?, closed_at = datetime('now') WHERE id = ?`)
          .run(livePrice, -pos.margin, pos.id);
        db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'liquidation', ?, ?)`)
          .run(pos.user_id, `Position Liquidated`, `Your ${pos.direction} ${pos.symbol} position was liquidated at $${livePrice.toFixed(2)}. Margin lost: $${pos.margin}`);
        const liqUser = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(pos.user_id);
        if (liqUser) email.sendLiquidationAlert(liqUser.email, liqUser.full_name, pos.symbol, pos.direction, pos.margin).catch(() => {});
      } else if (tpHit || slHit) {
        const label = tpHit ? 'take_profit' : 'stop_loss';
        const priceDiff = pos.direction === 'long'
          ? livePrice - pos.entry_price
          : pos.entry_price - livePrice;
        const pnl = (priceDiff / pos.entry_price) * pos.margin * pos.leverage;
        const returned = Math.max(0, pos.margin + pnl);
        db.prepare('UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?')
          .run(returned, Math.max(0, pnl), pos.user_id);
        db.prepare(`UPDATE futures_positions SET status = ?, close_price = ?, pnl = ?, closed_at = datetime('now') WHERE id = ?`)
          .run(label, livePrice, pnl, pos.id);
        const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        db.prepare(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'trade_close', ?, ?)`)
          .run(pos.user_id, `${tpHit ? 'Take Profit' : 'Stop Loss'} Hit — ${pos.symbol}`, `${pos.direction.toUpperCase()} ${pos.symbol} closed @ $${livePrice.toFixed(2)} | PnL: ${pnlStr}`);
      }
    }
  } catch (e) {
    console.error('Liquidation check error:', e.message);
  }
}

// Run liquidation check every 5 seconds
setInterval(runLiquidationCheck, 5000);

// GET /api/futures/orderbook - simulated depth around live price
router.get('/orderbook', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', levels = 12 } = req.query;
    const price = await getPrice(symbol);
    if (!price) return res.status(503).json({ error: 'Price unavailable' });

    const lvl = Math.min(parseInt(levels) || 12, 20);
    const tickSize = price > 10000 ? 0.1 : price > 1000 ? 0.01 : price > 10 ? 0.001 : 0.0001;
    const spread = price * 0.0002; // 0.02% spread

    // Generate asks (above mid) and bids (below mid)
    const asks = [], bids = [];
    let askTotal = 0, bidTotal = 0;
    for (let i = 0; i < lvl; i++) {
      const askPrice = parseFloat((price + spread / 2 + i * tickSize * (1 + Math.random() * 0.5)).toFixed(tickSize < 0.001 ? 6 : tickSize < 0.01 ? 4 : 2));
      const bidPrice = parseFloat((price - spread / 2 - i * tickSize * (1 + Math.random() * 0.5)).toFixed(tickSize < 0.001 ? 6 : tickSize < 0.01 ? 4 : 2));
      const askSize = parseFloat((Math.random() * 2.5 + 0.1).toFixed(4));
      const bidSize = parseFloat((Math.random() * 2.5 + 0.1).toFixed(4));
      askTotal += askSize; bidTotal += bidSize;
      asks.push({ price: askPrice, size: askSize, total: parseFloat(askTotal.toFixed(4)) });
      bids.push({ price: bidPrice, size: bidSize, total: parseFloat(bidTotal.toFixed(4)) });
    }

    res.json({ symbol, price, asks, bids, timestamp: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/futures/livecandle - latest single candle for live chart append
router.get('/livecandle', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', interval = '15m' } = req.query;
    const candles = await fetchKlines(symbol, interval, 2);
    res.json({ symbol, interval, candle: candles[candles.length - 1] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
