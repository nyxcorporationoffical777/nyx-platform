import { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Search } from 'lucide-react';
import api from '../api/axios';

const COINS = [
  { sym: 'BTCUSDT',  label: 'BTC',  name: 'Bitcoin',    color: '#f7931a' },
  { sym: 'ETHUSDT',  label: 'ETH',  name: 'Ethereum',   color: '#627eea' },
  { sym: 'BNBUSDT',  label: 'BNB',  name: 'BNB',        color: '#f59e0b' },
  { sym: 'SOLUSDT',  label: 'SOL',  name: 'Solana',     color: '#9945ff' },
  { sym: 'XRPUSDT',  label: 'XRP',  name: 'Ripple',     color: '#00aae4' },
  { sym: 'ADAUSDT',  label: 'ADA',  name: 'Cardano',    color: '#0033ad' },
  { sym: 'DOGEUSDT', label: 'DOGE', name: 'Dogecoin',   color: '#c3a634' },
  { sym: 'AVAXUSDT', label: 'AVAX', name: 'Avalanche',  color: '#e84142' },
  { sym: 'MATICUSDT',label: 'MATIC',name: 'Polygon',    color: '#8247e5' },
  { sym: 'LTCUSDT',  label: 'LTC',  name: 'Litecoin',   color: '#bfbbbb' },
];

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m',value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

interface Ticker {
  symbol: string; price: number; change: number;
  high: number; low: number; volume: number;
}
interface Candle {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Candle & { timeLabel: string };
  const isUp = d.close >= d.open;
  return (
    <div className="px-3 py-2 rounded-xl text-xs space-y-1"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="font-bold" style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
        ${d.close?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
      <div className="grid grid-cols-2 gap-x-4 text-[10px]" style={{ color: 'var(--text3)' }}>
        <span>O: <span className="text-white">${d.open?.toFixed(2)}</span></span>
        <span>H: <span style={{ color: 'var(--green)' }}>${d.high?.toFixed(2)}</span></span>
        <span>C: <span className="text-white">${d.close?.toFixed(2)}</span></span>
        <span>L: <span style={{ color: 'var(--red)' }}>${d.low?.toFixed(2)}</span></span>
      </div>
      <p style={{ color: 'var(--text3)', fontSize: 9 }}>{d.timeLabel}</p>
    </div>
  );
};

export default function Markets() {
  const [selected, setSelected] = useState(COINS[0]);
  const [interval, setInterval2] = useState('1h');
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [tickerLoading, setTickerLoading] = useState(true);
  const [search, setSearch] = useState('');
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTickers = useCallback(async () => {
    try {
      const { data } = await api.get('/futures/ticker');
      const map: Record<string, Ticker> = {};
      for (const t of data.tickers) map[t.symbol] = t;
      setTickers(map);
      setTickerLoading(false);
    } catch {}
  }, []);

  const fetchChart = useCallback(async (sym: string, iv: string) => {
    setChartLoading(true);
    try {
      const { data } = await api.get(`/futures/chart?symbol=${sym}&interval=${iv}&limit=120`);
      setCandles(data.candles || []);
    } catch {}
    finally { setChartLoading(false); }
  }, []);

  useEffect(() => {
    fetchTickers();
    tickerRef.current = setInterval(fetchTickers, 10000);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [fetchTickers]);

  useEffect(() => {
    fetchChart(selected.sym, interval);
  }, [selected, interval, fetchChart]);

  const ticker = tickers[selected.sym];
  const livePrice = ticker?.price ?? 0;
  const change = ticker?.change ?? 0;
  const isUp = change >= 0;

  const chartData = candles.map(c => ({
    ...c,
    timeLabel: new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));
  const chartMin = candles.length ? Math.min(...candles.map(c => c.low)) * 0.9995 : 0;
  const chartMax = candles.length ? Math.max(...candles.map(c => c.high)) * 1.0005 : 0;
  const chartIsUp = candles.length > 1 && candles[candles.length - 1].close >= candles[0].close;
  const strokeColor = chartIsUp ? 'var(--green)' : 'var(--red)';

  const filtered = COINS.filter(c =>
    search === '' ||
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-w-0 w-full p-5 space-y-4 fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1">Analytics</p>
          <h1 className="font-bold text-white" style={{ fontSize: 20, letterSpacing: '-0.025em' }}>Markets</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Real-time prices from Binance · {COINS.length} pairs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full blink flex-shrink-0" style={{ background: 'var(--green)', display: 'block' }} />
          <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 600 }}>Live</span>
          <button onClick={fetchTickers}
            className="p-1.5 rounded-lg ml-1 transition-colors"
            style={{ color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* ── Top movers strip ── */}
      {!tickerLoading && (
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max">
            {COINS.map(c => {
              const t = tickers[c.sym];
              const up = (t?.change ?? 0) >= 0;
              return (
                <button key={c.sym} onClick={() => setSelected(c)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-shrink-0"
                  style={selected.sym === c.sym
                    ? { background: `${c.color}15`, border: `1px solid ${c.color}40` }
                    : { background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: `${c.color}20`, color: c.color }}>
                    {c.label[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-white leading-none">{c.label}</p>
                    <p className="text-[9px] leading-none mt-0.5 font-semibold mono"
                      style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
                      {t ? `${up ? '+' : ''}${t.change.toFixed(2)}%` : '—'}
                    </p>
                  </div>
                  <p className="text-[11px] font-bold mono text-white ml-1">
                    ${t ? (t.price >= 1000
                      ? t.price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : t.price >= 1 ? t.price.toFixed(3) : t.price.toFixed(5))
                      : '—'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">

        {/* ── Left: coin list ── */}
        <div className="ex-card overflow-hidden flex flex-col">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search markets…"
                className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none text-white"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--border2)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(c => {
              const t = tickers[c.sym];
              const up = (t?.change ?? 0) >= 0;
              const active = selected.sym === c.sym;
              return (
                <button key={c.sym} onClick={() => setSelected(c)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: active ? `${c.color}10` : 'transparent',
                    borderLeft: active ? `3px solid ${c.color}` : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget.style.background = 'rgba(255,255,255,0.02)'); }}
                  onMouseLeave={e => { if (!active) (e.currentTarget.style.background = 'transparent'); }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                      style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}25` }}>
                      {c.label[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{c.label}/USDT</p>
                      <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{c.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {tickerLoading ? (
                      <div className="skeleton h-3 w-16 rounded mb-1" />
                    ) : (
                      <>
                        <p className="text-xs font-bold mono text-white">
                          ${t ? (t.price >= 1000 ? t.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : t.price >= 1 ? t.price.toFixed(3) : t.price.toFixed(5)) : '—'}
                        </p>
                        <p className="text-[10px] font-semibold flex items-center gap-0.5 justify-end mt-0.5"
                          style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
                          {up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                          {t ? `${up ? '+' : ''}${t.change.toFixed(2)}%` : '—'}
                        </p>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: chart + stats ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Coin stats header */}
          <div className="ex-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black"
                  style={{ background: `${selected.color}18`, color: selected.color, border: `1px solid ${selected.color}30` }}>
                  {selected.label[0]}
                </div>
                <div>
                  <p className="font-black text-white text-base">{selected.label}/USDT</p>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>{selected.name} · Perpetual</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black mono text-2xl text-white">
                  ${livePrice >= 1000
                    ? livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : livePrice >= 1 ? livePrice.toFixed(4) : livePrice.toFixed(6)}
                </p>
                <p className="text-sm font-bold flex items-center gap-1 mt-0.5 justify-end"
                  style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isUp ? '+' : ''}{change.toFixed(2)}% (24h)
                </p>
              </div>
            </div>

            {ticker && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { l: '24h High', v: `$${ticker.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, c: 'var(--green)' },
                  { l: '24h Low',  v: `$${ticker.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,  c: 'var(--red)' },
                  { l: '24h Vol',  v: `$${(ticker.volume / 1e6).toFixed(1)}M`,                                  c: 'var(--text2)' },
                  { l: 'Funding',  v: '+0.01%',                                                                  c: 'var(--cyan)' },
                ].map(s => (
                  <div key={s.l} className="rounded-xl px-3 py-2.5"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    <p className="text-[9px] uppercase font-semibold mb-1" style={{ color: 'var(--text3)' }}>{s.l}</p>
                    <p className="text-xs font-bold mono" style={{ color: s.c }}>{s.v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="ex-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs font-semibold text-white">{selected.label}/USDT · {interval.toUpperCase()}</span>
              <div className="flex items-center gap-1">
                {INTERVALS.map(iv => (
                  <button key={iv.value} onClick={() => setInterval2(iv.value)}
                    className="px-2 py-1 rounded text-xs font-semibold transition-all"
                    style={interval === iv.value
                      ? { background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border2)' }
                      : { color: 'var(--text3)', background: 'transparent' }}>
                    {iv.label}
                  </button>
                ))}
                <button onClick={() => fetchChart(selected.sym, interval)}
                  className="p-1.5 rounded ml-1 transition-colors"
                  style={{ color: 'var(--text3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                  <RefreshCw size={11} className={chartLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div style={{ height: 280, position: 'relative' }}>
              {chartLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10"
                  style={{ background: 'rgba(10,10,15,0.75)' }}>
                  <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--text3)' }} />
                </div>
              )}
              {candles.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`mktGrad-${selected.sym}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="timeLabel" tick={{ fill: 'var(--text3)', fontSize: 9 }}
                      tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 8)} />
                    <YAxis domain={[chartMin, chartMax]}
                      tick={{ fill: 'var(--text3)', fontSize: 9 }} tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(2)}`}
                      width={60} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="close" stroke={strokeColor} strokeWidth={1.5}
                      fill={`url(#mktGrad-${selected.sym})`} dot={false} activeDot={{ r: 3, fill: strokeColor }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color: 'var(--text3)' }}>Loading chart…</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
