const https = require('https');

// Cached prices { symbol: price }
let priceCache = {};
let lastFetch = 0;
const CACHE_TTL = 3000; // 3 seconds

const SYMBOLS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','AVAXUSDT','MATICUSDT','DOTUSDT','LTCUSDT','LINKUSDT'];

function fetchPrices() {
  return new Promise((resolve) => {
    const url = 'https://api.binance.com/api/v3/ticker/price';
    https.get(url, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const all = JSON.parse(raw);
          const map = {};
          for (const item of all) {
            if (SYMBOLS.includes(item.symbol)) {
              map[item.symbol] = parseFloat(item.price);
            }
          }
          priceCache = map;
          lastFetch = Date.now();
          resolve(map);
        } catch {
          resolve(priceCache);
        }
      });
    }).on('error', () => resolve(priceCache));
  });
}

async function getPrices() {
  if (Date.now() - lastFetch > CACHE_TTL) {
    await fetchPrices();
  }
  return priceCache;
}

async function getPrice(symbol) {
  const prices = await getPrices();
  return prices[symbol] || null;
}

// Pre-warm cache on startup
fetchPrices();
// Refresh every 3 seconds
setInterval(fetchPrices, 3000);

module.exports = { getPrices, getPrice, SYMBOLS };
