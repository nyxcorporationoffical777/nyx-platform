import { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, Zap, AlertTriangle, ChevronDown, RefreshCw, Clock, Target, Shield, BookOpen } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import CandlestickChart from '../components/CandlestickChart';

const PAIRS = [
  // Tier 1
  'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT',
  // Tier 2
  'ADAUSDT','DOGEUSDT','AVAXUSDT','LTCUSDT','DOTUSDT','LINKUSDT','UNIUSDT','ATOMUSDT','ETCUSDT','XLMUSDT',
  // Tier 3
  'TRXUSDT','FILUSDT','AAVEUSDT','NEARUSDT','APTUSDT','ARBUSDT','OPUSDT','INJUSDT','SUIUSDT',
  'SEIUSDT','TIAUSDT','WIFUSDT','BONKUSDT','PEPEUSDT',
  // Tier 4
  'MATICUSDT','FTMUSDT','ALGOUSDT','ICPUSDT','SANDUSDT','MANAUSDT','AXSUSDT',
  'GALAUSDT','APEUSDT','GMTUSDT','LDOUSDT','STXUSDT','RUNEUSDT','CFXUSDT',
];
const PAIR_LABELS: Record<string, string> = {
  BTCUSDT:'BTC/USDT',  ETHUSDT:'ETH/USDT',   BNBUSDT:'BNB/USDT',   SOLUSDT:'SOL/USDT',
  XRPUSDT:'XRP/USDT',  ADAUSDT:'ADA/USDT',   DOGEUSDT:'DOGE/USDT', AVAXUSDT:'AVAX/USDT',
  LTCUSDT:'LTC/USDT',  DOTUSDT:'DOT/USDT',   LINKUSDT:'LINK/USDT', UNIUSDT:'UNI/USDT',
  ATOMUSDT:'ATOM/USDT',ETCUSDT:'ETC/USDT',   XLMUSDT:'XLM/USDT',   TRXUSDT:'TRX/USDT',
  FILUSDT:'FIL/USDT',  AAVEUSDT:'AAVE/USDT', NEARUSDT:'NEAR/USDT', APTUSDT:'APT/USDT',
  ARBUSDT:'ARB/USDT',  OPUSDT:'OP/USDT',     INJUSDT:'INJ/USDT',   SUIUSDT:'SUI/USDT',
  SEIUSDT:'SEI/USDT',  TIAUSDT:'TIA/USDT',   WIFUSDT:'WIF/USDT',   BONKUSDT:'BONK/USDT',
  PEPEUSDT:'PEPE/USDT',MATICUSDT:'MATIC/USDT',FTMUSDT:'FTM/USDT',  ALGOUSDT:'ALGO/USDT',
  ICPUSDT:'ICP/USDT',  SANDUSDT:'SAND/USDT', MANAUSDT:'MANA/USDT', AXSUSDT:'AXS/USDT',
  GALAUSDT:'GALA/USDT',APEUSDT:'APE/USDT',   GMTUSDT:'GMT/USDT',   LDOUSDT:'LDO/USDT',
  STXUSDT:'STX/USDT',  RUNEUSDT:'RUNE/USDT', CFXUSDT:'CFX/USDT',
};
const MAX_LEV: Record<string, number> = {
  BTCUSDT:125, ETHUSDT:100, BNBUSDT:75,  SOLUSDT:75,  XRPUSDT:75,
  ADAUSDT:50,  DOGEUSDT:50, AVAXUSDT:50, LTCUSDT:75,  DOTUSDT:50,
  LINKUSDT:50, UNIUSDT:50,  ATOMUSDT:50, ETCUSDT:50,  XLMUSDT:50,
  TRXUSDT:50,  FILUSDT:25,  AAVEUSDT:25, NEARUSDT:50, APTUSDT:50,
  ARBUSDT:50,  OPUSDT:50,   INJUSDT:50,  SUIUSDT:50,  SEIUSDT:25,
  TIAUSDT:25,  WIFUSDT:25,  BONKUSDT:20, PEPEUSDT:20, MATICUSDT:50,
  FTMUSDT:25,  ALGOUSDT:25, ICPUSDT:25,  SANDUSDT:25, MANAUSDT:25,
  AXSUSDT:25,  GALAUSDT:20, APEUSDT:20,  GMTUSDT:20,  LDOUSDT:25,
  STXUSDT:25,  RUNEUSDT:25, CFXUSDT:20,
};
const QUICK_LEV = [2,5,10,20,50,100];
const INTERVALS = ['1m','5m','15m','1h','4h','1d'];
const PAIR_COLORS: Record<string, string> = {
  BTCUSDT:'#f7931a',  ETHUSDT:'#627eea',  BNBUSDT:'#f59e0b',  SOLUSDT:'#9945ff',
  XRPUSDT:'#00aae4',  ADAUSDT:'#0033ad',  DOGEUSDT:'#c3a634', AVAXUSDT:'#e84142',
  LTCUSDT:'#bfbbbb',  DOTUSDT:'#e6007a',  LINKUSDT:'#2a5ada', UNIUSDT:'#ff007a',
  ATOMUSDT:'#2e3148', ETCUSDT:'#3ab83a',  XLMUSDT:'#14b6e7',  TRXUSDT:'#ef0027',
  FILUSDT:'#0090ff',  AAVEUSDT:'#b6509e', NEARUSDT:'#00c08b', APTUSDT:'#2bcfcf',
  ARBUSDT:'#12aaff',  OPUSDT:'#ff0420',   INJUSDT:'#00b4d8',  SUIUSDT:'#4da2ff',
  SEIUSDT:'#9d4edd',  TIAUSDT:'#7b2d8b',  WIFUSDT:'#9b59b6',  BONKUSDT:'#f39c12',
  PEPEUSDT:'#2ecc71', MATICUSDT:'#8247e5',FTMUSDT:'#13b5ec',  ALGOUSDT:'#000000',
  ICPUSDT:'#f15a24',  SANDUSDT:'#04b4ff', MANAUSDT:'#ff2d55',  AXSUSDT:'#0055d5',
  GALAUSDT:'#006fff', APEUSDT:'#0058fa',  GMTUSDT:'#c8a84b',  LDOUSDT:'#00a3ff',
  STXUSDT:'#5546ff',  RUNEUSDT:'#33ff99', CFXUSDT:'#15c5ce',
};

interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }
interface Ticker { symbol: string; price: number; change: number; high: number; low: number; volume: number; }


interface OBLevel { price: number; size: number; total: number; }
interface OrderBook { asks: OBLevel[]; bids: OBLevel[]; price: number; }

interface Position {
  id: number; symbol: string; direction: string; leverage: number;
  entry_price: number; size: number; margin: number;
  take_profit: number|null; stop_loss: number|null;
  liquidation_price: number; live_price: number; unrealized_pnl: number;
  opened_at: string;
}
interface HistoryPos {
  id: number; symbol: string; direction: string; leverage: number;
  entry_price: number; close_price: number; margin: number; pnl: number;
  status: string; closed_at: string;
}

export default function Trade() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [direction, setDirection] = useState<'long'|'short'>('long');
  const [leverage, setLeverage] = useState(10);
  const [margin, setMargin] = useState('');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<HistoryPos[]>([]);
  const [tab, setTab] = useState<'positions'|'history'>('positions');
  const [loading, setLoading] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  const [chartInterval, setChartInterval] = useState('15m');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [showOrderBook, setShowOrderBook] = useState(true);
  const pairRef = useRef<HTMLDivElement>(null);
  const candlesRef = useRef<Candle[]>([]);

  const fetchPrices = useCallback(async () => {
    try {
      const { data } = await api.get('/futures/prices');
      setPrices(prev => { setPrevPrice(prev[selectedPair] || 0); return data.prices; });
    } catch {}
  }, [selectedPair]);

  const fetchTickers = useCallback(async () => {
    try {
      const { data } = await api.get('/futures/ticker');
      const map: Record<string, Ticker> = {};
      for (const t of data.tickers) map[t.symbol] = t;
      setTickers(map);
    } catch {}
  }, []);

  const fetchChart = useCallback(async (pair: string, interval: string) => {
    setChartLoading(true);
    try {
      const { data } = await api.get(`/futures/chart?symbol=${pair}&interval=${interval}&limit=120`);
      const c = data.candles || [];
      setCandles(c);
      candlesRef.current = c;
    } catch {}
    finally { setChartLoading(false); }
  }, []);

  const fetchLiveCandle = useCallback(async () => {
    try {
      const { data } = await api.get(`/futures/livecandle?symbol=${selectedPair}&interval=${chartInterval}`);
      if (!data.candle) return;
      const nc: Candle = data.candle;
      setCandles(prev => {
        const arr = [...prev];
        if (arr.length === 0) return [nc];
        const last = arr[arr.length - 1];
        // Same candle period — update in place; otherwise append
        if (last.time === nc.time) {
          arr[arr.length - 1] = { ...nc };
        } else {
          arr.push(nc);
          if (arr.length > 130) arr.shift();
        }
        candlesRef.current = arr;
        return arr;
      });
    } catch {}
  }, [selectedPair, chartInterval]);

  const fetchOrderBook = useCallback(async () => {
    try {
      const { data } = await api.get(`/futures/orderbook?symbol=${selectedPair}&levels=14`);
      setOrderBook(data);
    } catch {}
  }, [selectedPair]);

  const fetchPositions = useCallback(async () => {
    try {
      const { data } = await api.get('/futures/positions');
      setPositions(data.positions);
    } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/futures/history');
      setHistory(data.history);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPrices();
    fetchPositions();
    fetchHistory();
    fetchTickers();
    fetchOrderBook();
    const t1 = setInterval(fetchPrices, 3000);
    const t2 = setInterval(fetchPositions, 6000);
    const t3 = setInterval(fetchTickers, 20000);
    const t4 = setInterval(fetchLiveCandle, 5000);
    const t5 = setInterval(fetchOrderBook, 2000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); clearInterval(t4); clearInterval(t5); };
  }, [fetchPrices, fetchPositions, fetchTickers, fetchLiveCandle, fetchOrderBook]);

  useEffect(() => {
    fetchChart(selectedPair, chartInterval);
  }, [selectedPair, chartInterval, fetchChart]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pairRef.current && !pairRef.current.contains(e.target as Node)) setPairOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const livePrice = prices[selectedPair] || 0;
  const marginNum = parseFloat(margin) || 0;
  const posSize = marginNum * leverage;
  const estLiq = livePrice && marginNum
    ? direction === 'long'
      ? livePrice * (1 - 1 / leverage + 0.004)
      : livePrice * (1 + 1 / leverage - 0.004)
    : 0;

  const handleOpen = async () => {
    if (!marginNum || marginNum < 1) { toast('warning', 'Minimum margin is $1'); return; }
    if (marginNum > (user?.balance ?? 0)) { toast('error', 'Insufficient balance'); return; }
    setLoading(true);
    try {
      await api.post('/futures/open', {
        symbol: selectedPair, direction, leverage, margin: marginNum,
        take_profit: tp ? parseFloat(tp) : undefined,
        stop_loss: sl ? parseFloat(sl) : undefined,
      });
      toast('success', `${direction.toUpperCase()} ${PAIR_LABELS[selectedPair]} Opened`, `Entry @ $${livePrice.toFixed(2)} | ${leverage}× leverage`);
      setMargin(''); setTp(''); setSl('');
      await fetchPositions(); await refreshUser();
    } catch (e: any) {
      toast('error', e.response?.data?.error || 'Failed to open position');
    } finally { setLoading(false); }
  };

  const handleClose = async (id: number) => {
    try {
      const { data } = await api.post(`/futures/close/${id}`);
      const pnl = data.pnl;
      toast(pnl >= 0 ? 'success' : 'error', `Position Closed | PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
      await fetchPositions(); await fetchHistory(); await refreshUser();
    } catch (e: any) {
      toast('error', e.response?.data?.error || 'Failed to close position');
    }
  };

  const setMarginPct = (pct: number) => {
    const bal = user?.balance ?? 0;
    if (bal <= 0) { toast('warning', 'No balance available'); return; }
    setMargin(((bal * pct) / 100).toFixed(2));
  };

  const totalUnrealizedPnl = positions.reduce((s, p) => s + p.unrealized_pnl, 0);

  const ticker = tickers[selectedPair];
  const priceDir = prevPrice ? (livePrice > prevPrice ? 'up' : livePrice < prevPrice ? 'down' : 'same') : 'same';
  const chartColor = PAIR_COLORS[selectedPair] || '#6366f1';
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;

  return (
    <div className="p-4 space-y-3 fade-in">

      {/* ── Pair ticker strip ── */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          {PAIRS.map(p => {
            const t = tickers[p];
            const isUp = t ? t.change >= 0 : true;
            return (
              <button key={p} onClick={() => setSelectedPair(p)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-shrink-0"
                style={selectedPair === p
                  ? { background: 'var(--bg3)', border: `1px solid ${PAIR_COLORS[p] || 'var(--border2)'}40` }
                  : { background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{ background: `${PAIR_COLORS[p] || '#6366f1'}22`, color: PAIR_COLORS[p] || 'var(--brand-1)' }}>
                  {PAIR_LABELS[p].charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-white leading-none">{PAIR_LABELS[p].split('/')[0]}</p>
                  <p className="text-[9px] font-semibold mono leading-none mt-0.5"
                    style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
                    {t ? `${isUp ? '+' : ''}${t.change.toFixed(2)}%` : '—'}
                  </p>
                </div>
                <p className="text-[11px] font-bold mono text-white ml-1">
                  ${prices[p]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '—'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">

        {/* ── LEFT: Order Panel ── */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className="ex-card p-4 space-y-3">

            {/* Pair selector */}
            <div className="relative" ref={pairRef}>
              <button onClick={() => setPairOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: `${PAIR_COLORS[selectedPair] || '#6366f1'}22`, color: PAIR_COLORS[selectedPair] || 'var(--brand-1)' }}>
                    {PAIR_LABELS[selectedPair].charAt(0)}
                  </div>
                  <span className="font-bold text-white text-sm">{PAIR_LABELS[selectedPair]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold mono text-sm transition-colors"
                    style={{ color: priceDir === 'up' ? 'var(--green)' : priceDir === 'down' ? 'var(--red)' : 'var(--text)' }}>
                    ${livePrice ? livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                  </span>
                  <ChevronDown size={12} style={{ color: 'var(--text3)' }} />
                </div>
              </button>
              {pairOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-30 shadow-2xl"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', maxHeight: 280, overflowY: 'auto' }}>
                  {PAIRS.map(p => (
                    <button key={p} onClick={() => { setSelectedPair(p); setPairOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 transition-colors text-left"
                      style={{ borderBottom: '1px solid var(--border)', background: p === selectedPair ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                      onMouseEnter={e => { if (p !== selectedPair) (e.currentTarget.style.background = 'rgba(255,255,255,0.03)'); }}
                      onMouseLeave={e => { if (p !== selectedPair) (e.currentTarget.style.background = 'transparent'); }}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                          style={{ background: `${PAIR_COLORS[p]}22`, color: PAIR_COLORS[p] }}>
                          {PAIR_LABELS[p].charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-white">{PAIR_LABELS[p]}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs mono text-white">${prices[p]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '—'}</p>
                        {tickers[p] && (
                          <p className="text-[10px] font-semibold" style={{ color: tickers[p].change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {tickers[p].change >= 0 ? '+' : ''}{tickers[p].change.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Balance display */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text3)' }}>Available</span>
              <span className="text-xs font-bold mono text-white">${(user?.balance ?? 0).toFixed(2)} USDT</span>
            </div>

            {/* Long / Short */}
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => setDirection('long')}
                className="py-2.5 rounded-xl text-sm font-black transition-all"
                style={direction === 'long'
                  ? { background: 'var(--green)', color: '#fff' }
                  : { background: 'rgba(16,185,129,0.08)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <TrendingUp size={13} className="inline mr-1" />Long
              </button>
              <button onClick={() => setDirection('short')}
                className="py-2.5 rounded-xl text-sm font-black transition-all"
                style={direction === 'short'
                  ? { background: 'var(--red)', color: '#fff' }
                  : { background: 'rgba(244,63,94,0.08)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <TrendingDown size={13} className="inline mr-1" />Short
              </button>
            </div>

            {/* Leverage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>Leverage</span>
                <span className="text-sm font-black mono" style={{ color: 'var(--yellow)' }}>{leverage}×</span>
              </div>
              <input type="range" min={1} max={MAX_LEV[selectedPair]} value={leverage}
                onChange={e => setLeverage(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--yellow)', background: 'var(--bg4)' }} />
              <div className="flex gap-1 mt-2 flex-wrap">
                {QUICK_LEV.filter(l => l <= MAX_LEV[selectedPair]).map(l => (
                  <button key={l} onClick={() => setLeverage(l)}
                    className="flex-1 py-1 rounded text-xs font-bold transition-all"
                    style={leverage === l
                      ? { background: 'var(--yellow)', color: '#000' }
                      : { background: 'var(--bg4)', color: 'var(--text2)' }}>
                    {l}×
                  </button>
                ))}
              </div>
            </div>

            {/* Margin input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>Margin (USDT)</label>
              </div>
              <div className="relative">
                <input type="number" value={margin} onChange={e => setMargin(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-bold mono text-white outline-none"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                  onFocus={e => (e.target.style.borderColor = direction === 'long' ? 'var(--green)' : 'var(--red)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold"
                  style={{ color: 'var(--text3)' }}>USDT</span>
              </div>
              <div className="flex gap-1 mt-1.5">
                {[25, 50, 75, 100].map(pct => (
                  <button key={pct} onClick={() => setMarginPct(pct)}
                    className="flex-1 py-1 rounded text-xs font-bold transition-all"
                    style={{ background: 'var(--bg4)', color: 'var(--text2)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}>
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* TP / SL */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--green)' }}>
                  <Target size={9} />TP
                </label>
                <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder="Optional"
                  className="w-full px-2 py-2 rounded-lg text-xs mono text-white outline-none"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--green)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label className="text-[10px] font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--red)' }}>
                  <Shield size={9} />SL
                </label>
                <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="Optional"
                  className="w-full px-2 py-2 rounded-lg text-xs mono text-white outline-none"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--red)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>

            {/* Order summary */}
            {marginNum > 0 && (
              <div className="rounded-xl p-3 space-y-1.5 text-xs"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                {[
                  { l: 'Position Size', v: `$${posSize.toFixed(2)}`, c: 'var(--text)' },
                  { l: 'Entry Price',   v: `$${livePrice.toFixed(2)}`, c: 'var(--text)' },
                  { l: 'Liq. Price',    v: `$${estLiq.toFixed(2)}`,   c: 'var(--red)' },
                  { l: 'Margin',        v: `$${marginNum.toFixed(2)}`, c: direction === 'long' ? 'var(--green)' : 'var(--red)' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between">
                    <span style={{ color: 'var(--text3)' }}>{r.l}</span>
                    <span className="font-bold mono" style={{ color: r.c }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Open button */}
            <button onClick={handleOpen} disabled={loading || !marginNum}
              className="w-full py-3.5 rounded-xl text-sm font-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: direction === 'long' ? 'var(--green)' : 'var(--red)',
                color: '#fff',
              }}>
              {loading
                ? <RefreshCw size={14} className="animate-spin" />
                : direction === 'long'
                  ? <TrendingUp size={14} />
                  : <TrendingDown size={14} />}
              {loading ? 'Opening…' : `Open ${direction.toUpperCase()}`}
            </button>

            <div className="flex items-start gap-1.5">
              <AlertTriangle size={10} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: 'var(--text3)', fontSize: 9, lineHeight: 1.5 }}>
                Futures trading involves substantial risk. You can lose your entire margin.
              </p>
            </div>
          </div>
        </div>

        {/* ── CENTER+RIGHT: Chart + Data ── */}
        <div className="col-span-12 lg:col-span-9 space-y-3">

          {/* ── Chart + Order Book row ── */}
          <div className="flex gap-3">

            {/* Chart panel */}
            <div className="flex-1 ex-card overflow-hidden min-w-0">
              {/* Chart header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: `${chartColor}22`, color: chartColor }}>
                    {PAIR_LABELS[selectedPair].charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{PAIR_LABELS[selectedPair]}</span>
                      {ticker && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: ticker.change >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                            color: ticker.change >= 0 ? 'var(--green)' : 'var(--red)',
                          }}>
                          {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
                        </span>
                      )}
                      <span className="font-black mono text-base transition-colors"
                        style={{ color: priceDir === 'up' ? 'var(--green)' : priceDir === 'down' ? 'var(--red)' : 'var(--text)' }}>
                        ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {ticker && (
                      <div className="flex gap-3 text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                        <span>H: <span style={{ color: 'var(--green)' }}>${ticker.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>L: <span style={{ color: 'var(--red)' }}>${ticker.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                        <span>Vol: <span className="text-white">${(ticker.volume / 1e6).toFixed(1)}M</span></span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {INTERVALS.map(iv => (
                    <button key={iv} onClick={() => setChartInterval(iv)}
                      className="px-2 py-1 rounded text-xs font-semibold transition-all"
                      style={chartInterval === iv
                        ? { background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border2)' }
                        : { color: 'var(--text3)', background: 'transparent' }}>
                      {iv}
                    </button>
                  ))}
                  <button onClick={() => setShowOrderBook(s => !s)}
                    className="p-1.5 rounded-lg transition-colors ml-1"
                    title="Toggle order book"
                    style={{ color: showOrderBook ? 'var(--brand-1)' : 'var(--text3)', background: showOrderBook ? 'rgba(99,102,241,0.1)' : 'transparent' }}>
                    <BookOpen size={12} />
                  </button>
                  <button onClick={() => fetchChart(selectedPair, chartInterval)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                    <RefreshCw size={12} className={chartLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Candlestick Chart */}
              <div style={{ position: 'relative', background: 'var(--bg)' }}>
                {chartLoading && candles.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-10"
                    style={{ height: 340, background: 'rgba(10,10,15,0.8)' }}>
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text3)' }} />
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>Loading candles…</p>
                    </div>
                  </div>
                )}
                <CandlestickChart
                  candles={candles}
                  height={340}
                  livePrice={livePrice}
                  pairColor={chartColor}
                  entryLines={positions
                    .filter(p => p.symbol === selectedPair)
                    .map(pos => ({
                      price: pos.entry_price,
                      color: pos.direction === 'long' ? '#10b981' : '#f43f5e',
                      label: `${pos.direction === 'long' ? '▲' : '▼'} Entry $${pos.entry_price.toFixed(2)}`,
                    }))}
                  liqLines={positions
                    .filter(p => p.symbol === selectedPair)
                    .map(pos => ({
                      price: pos.liquidation_price,
                      label: `Liq $${pos.liquidation_price.toFixed(2)}`,
                    }))}
                />
                {/* Candle OHLC overlay — last candle info */}
                {lastCandle && (
                  <div className="absolute top-2 left-3 flex items-center gap-3 text-[10px] mono pointer-events-none">
                    <span className="font-bold" style={{ color: lastCandle.close >= lastCandle.open ? 'var(--green)' : 'var(--red)' }}>
                      {lastCandle.close >= lastCandle.open ? '▲' : '▼'} ${lastCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ color: 'var(--text3)' }}>O <span className="text-white">${lastCandle.open.toFixed(2)}</span></span>
                    <span style={{ color: 'var(--text3)' }}>H <span style={{ color: 'var(--green)' }}>${lastCandle.high.toFixed(2)}</span></span>
                    <span style={{ color: 'var(--text3)' }}>L <span style={{ color: 'var(--red)' }}>${lastCandle.low.toFixed(2)}</span></span>
                    <span style={{ color: 'var(--text3)' }}>C <span className="text-white">${lastCandle.close.toFixed(2)}</span></span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Book panel */}
            {showOrderBook && (
              <div className="w-44 flex-shrink-0 ex-card overflow-hidden flex flex-col">
                <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <BookOpen size={11} style={{ color: 'var(--text3)' }} />
                  <span className="text-[11px] font-semibold text-white">Order Book</span>
                  <span className="w-1.5 h-1.5 rounded-full blink ml-auto" style={{ background: 'var(--green)', display: 'inline-block' }} />
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-2 px-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-[9px] font-bold" style={{ color: 'var(--text3)' }}>PRICE</span>
                  <span className="text-[9px] font-bold text-right" style={{ color: 'var(--text3)' }}>SIZE</span>
                </div>

                {/* Asks (reversed — lowest ask at bottom near spread) */}
                <div className="flex-1 overflow-hidden">
                  {orderBook ? (
                    <>
                      {/* Asks */}
                      <div className="flex flex-col-reverse">
                        {orderBook.asks.slice(0, 10).map((a, i) => {
                          const maxTotal = orderBook.asks[orderBook.asks.length - 1]?.total || 1;
                          const pct = (a.total / maxTotal) * 100;
                          return (
                            <div key={i} className="relative grid grid-cols-2 px-2 py-[3px] text-[10px]">
                              <div className="absolute inset-y-0 right-0 opacity-10 rounded-sm"
                                style={{ width: `${pct}%`, background: 'var(--red)' }} />
                              <span className="font-mono font-semibold z-10" style={{ color: 'var(--red)' }}>
                                {a.price >= 1000 ? a.price.toFixed(1) : a.price.toFixed(4)}
                              </span>
                              <span className="font-mono text-right z-10" style={{ color: 'var(--text2)' }}>{a.size.toFixed(3)}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mid price */}
                      <div className="px-2 py-1.5 flex items-center justify-center"
                        style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                        <span className="text-xs font-black mono"
                          style={{ color: priceDir === 'up' ? 'var(--green)' : priceDir === 'down' ? 'var(--red)' : 'var(--text)' }}>
                          {livePrice >= 1000 ? livePrice.toFixed(2) : livePrice.toFixed(4)}
                        </span>
                        {priceDir === 'up' ? <TrendingUp size={9} className="ml-1" style={{ color: 'var(--green)' }} /> : priceDir === 'down' ? <TrendingDown size={9} className="ml-1" style={{ color: 'var(--red)' }} /> : null}
                      </div>

                      {/* Bids */}
                      <div>
                        {orderBook.bids.slice(0, 10).map((b, i) => {
                          const maxTotal = orderBook.bids[orderBook.bids.length - 1]?.total || 1;
                          const pct = (b.total / maxTotal) * 100;
                          return (
                            <div key={i} className="relative grid grid-cols-2 px-2 py-[3px] text-[10px]">
                              <div className="absolute inset-y-0 left-0 opacity-10 rounded-sm"
                                style={{ width: `${pct}%`, background: 'var(--green)' }} />
                              <span className="font-mono font-semibold z-10" style={{ color: 'var(--green)' }}>
                                {b.price >= 1000 ? b.price.toFixed(1) : b.price.toFixed(4)}
                              </span>
                              <span className="font-mono text-right z-10" style={{ color: 'var(--text2)' }}>{b.size.toFixed(3)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-20">
                      <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--text3)' }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Positions & History ── */}
          <div className="ex-card overflow-hidden">

            {/* Header row with PnL summary */}
            <div className="flex items-center justify-between px-4"
              style={{ borderBottom: '1px solid var(--border)', height: 44 }}>
              <div className="flex h-full">
                {(['positions', 'history'] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); if (t === 'history') fetchHistory(); }}
                    className="px-4 h-full text-xs font-semibold transition-all relative"
                    style={tab === t ? { color: 'var(--text)' } : { color: 'var(--text3)' }}>
                    {t === 'positions' ? `Open Positions` : 'Trade History'}
                    {tab === t && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                        style={{ background: 'var(--brand-1)' }} />
                    )}
                    {t === 'positions' && positions.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                        style={{ background: 'var(--brand-1)', color: '#fff' }}>
                        {positions.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* PnL summary chips */}
              {positions.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text3)' }}>Unrealized PnL</span>
                    <span className="text-xs font-black mono"
                      style={{ color: totalUnrealizedPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text3)' }}>ROI</span>
                    <span className="text-xs font-black mono"
                      style={{ color: totalUnrealizedPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {positions.reduce((s, p) => s + p.margin, 0) > 0
                        ? `${totalUnrealizedPnl >= 0 ? '+' : ''}${((totalUnrealizedPnl / positions.reduce((s, p) => s + p.margin, 0)) * 100).toFixed(2)}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* POSITIONS tab */}
            {tab === 'positions' && (
              positions.length === 0 ? (
                <div className="py-14 text-center">
                  <Zap size={28} className="mx-auto mb-3" style={{ color: 'var(--text3)', opacity: 0.2 }} />
                  <p className="text-sm font-bold text-white">No open positions</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Use the order panel to open a Long or Short</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ minWidth: 700 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                        {['Contract','Side / Lev.','Entry Price','Mark Price','Margin','Liq. Price','Unreal. PnL','ROI','Action'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(pos => {
                        const roi = pos.margin > 0 ? (pos.unrealized_pnl / pos.margin) * 100 : 0;
                        const markDiff = pos.live_price && pos.entry_price
                          ? ((pos.live_price - pos.entry_price) / pos.entry_price) * 100
                          : 0;
                        return (
                          <tr key={pos.id} style={{ borderBottom: '1px solid var(--border)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                            {/* Contract */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                                  style={{ background: `${PAIR_COLORS[pos.symbol] || '#6366f1'}20`, color: PAIR_COLORS[pos.symbol] || 'var(--brand-1)' }}>
                                  {PAIR_LABELS[pos.symbol]?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">{PAIR_LABELS[pos.symbol]}</p>
                                  <p className="text-[9px]" style={{ color: 'var(--text3)' }}>Perpetual</p>
                                </div>
                              </div>
                            </td>

                            {/* Side + Leverage */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black"
                                  style={pos.direction === 'long'
                                    ? { background: 'rgba(16,185,129,0.12)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.2)' }
                                    : { background: 'rgba(244,63,94,0.1)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.2)' }}>
                                  {pos.direction === 'long' ? '▲ Long' : '▼ Short'}
                                </span>
                                <span className="text-[10px] font-black mono px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--yellow)' }}>
                                  {pos.leverage}×
                                </span>
                              </div>
                            </td>

                            {/* Entry */}
                            <td className="px-3 py-3">
                              <p className="text-xs mono font-semibold text-white">${pos.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </td>

                            {/* Mark (live) price */}
                            <td className="px-3 py-3">
                              <p className="text-xs mono font-bold text-white">${(pos.live_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              <p className="text-[9px] mono mt-0.5" style={{ color: markDiff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                {markDiff >= 0 ? '+' : ''}{markDiff.toFixed(3)}%
                              </p>
                            </td>

                            {/* Margin */}
                            <td className="px-3 py-3">
                              <p className="text-xs mono text-white">${pos.margin.toFixed(2)}</p>
                              <p className="text-[9px]" style={{ color: 'var(--text3)' }}>Size: ${(pos.margin * pos.leverage).toFixed(2)}</p>
                            </td>

                            {/* Liq price */}
                            <td className="px-3 py-3">
                              <p className="text-xs mono font-semibold" style={{ color: 'var(--red)' }}>
                                ${pos.liquidation_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </td>

                            {/* Unrealized PnL */}
                            <td className="px-3 py-3">
                              <p className="text-xs mono font-black"
                                style={{ color: pos.unrealized_pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                {pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl.toFixed(2)}
                              </p>
                            </td>

                            {/* ROI */}
                            <td className="px-3 py-3">
                              <p className="text-xs mono font-black"
                                style={{ color: roi >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                              </p>
                            </td>

                            {/* Close button */}
                            <td className="px-3 py-3">
                              <button onClick={() => handleClose(pos.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{ background: 'rgba(244,63,94,0.08)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.18)' }}
                                onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(244,63,94,0.2)'); (e.currentTarget.style.borderColor = 'rgba(244,63,94,0.4)'); }}
                                onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(244,63,94,0.08)'); (e.currentTarget.style.borderColor = 'rgba(244,63,94,0.18)'); }}>
                                Close
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* HISTORY tab */}
            {tab === 'history' && (
              history.length === 0 ? (
                <div className="py-14 text-center">
                  <Clock size={28} className="mx-auto mb-3" style={{ color: 'var(--text3)', opacity: 0.2 }} />
                  <p className="text-sm font-bold text-white">No trade history</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Closed positions will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ minWidth: 680 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                        {['Contract','Side / Lev.','Entry','Close','Margin','Realized PnL','ROI','Status','Date'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(pos => {
                        const roi = pos.margin > 0 ? (pos.pnl / pos.margin) * 100 : 0;
                        return (
                          <tr key={pos.id} style={{ borderBottom: '1px solid var(--border)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                                  style={{ background: `${PAIR_COLORS[pos.symbol] || '#6366f1'}20`, color: PAIR_COLORS[pos.symbol] || 'var(--brand-1)' }}>
                                  {PAIR_LABELS[pos.symbol]?.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-white">{PAIR_LABELS[pos.symbol] || pos.symbol}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black"
                                  style={pos.direction === 'long'
                                    ? { background: 'rgba(16,185,129,0.1)', color: 'var(--green)' }
                                    : { background: 'rgba(244,63,94,0.1)', color: 'var(--red)' }}>
                                  {pos.direction === 'long' ? '▲ Long' : '▼ Short'}
                                </span>
                                <span className="text-[10px] font-bold mono" style={{ color: 'var(--yellow)' }}>{pos.leverage}×</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs mono text-white">${pos.entry_price?.toFixed(2)}</td>
                            <td className="px-3 py-3 text-xs mono text-white">${pos.close_price?.toFixed(2)}</td>
                            <td className="px-3 py-3 text-xs mono text-white">${pos.margin?.toFixed(2)}</td>
                            <td className="px-3 py-3">
                              <span className="text-xs mono font-black"
                                style={{ color: pos.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                {pos.pnl >= 0 ? '+' : ''}${pos.pnl?.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs mono font-black"
                                style={{ color: roi >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize"
                                style={{
                                  background: pos.status === 'liquidated' ? 'rgba(244,63,94,0.12)' : pos.status === 'tp_hit' || pos.status === 'sl_hit' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
                                  color: pos.status === 'liquidated' ? 'var(--red)' : pos.status === 'tp_hit' ? 'var(--green)' : pos.status === 'sl_hit' ? 'var(--red)' : 'var(--text3)',
                                }}>
                                {pos.status === 'tp_hit' ? 'TP Hit' : pos.status === 'sl_hit' ? 'SL Hit' : pos.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-[10px] mono" style={{ color: 'var(--text3)' }}>
                              {new Date(pos.closed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
