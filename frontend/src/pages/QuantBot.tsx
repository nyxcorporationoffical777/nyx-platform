import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Play, Square, Activity, Clock, TrendingUp, Star, Zap, Terminal, Info, AlertTriangle, CheckCircle, Lightbulb, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import Tooltip from '../components/Tooltip';
import { useToast } from '../components/Toast';

const VIP_LEVELS = [
  { name: 'Starter',  minBalance: 100,   dailyRate: 0.0180, color: '#8888aa' },
  { name: 'Silver',   minBalance: 500,   dailyRate: 0.0220, color: '#cbd5e1' },
  { name: 'Gold',     minBalance: 2000,  dailyRate: 0.0280, color: '#f5c542' },
  { name: 'Platinum', minBalance: 5000,  dailyRate: 0.0350, color: '#06b6d4' },
  { name: 'Diamond',  minBalance: 10000, dailyRate: 0.0500, color: '#a78bfa' },
];

interface BotStatus {
  bot_running: boolean;
  bot_started_at: string | null;
  vip_level: string;
  daily_rate: number;
  current_session_earned: number;
  elapsed_seconds: number;
  session_duration: number;
  balance: number;
  total_earned: number;
  used_today: boolean;
  last_bot_date: string | null;
}

interface LogEntry { time: string; msg: string; type: 'info' | 'success' | 'warn'; }
interface ChartPoint { time: string; earned: number; }

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return `${h > 0 ? h + 'h ' : ''}${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
}

export default function QuantBot() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [liveEarned, setLiveEarned] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessions, setSessions] = useState<{id:number;started_at:string;ended_at:string|null;earned:number;vip_level:string}[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chartTickRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
    setLog(p => [...p.slice(-99), { time: new Date().toLocaleTimeString(), msg, type }]);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await api.get('/bot/status');
      setStatus(r.data);
      setLiveEarned(r.data.current_session_earned);
      setElapsed(r.data.elapsed_seconds);
    } catch {}
  }, []);

  const fetchSessions = useCallback(async () => {
    try { const r = await api.get('/bot/sessions'); setSessions(r.data); } catch {}
  }, []);

  useEffect(() => { fetchStatus(); fetchSessions(); }, [fetchStatus, fetchSessions]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (refreshRef.current) clearInterval(refreshRef.current);
    completedRef.current = false;
    chartTickRef.current = 0;
    setSessionDone(false);
    if (status?.bot_running && status.balance > 0) {
      const fullProfit = status.balance * status.daily_rate;
      const sessionDur = status.session_duration || 300;
      const baseElapsed = status.elapsed_seconds;
      const t0 = Date.now();
      tickRef.current = setInterval(() => {
        const delta = (Date.now() - t0) / 1000;
        const total = Math.min(baseElapsed + delta, sessionDur);
        const progress = total / sessionDur;
        const earned = fullProfit * progress;
        setLiveEarned(earned);
        setElapsed(total);
        chartTickRef.current += 1;
        if (chartTickRef.current % 5 === 0) {
          setChart(p => {
            const point = { time: new Date().toLocaleTimeString(), earned: parseFloat(earned.toFixed(6)) };
            return [...p, point].slice(-60);
          });
        }
        if (total >= sessionDur && !completedRef.current) {
          completedRef.current = true;
          setSessionDone(true);
          addLog(`[ENGINE] Session complete! Full profit $${fullProfit.toFixed(4)} unlocked`, 'success');
          addLog('[ENGINE] Press STOP ENGINE to collect your earnings', 'info');
        }
      }, 1000);
      refreshRef.current = setInterval(() => {
        refreshUser();
      }, 30000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [status?.bot_running, status?.daily_rate, status?.balance, status?.elapsed_seconds, status?.session_duration, addLog, refreshUser]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const r = await api.post('/bot/start');
      addLog(`[ENGINE] Started — ${r.data.vip_level} @ ${(r.data.daily_rate * 100).toFixed(2)}%/day`, 'success');
      addLog('[ALGO] Quantitative algorithm initializing...', 'info');
      addLog('[ALGO] Yield accumulation active', 'success');
      toast('success', 'Engine Started', `${r.data.vip_level} tier · ${(r.data.daily_rate * 100).toFixed(2)}%/day · Session begins now`);
      await fetchStatus(); await refreshUser();
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to start';
      addLog(`[ERROR] ${msg}`, 'warn');
      toast('error', 'Cannot Start Engine', msg);
    } finally { setLoading(false); }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const r = await api.post('/bot/stop');
      addLog(`[ENGINE] Stopped — Session earned: $${r.data.earned.toFixed(6)}`, 'success');
      addLog(`[ENGINE] Duration: ${fmt(r.data.elapsed_seconds)}`, 'info');
      addLog('[LEDGER] Yield credited to balance ✓', 'success');
      toast('success', `+$${r.data.earned.toFixed(4)} Credited`, `Session complete · New balance: $${r.data.new_balance.toFixed(2)}`);
      setChart([]); setLiveEarned(0); setElapsed(0);
      await fetchStatus(); await fetchSessions(); await refreshUser();
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to stop';
      addLog(`[ERROR] ${msg}`, 'warn');
      toast('error', 'Stop Failed', msg);
    } finally { setLoading(false); }
  };

  const currentVip = VIP_LEVELS.find(v => v.name === status?.vip_level) || VIP_LEVELS[0];
  const nextVip = VIP_LEVELS.find(v => v.minBalance > (status?.balance || 0));
  const vipProgress = nextVip ? Math.min(100, ((status?.balance || 0) / nextVip.minBalance) * 100) : 100;
  const isRunning = !!status?.bot_running;

  const sessionDur = status?.session_duration || 300;
  const sessionProgress = Math.min(100, (elapsed / sessionDur) * 100);
  const remaining = Math.max(0, sessionDur - elapsed);
  const fullProfit = (status?.balance || 0) * (status?.daily_rate || 0);
  const sessionComplete = elapsed >= sessionDur;
  const usedToday = !!status?.used_today;
  // Next available: midnight UTC tomorrow
  const nextAvailableUTC = (() => {
    const d = new Date(); d.setUTCHours(24,0,0,0); return d;
  })();
  const msUntilReset = nextAvailableUTC.getTime() - Date.now();
  const hUntil = Math.floor(msUntilReset / 3600000);
  const mUntil = Math.floor((msUntilReset % 3600000) / 60000);

  const RING_R = 54;
  const RING_C = 2 * Math.PI * RING_R;
  const ringOffset = RING_C * (1 - sessionProgress / 100);

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-0.5">Automated Trading</p>
          <h1 className="text-lg font-bold text-white">Quant Engine</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'blink' : ''}`}
            style={{ background: isRunning ? 'var(--green)' : 'var(--text3)' }} />
          <span className="text-xs font-semibold" style={{ color: isRunning ? 'var(--green)' : 'var(--text3)' }}>
            {isRunning ? 'RUNNING' : 'IDLE'}
          </span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${currentVip.color}18`, color: currentVip.color }}>
            {status?.vip_level || 'Starter'}
          </span>
        </div>
      </div>

      {/* Alert banners */}
      {usedToday && !isRunning && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <Clock size={14} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--yellow)' }}>Daily session completed</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
              Next in <span className="mono font-semibold" style={{ color: 'var(--text)' }}>{hUntil}h {mUntil}m</span> · Resets midnight UTC
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded mono font-bold" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--yellow)' }}>1/day</span>
        </div>
      )}
      {!isRunning && !usedToday && (status?.balance ?? 0) > 0 && (status?.balance ?? 0) < 100 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)' }}>
          <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: 'var(--text2)' }}>
            Need <strong className="text-white">$100</strong> min. Current: <strong className="mono" style={{ color: 'var(--red)' }}>${(status?.balance ?? 0).toFixed(2)}</strong>.
            <a href="/assets" className="ml-1.5 font-bold" style={{ color: 'var(--brand-1)' }}>Deposit →</a>
          </p>
        </div>
      )}
      {!isRunning && (status?.balance ?? 0) === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
          <Lightbulb size={14} style={{ color: 'var(--brand-1)', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: 'var(--text2)' }}>
            Deposit at least <strong className="text-white">$100 USDT</strong> to activate.
            <a href="/assets" className="ml-1.5 font-bold" style={{ color: 'var(--brand-1)' }}>Go to Assets →</a>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left col: engine hero + chart + log ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ENGINE HERO */}
          <div className="ex-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Cpu size={13} style={{ color: 'var(--brand-1)' }} />
                <span className="text-xs font-bold text-white">Quantitative Yield Engine</span>
              </div>
              <Tooltip content="Yield rate is locked at your VIP tier when you press START." position="left">
                <Info size={11} style={{ color: 'var(--text3)', cursor: 'help' }} />
              </Tooltip>
            </div>

            <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
              {/* SVG progress ring */}
              <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={RING_R} fill="none" strokeWidth="8" stroke="var(--bg4)" />
                  <circle cx="70" cy="70" r={RING_R} fill="none" strokeWidth="8"
                    stroke={sessionComplete ? '#10b981' : isRunning ? '#6366f1' : 'var(--bg3)'}
                    strokeDasharray={String(RING_C)}
                    strokeDashoffset={isRunning ? ringOffset : RING_C}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isRunning ? (
                    <>
                      <span className="text-xl font-black mono leading-none"
                        style={{ color: sessionComplete ? 'var(--green)' : 'var(--text)' }}>
                        {sessionProgress.toFixed(0)}%
                      </span>
                      <span className="text-[10px] mono mt-1" style={{ color: 'var(--text3)' }}>
                        {sessionComplete ? 'DONE' : fmt(remaining)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap size={22} style={{ color: 'var(--text3)', opacity: 0.35 }} />
                      <span className="text-[10px] mono mt-1" style={{ color: 'var(--text3)' }}>STANDBY</span>
                    </>
                  )}
                </div>
              </div>

              {/* Stats + button */}
              <div className="flex-1 w-full space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Daily Rate',     val: `${((status?.daily_rate||0)*100).toFixed(2)}%/day`, color: 'var(--yellow)', tip: 'Daily yield rate for your current VIP tier.' },
                    { label: 'Session Earned', val: `$${liveEarned.toFixed(6)}`,                        color: 'var(--green)',  tip: 'Yield accumulated this session. Updates every second.' },
                    { label: 'Full Profit',    val: `$${fullProfit.toFixed(4)}`,                        color: 'var(--brand-1)',tip: 'Max yield when session reaches 100%.' },
                    { label: 'Total Earned',   val: `$${(status?.total_earned||0).toFixed(2)}`,         color: 'var(--text)',   tip: 'All-time yield across all sessions.' },
                  ].map(s => (
                    <div key={s.label} className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{s.label}</p>
                        <Tooltip content={s.tip} position="top">
                          <Info size={8} style={{ color: 'var(--text3)', cursor: 'help' }} />
                        </Tooltip>
                      </div>
                      <p className="text-xs font-black mono" style={{ color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {sessionDone && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green)' }}>
                    <CheckCircle size={12} />
                    Session complete! ${fullProfit.toFixed(4)} ready — press STOP
                  </div>
                )}

                <button
                  onClick={isRunning ? handleStop : handleStart}
                  disabled={loading || (!isRunning && (status?.balance||0) < 100) || (!isRunning && usedToday)}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all"
                  style={isRunning
                    ? sessionDone
                      ? { background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.5)', color: 'var(--green)' }
                      : { background: 'rgba(244,63,94,0.1)', border: '2px solid rgba(244,63,94,0.35)', color: 'var(--red)' }
                    : (status?.balance||0) >= 100 && !usedToday
                      ? { background: 'linear-gradient(135deg,var(--brand-1),var(--brand-2))', color: '#fff', border: 'none' }
                      : { background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)', cursor: 'not-allowed' }
                  }>
                  {loading
                    ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    : isRunning
                      ? <><Square size={14} fill="currentColor" /> STOP ENGINE</>
                      : <><Play size={14} fill="currentColor" /> START ENGINE</>
                  }
                </button>

                {(status?.balance||0) < 100 && !isRunning && (
                  <p className="text-center text-xs" style={{ color: 'var(--text3)' }}>
                    Min $100 balance · <a href="/assets" className="font-bold" style={{ color: 'var(--brand-1)' }}>Deposit →</a>
                  </p>
                )}
              </div>
            </div>

            {/* Progress bar strip */}
            {isRunning && (
              <div className="px-5 pb-4">
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span style={{ color: 'var(--text3)' }}>Session Progress</span>
                  <span className="mono font-semibold" style={{ color: sessionComplete ? 'var(--green)' : 'var(--brand-1)' }}>
                    {sessionComplete ? '✓ Complete — stop to collect' : `${fmt(remaining)} · ${sessionProgress.toFixed(1)}%`}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg4)' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{
                    width: `${sessionProgress}%`,
                    background: sessionComplete ? 'var(--green)' : 'linear-gradient(90deg,var(--brand-1),var(--brand-2))',
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Live earnings chart */}
          {(chart.length > 1 || isRunning) && (
            <div className="ex-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Activity size={13} style={{ color: 'var(--green)' }} />
                  <span className="text-xs font-bold text-white">Live Earnings</span>
                  {isRunning && <div className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--green)' }} />}
                </div>
                <span className="mono text-xs font-black" style={{ color: 'var(--green)' }}>+${liveEarned.toFixed(6)}</span>
              </div>
              <div style={{ height: 160 }}>
                {chart.length < 2 ? (
                  <div className="flex items-center justify-center h-full flex-col gap-2">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg4)', borderTopColor: 'var(--green)' }} />
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>Collecting data…</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: '#52525e', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#52525e', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toFixed(4)}`} width={68} />
                      <ReTooltip
                        contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: 'var(--text3)' }}
                        formatter={(v: number | undefined) => [v != null ? `$${v.toFixed(6)}` : '—', 'Earned']}
                      />
                      <Area type="monotone" dataKey="earned" stroke="#10b981" strokeWidth={2}
                        fill="url(#earningsGrad)" dot={false} activeDot={{ r: 3, fill: '#10b981' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Terminal log */}
          <div className="ex-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <Terminal size={12} style={{ color: 'var(--brand-1)' }} />
              <span className="text-xs font-bold text-white">Activity Log</span>
              <span className="mono text-xs ml-auto" style={{ color: 'var(--text3)' }}>{log.length} entries</span>
            </div>
            <div ref={logRef} className="p-3 overflow-y-auto mono text-xs space-y-0.5" style={{ height: 172, background: 'var(--bg)' }}>
              {log.length === 0
                ? <p style={{ color: 'var(--text3)' }}>{'>'} Waiting for engine activity…</p>
                : log.map((e, i) => (
                  <div key={i} className="flex gap-2 leading-relaxed"
                    style={{ color: e.type === 'success' ? '#10b981' : e.type === 'warn' ? '#f43f5e' : 'var(--text3)' }}>
                    <span className="flex-shrink-0" style={{ color: 'var(--text3)', minWidth: 58 }}>{e.time}</span>
                    <span>{e.msg}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* ── Right col ── */}
        <div className="space-y-4">

          {/* VIP tier card */}
          <div className="ex-card overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Star size={12} style={{ color: currentVip.color }} />
                <span className="text-xs font-bold text-white">Your Tier</span>
              </div>
              <span className="text-xs font-black mono" style={{ color: 'var(--green)' }}>
                {((status?.daily_rate||0)*100).toFixed(2)}%/day
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${currentVip.color}15`, border: `1px solid ${currentVip.color}35` }}>
                  <Star size={16} style={{ color: currentVip.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black" style={{ color: currentVip.color }}>{status?.vip_level || 'Starter'}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Current tier · ${(status?.balance||0).toFixed(2)} balance</p>
                </div>
              </div>
              {nextVip ? (
                <>
                  <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'var(--text3)' }}>
                    <span>Next: {nextVip.name}</span>
                    <span>${(nextVip.minBalance-(status?.balance||0)).toLocaleString()} needed</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ background: 'var(--bg4)' }}>
                    <div className="h-2 rounded-full transition-all"
                      style={{ width: `${vipProgress}%`, background: `linear-gradient(90deg,${currentVip.color},${nextVip.color})` }} />
                  </div>
                  <p className="text-[10px] mt-1.5 text-right mono" style={{ color: 'var(--text3)' }}>{vipProgress.toFixed(1)}%</p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 py-1">
                  <Star size={13} style={{ color: 'var(--purple2)' }} />
                  <span className="text-xs font-black" style={{ color: 'var(--purple2)' }}>Max Tier — Diamond 💎</span>
                </div>
              )}
            </div>
          </div>

          {/* Tiers list */}
          <div className="ex-card overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <Zap size={12} style={{ color: 'var(--yellow)' }} />
              <span className="text-xs font-bold text-white">All Tiers</span>
              <Tooltip content="Higher balance = higher tier = more daily yield." position="bottom">
                <Info size={10} style={{ color: 'var(--text3)', cursor: 'help' }} />
              </Tooltip>
            </div>
            {VIP_LEVELS.map((level, i) => {
              const active = level.name === status?.vip_level;
              const unlocked = (status?.balance||0) >= level.minBalance;
              return (
                <div key={level.name}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: i < VIP_LEVELS.length - 1 ? '1px solid var(--border)' : 'none',
                    background: active ? `${level.color}08` : 'transparent',
                  }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: unlocked ? level.color : 'var(--bg4)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold" style={{ color: active ? level.color : unlocked ? 'var(--text2)' : 'var(--text3)' }}>
                        {level.name}
                      </span>
                      {active && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black leading-none" style={{ background: level.color, color: '#000' }}>YOU</span>
                      )}
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Min ${level.minBalance.toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-black mono flex-shrink-0"
                    style={{ color: active ? 'var(--green)' : unlocked ? 'var(--text2)' : 'var(--text3)' }}>
                    {(level.dailyRate*100).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick stats */}
          <div className="ex-card p-4 space-y-2.5">
            <p className="text-xs font-bold text-white mb-1">Account Stats</p>
            {[
              { icon: TrendingUp, label: 'Total Earned',  val: `$${(status?.total_earned||0).toFixed(4)}`, color: 'var(--yellow)' },
              { icon: Activity,   label: 'Balance',        val: `$${(status?.balance||0).toFixed(2)}`,     color: 'var(--text)' },
              { icon: Clock,      label: 'Active Days',    val: `${user?.active_days||0} days`,             color: 'var(--text2)' },
              { icon: Star,       label: 'Sessions Run',   val: `${sessions.length}`,                       color: 'var(--text2)' },
              { icon: Clock,      label: 'Daily Reset',    val: usedToday ? `${hUntil}h ${mUntil}m` : 'Available', color: usedToday ? 'var(--yellow)' : 'var(--green)' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text3)' }}>
                  <s.icon size={11} /> {s.label}
                </span>
                <span className="text-xs font-semibold mono" style={{ color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Hint card */}
          {!isRunning && !usedToday && (status?.balance??0) >= 100 && (
            <div className="rounded-xl p-3.5 flex items-start gap-3"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={13} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--green)' }}>Ready to earn</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text3)' }}>
                  Start the engine to earn <strong className="text-white">${fullProfit.toFixed(4)}</strong> this session.
                </p>
              </div>
            </div>
          )}
          {isRunning && !sessionComplete && (
            <div className="rounded-xl p-3.5 flex items-start gap-3"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Info size={13} style={{ color: 'var(--brand-1)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--brand-1)' }}>Session running</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text3)' }}>
                  Wait for 100% to collect full profit. Early stop gives proportional earnings.
                </p>
              </div>
            </div>
          )}

          {/* Session history */}
          {sessions.length > 0 && (
            <div className="ex-card overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs font-bold text-white">History</span>
                <span className="section-label">last {Math.min(sessions.length, 8)}</span>
              </div>
              {sessions.slice(0, 8).map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{s.vip_level}</p>
                  </div>
                  <span className="text-xs font-black mono" style={{ color: s.earned > 0 ? 'var(--green)' : 'var(--text3)' }}>
                    {s.earned > 0 ? `+$${s.earned.toFixed(4)}` : s.ended_at ? '$0.0000' : 'Running…'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
