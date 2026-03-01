import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, BarChart2, Target, Award, Activity, RefreshCw, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import api from '../api/axios';

const PAIR_LABELS: Record<string, string> = {
  BTCUSDT: 'BTC', ETHUSDT: 'ETH', BNBUSDT: 'BNB', SOLUSDT: 'SOL',
  XRPUSDT: 'XRP', ADAUSDT: 'ADA', DOGEUSDT: 'DOGE', AVAXUSDT: 'AVAX',
  MATICUSDT: 'MATIC', LTCUSDT: 'LTC',
};

interface HistoryPos {
  id: number; symbol: string; direction: string; leverage: number;
  entry_price: number; close_price: number; margin: number; pnl: number;
  status: string; closed_at: string; opened_at: string;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 11,
    color: 'var(--text)',
  },
  labelStyle: { color: 'var(--text3)' },
};

export default function Analytics() {
  const [history, setHistory] = useState<HistoryPos[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/futures/history');
      setHistory(data.history || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const now = Date.now();
  const cutoff = period === '7d' ? now - 7 * 86400000
    : period === '30d' ? now - 30 * 86400000 : 0;
  const filtered = history.filter(p => new Date(p.closed_at).getTime() >= cutoff);
  const closed = filtered.filter(p => p.pnl !== null);

  const totalTrades = closed.length;
  const winners = closed.filter(p => p.pnl > 0);
  const losers = closed.filter(p => p.pnl <= 0);
  const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0;
  const totalPnl = closed.reduce((s, p) => s + p.pnl, 0);
  const totalMargin = closed.reduce((s, p) => s + p.margin, 0);
  const totalRoi = totalMargin > 0 ? (totalPnl / totalMargin) * 100 : 0;
  const avgWin = winners.length ? winners.reduce((s, p) => s + p.pnl, 0) / winners.length : 0;
  const avgLoss = losers.length ? losers.reduce((s, p) => s + p.pnl, 0) / losers.length : 0;
  const profitFactor = losers.length && avgLoss !== 0 ? Math.abs(avgWin * winners.length / (avgLoss * losers.length)) : 0;
  const bestTrade = closed.length ? Math.max(...closed.map(p => p.pnl)) : 0;
  const worstTrade = closed.length ? Math.min(...closed.map(p => p.pnl)) : 0;
  const avgLeverage = closed.length ? closed.reduce((s, p) => s + p.leverage, 0) / closed.length : 0;
  const longCount = closed.filter(p => p.direction === 'long').length;
  const shortCount = closed.filter(p => p.direction === 'short').length;

  const equityCurve = (() => {
    const sorted = [...closed].sort((a, b) => new Date(a.closed_at).getTime() - new Date(b.closed_at).getTime());
    let cum = 0;
    return sorted.map(p => {
      cum += p.pnl;
      return {
        date: new Date(p.closed_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        pnl: parseFloat(cum.toFixed(2)),
        trade: parseFloat(p.pnl.toFixed(2)),
      };
    });
  })();

  const pnlBars = closed.slice(-40).map((p, i) => ({
    i: i + 1,
    pnl: parseFloat(p.pnl.toFixed(2)),
    pair: PAIR_LABELS[p.symbol] || p.symbol,
  }));

  const symbolMap: Record<string, { trades: number; pnl: number; wins: number }> = {};
  for (const p of closed) {
    const sym = PAIR_LABELS[p.symbol] || p.symbol;
    if (!symbolMap[sym]) symbolMap[sym] = { trades: 0, pnl: 0, wins: 0 };
    symbolMap[sym].trades++;
    symbolMap[sym].pnl += p.pnl;
    if (p.pnl > 0) symbolMap[sym].wins++;
  }
  const symbolData = Object.entries(symbolMap)
    .map(([name, v]) => ({ name, trades: v.trades, pnl: parseFloat(v.pnl.toFixed(2)), wr: v.trades > 0 ? (v.wins / v.trades) * 100 : 0 }))
    .sort((a, b) => b.pnl - a.pnl);

  const equityIsUp = equityCurve.length > 0 && equityCurve[equityCurve.length - 1].pnl >= 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text3)' }} />
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <BarChart2 size={24} style={{ color: 'var(--text3)', opacity: 0.5 }} />
      </div>
      <p className="text-sm font-bold text-white">No trade history yet</p>
      <p className="text-xs text-center max-w-xs" style={{ color: 'var(--text3)' }}>
        Open and close futures positions to see your performance analytics here.
      </p>
    </div>
  );

  return (
    <div className="p-4 space-y-4 fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-0.5">Futures Trading</p>
          <h1 className="text-lg font-bold text-white">Portfolio Analytics</h1>
        </div>
        <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          {(['7d', '30d', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={period === p
                ? { background: 'var(--brand-1)', color: '#fff' }
                : { color: 'var(--text3)' }}>
              {p === 'all' ? 'All Time' : `Last ${p}`}
            </button>
          ))}
        </div>
      </div>

      {totalTrades === 0 ? <EmptyState /> : <>

        {/* ── KPI grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
          {[
            { label: 'Total Trades',  val: String(totalTrades),                                            color: 'var(--text)',    mono: false },
            { label: 'Win Rate',      val: `${winRate.toFixed(1)}%`,                                       color: winRate >= 50 ? 'var(--green)' : 'var(--red)', mono: true },
            { label: 'Net PnL',       val: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`,          color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)', mono: true },
            { label: 'Total ROI',     val: `${totalRoi >= 0 ? '+' : ''}${totalRoi.toFixed(2)}%`,          color: totalRoi >= 0 ? 'var(--green)' : 'var(--red)', mono: true },
            { label: 'Profit Factor', val: profitFactor > 0 ? profitFactor.toFixed(2) : '—',              color: profitFactor >= 1 ? 'var(--green)' : 'var(--red)', mono: true },
            { label: 'Best Trade',    val: `+$${bestTrade.toFixed(2)}`,                                    color: 'var(--green)',   mono: true },
            { label: 'Worst Trade',   val: `$${worstTrade.toFixed(2)}`,                                    color: 'var(--red)',     mono: true },
            { label: 'Avg Leverage',  val: `${avgLeverage.toFixed(1)}×`,                                  color: 'var(--yellow)',  mono: true },
          ].map((k, i) => (
            <div key={k.label} className={`ex-card px-3 py-3 card-enter-${Math.min(i + 1, 6)}`}>
              <p className="section-label mb-1.5">{k.label}</p>
              <p className={`text-sm font-black leading-none ${k.mono ? 'mono' : ''}`} style={{ color: k.color }}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* ── Win/Loss + Direction summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Win rate donut (pure CSS) */}
          <div className="ex-card p-4 flex items-center gap-5">
            <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" strokeWidth="8" stroke="var(--bg3)" />
                <circle cx="36" cy="36" r="28" fill="none" strokeWidth="8"
                  stroke={winRate >= 50 ? '#10b981' : '#f43f5e'}
                  strokeDasharray={`${(winRate / 100) * 175.9} 175.9`}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black mono" style={{ color: winRate >= 50 ? 'var(--green)' : 'var(--red)' }}>
                  {winRate.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-xs font-bold text-white">Win Rate</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
                  <span className="text-xs" style={{ color: 'var(--text2)' }}>Wins</span>
                </div>
                <span className="text-xs font-black mono" style={{ color: 'var(--green)' }}>{winners.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--red)' }} />
                  <span className="text-xs" style={{ color: 'var(--text2)' }}>Losses</span>
                </div>
                <span className="text-xs font-black mono" style={{ color: 'var(--red)' }}>{losers.length}</span>
              </div>
            </div>
          </div>

          {/* Avg Win vs Avg Loss */}
          <div className="ex-card p-4">
            <p className="text-xs font-bold text-white mb-3">Avg Win vs Avg Loss</p>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>Avg Win</span>
                  <span className="text-[10px] font-bold mono" style={{ color: 'var(--green)' }}>+${avgWin.toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                  <div className="h-full rounded-full" style={{ width: '100%', background: 'var(--green)' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>Avg Loss</span>
                  <span className="text-[10px] font-bold mono" style={{ color: 'var(--red)' }}>${avgLoss.toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                  <div className="h-full rounded-full" style={{
                    width: avgWin > 0 ? `${Math.min((Math.abs(avgLoss) / avgWin) * 100, 100)}%` : '0%',
                    background: 'var(--red)',
                  }} />
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>Risk/Reward</span>
                <span className="text-[10px] font-black mono"
                  style={{ color: avgWin > Math.abs(avgLoss) ? 'var(--green)' : 'var(--red)' }}>
                  1 : {avgLoss !== 0 ? (avgWin / Math.abs(avgLoss)).toFixed(2) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Long vs Short */}
          <div className="ex-card p-4">
            <p className="text-xs font-bold text-white mb-3">Direction Split</p>
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={11} style={{ color: 'var(--green)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>Long</span>
                  </div>
                  <span className="text-xs font-black mono" style={{ color: 'var(--green)' }}>
                    {longCount} <span className="text-[9px] font-normal" style={{ color: 'var(--text3)' }}>
                      ({totalTrades > 0 ? ((longCount / totalTrades) * 100).toFixed(0) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                  <div className="h-full rounded-full" style={{
                    width: totalTrades > 0 ? `${(longCount / totalTrades) * 100}%` : '0%',
                    background: 'var(--green)',
                  }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown size={11} style={{ color: 'var(--red)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>Short</span>
                  </div>
                  <span className="text-xs font-black mono" style={{ color: 'var(--red)' }}>
                    {shortCount} <span className="text-[9px] font-normal" style={{ color: 'var(--text3)' }}>
                      ({totalTrades > 0 ? ((shortCount / totalTrades) * 100).toFixed(0) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                  <div className="h-full rounded-full" style={{
                    width: totalTrades > 0 ? `${(shortCount / totalTrades) * 100}%` : '0%',
                    background: 'var(--red)',
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Equity curve ── */}
        <div className="ex-card overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <Activity size={13} style={{ color: equityIsUp ? 'var(--green)' : 'var(--red)' }} />
              <span className="text-sm font-bold text-white">Equity Curve</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: equityIsUp ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                  color: equityIsUp ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${equityIsUp ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                }}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
            <span className="section-label">{totalTrades} trades</span>
          </div>
          <div style={{ height: 200 }}>
            {equityCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={equityIsUp ? '#10b981' : '#f43f5e'} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={equityIsUp ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#52525e', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#52525e', fontSize: 9 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `$${v}`} width={54} />
                  <Tooltip {...TOOLTIP_STYLE}
                    formatter={(v: number | undefined) => [v != null ? `${v >= 0 ? '+' : ''}$${v.toFixed(2)}` : '—', 'Cumulative PnL']} />
                  <Area type="monotone" dataKey="pnl"
                    stroke={equityIsUp ? '#10b981' : '#f43f5e'} strokeWidth={2}
                    fill="url(#eqGrad)" dot={false}
                    activeDot={{ r: 4, fill: equityIsUp ? '#10b981' : '#f43f5e' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Need at least 2 closed trades</p>
              </div>
            )}
          </div>
        </div>

        {/* ── PnL per trade + Top pairs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* PnL per trade bar */}
          <div className="lg:col-span-2 ex-card overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <BarChart2 size={13} style={{ color: 'var(--brand-1)' }} />
              <span className="text-sm font-bold text-white">PnL per Trade</span>
              <span className="section-label ml-1">last {pnlBars.length}</span>
            </div>
            <div style={{ height: 180 }}>
              {pnlBars.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pnlBars} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="pair" tick={{ fill: '#52525e', fontSize: 8 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#52525e', fontSize: 9 }} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${v}`} width={48} />
                    <Tooltip {...TOOLTIP_STYLE}
                      formatter={(v: number | undefined) => [v != null ? `${v >= 0 ? '+' : ''}$${v.toFixed(2)}` : '—', 'PnL']} />
                    <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={20}>
                      {pnlBars.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>No data</p>
                </div>
              )}
            </div>
          </div>

          {/* Top pairs table */}
          <div className="ex-card overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <Target size={13} style={{ color: 'var(--yellow)' }} />
              <span className="text-sm font-bold text-white">Top Pairs</span>
            </div>
            {symbolData.length > 0 ? (
              <div>
                {symbolData.slice(0, 6).map((s, i) => (
                  <div key={s.name} style={{ borderBottom: '1px solid var(--border)' }}
                    className="px-4 py-2.5 flex items-center gap-3"
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span className="text-[10px] font-bold w-4 text-right flex-shrink-0" style={{ color: 'var(--text3)' }}>#{i + 1}</span>
                    <span className="text-xs font-bold text-white flex-1">{s.name}</span>
                    <div className="text-right">
                      <p className="text-xs font-black mono" style={{ color: s.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                      </p>
                      <p className="text-[9px]" style={{ color: 'var(--text3)' }}>
                        {s.trades}t · {s.wr.toFixed(0)}% WR
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-xs" style={{ color: 'var(--text3)' }}>No pair data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Badges ── */}
        {totalTrades >= 3 && (
          <div className="ex-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award size={13} style={{ color: 'var(--yellow)' }} />
              <span className="text-sm font-bold text-white">Achievements</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {winRate >= 60 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--green)' }}>🎯 Sharp Shooter</span>
                </div>
              )}
              {totalTrades >= 10 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Zap size={10} style={{ color: 'var(--brand-1)' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--brand-1)' }}>Active Trader</span>
                </div>
              )}
              {profitFactor >= 2 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--yellow)' }}>📈 Profitable</span>
                </div>
              )}
              {bestTrade >= 100 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--purple2)' }}>💎 Big Winner</span>
                </div>
              )}
              {totalRoi >= 50 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--cyan)' }}>🚀 High ROI</span>
                </div>
              )}
            </div>
          </div>
        )}

      </>}
    </div>
  );
}
