import { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, TrendingUp, Clock, DollarSign, Zap, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const PLAN_COLORS: Record<string, string> = {
  flexible: 'var(--green)',
  '30d': 'var(--cyan)',
  '90d': 'var(--brand-1)',
  '180d': 'var(--yellow)',
  '365d': 'var(--purple2)',
};

interface Plan {
  label: string; apy: number; duration_days: number; min: number; early_penalty: number;
}
interface StakePos {
  id: number; amount: number; plan: string; apy: number; duration_days: number;
  earned: number; status: string; staked_at: string; unlocks_at: string;
}
interface Stats { totalStaked: number; totalEarned: number; avgApy: number; activeCount: number; }

function daysLeft(unlocks_at: string) {
  const diff = new Date(unlocks_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function Staking() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [positions, setPositions] = useState<StakePos[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('30d');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [unstaking, setUnstaking] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [plansRes, posRes, statsRes] = await Promise.allSettled([
        api.get('/staking/plans'),
        api.get('/staking/positions'),
        api.get('/staking/stats'),
      ]);
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data.plans);
      if (posRes.status === 'fulfilled') setPositions(posRes.value.data.positions);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } catch {}
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStake = async () => {
    const amt = parseFloat(amount);
    const plan = plans[selectedPlan];
    if (!plan) return;
    if (!amt || amt < plan.min) { toast('warning', `Minimum is $${plan.min}`); return; }
    if (amt > (user?.balance ?? 0)) { toast('error', 'Insufficient balance'); return; }
    setLoading(true);
    try {
      await api.post('/staking/stake', { plan: selectedPlan, amount: amt });
      toast('success', `Staked $${amt.toFixed(2)}`, `Earning ${(plan.apy * 100).toFixed(0)}% APY`);
      setAmount('');
      await fetchAll();
      await refreshUser();
    } catch (e: any) {
      toast('error', e.response?.data?.error || 'Staking failed');
    } finally { setLoading(false); }
  };

  const handleUnstake = async (id: number) => {
    setUnstaking(id);
    try {
      const { data } = await api.post(`/staking/unstake/${id}`);
      if (data.early) {
        toast('warning', `Unstaked with penalty: -$${data.penalty.toFixed(2)}`, `$${data.returned.toFixed(2)} returned`);
      } else {
        toast('success', `Unstaked — $${data.returned.toFixed(2)} returned`);
      }
      await fetchAll();
      await refreshUser();
    } catch (e: any) {
      toast('error', e.response?.data?.error || 'Unstake failed');
    } finally { setUnstaking(null); }
  };

  const plan = plans[selectedPlan];
  const amtNum = parseFloat(amount) || 0;
  const projectedDaily = amtNum * ((plan?.apy || 0) / 365);
  const projectedTotal = amtNum * (plan?.apy || 0) * ((plan?.duration_days || 365) / 365);

  // Sparkline for projected earnings
  const sparkData = plan && amtNum > 0
    ? Array.from({ length: Math.min(plan.duration_days || 30, 30) }, (_, i) => ({
        day: i + 1,
        val: parseFloat((amtNum * (plan.apy / 365) * (i + 1)).toFixed(4)),
      }))
    : [];

  const activePosns = positions.filter(p => p.status === 'active');
  const closedPosns = positions.filter(p => p.status !== 'active');

  return (
    <div className="p-3 sm:p-5 space-y-4 fade-in max-w-[1200px] mx-auto">

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Staked',   val: `$${(stats?.totalStaked ?? 0).toFixed(2)}`,  color: 'var(--brand-1)', icon: Lock },
          { label: 'Total Earned',   val: `$${(stats?.totalEarned ?? 0).toFixed(4)}`,  color: 'var(--green)',   icon: TrendingUp },
          { label: 'Avg APY',        val: `${((stats?.avgApy ?? 0) * 100).toFixed(1)}%`, color: 'var(--yellow)', icon: Zap },
          { label: 'Active Stakes',  val: `${stats?.activeCount ?? 0}`,                color: 'var(--cyan)',    icon: CheckCircle },
        ].map((s, i) => (
          <div key={s.label} className={`ex-card p-4 card-enter-${i + 1}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={13} style={{ color: s.color }} />
              <p className="section-label">{s.label}</p>
            </div>
            <p className="mono font-bold text-lg" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left: Stake panel ── */}
        <div className="space-y-3">

          {/* Plan selector */}
          <div className="ex-card p-4 space-y-3">
            <p className="text-sm font-bold text-white">Select Plan</p>
            <div className="space-y-2">
              {Object.entries(plans).map(([key, p]) => (
                <button key={key} onClick={() => setSelectedPlan(key)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                  style={selectedPlan === key
                    ? { background: `${PLAN_COLORS[key]}12`, border: `1px solid ${PLAN_COLORS[key]}40` }
                    : { background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[key] }} />
                    <span className="text-xs font-semibold text-white">{p.label}</span>
                    {key === 'flexible' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--green)' }}>
                        ANYTIME
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black mono" style={{ color: PLAN_COLORS[key] }}>
                      {(p.apy * 100).toFixed(0)}% APY
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--text3)' }}>
                      min ${p.min}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stake form */}
          <div className="ex-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">Stake USDT</p>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>
                Bal: <span className="font-bold text-white">${(user?.balance ?? 0).toFixed(2)}</span>
              </span>
            </div>

            <div className="relative">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-3 rounded-xl text-sm font-bold mono text-white outline-none"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                onFocus={e => (e.target.style.borderColor = plan ? PLAN_COLORS[selectedPlan] : 'var(--brand-1)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold"
                style={{ color: 'var(--text3)' }}>USDT</span>
            </div>

            <div className="flex gap-1">
              {[25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => setAmount((((user?.balance ?? 0) * pct) / 100).toFixed(2))}
                  className="flex-1 py-1 rounded text-xs font-bold transition-all"
                  style={{ background: 'var(--bg4)', color: 'var(--text2)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}>
                  {pct}%
                </button>
              ))}
            </div>

            {/* Projection */}
            {amtNum > 0 && plan && (
              <div className="rounded-xl p-3 space-y-1.5"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                {[
                  { l: 'Daily Earnings', v: `+$${projectedDaily.toFixed(4)}`, c: 'var(--green)' },
                  { l: 'Total Return',   v: `+$${projectedTotal.toFixed(4)}`, c: PLAN_COLORS[selectedPlan] },
                  { l: 'Lock Period',    v: plan.duration_days > 0 ? `${plan.duration_days} days` : 'Flexible', c: 'var(--text)' },
                  { l: 'APY',           v: `${(plan.apy * 100).toFixed(0)}%`, c: PLAN_COLORS[selectedPlan] },
                ].map(r => (
                  <div key={r.l} className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text3)' }}>{r.l}</span>
                    <span className="font-bold mono" style={{ color: r.c }}>{r.v}</span>
                  </div>
                ))}
                {plan.early_penalty > 0 && (
                  <div className="flex items-center gap-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <AlertTriangle size={9} style={{ color: 'var(--yellow)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--yellow)' }}>
                      {(plan.early_penalty * 100).toFixed(0)}% early unstake penalty
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Sparkline projection */}
            {sparkData.length > 1 && (
              <div>
                <p className="section-label mb-1">Projected Earnings Curve</p>
                <ResponsiveContainer width="100%" height={50}>
                  <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stakeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PLAN_COLORS[selectedPlan]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={PLAN_COLORS[selectedPlan]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip content={() => null} />
                    <Area type="monotone" dataKey="val" stroke={PLAN_COLORS[selectedPlan]} strokeWidth={1.5}
                      fill="url(#stakeGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <button onClick={handleStake} disabled={loading || !amtNum}
              className="w-full py-3 rounded-xl text-sm font-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: plan ? PLAN_COLORS[selectedPlan] : 'var(--brand-1)', color: '#fff' }}>
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
              {loading ? 'Staking…' : `Stake ${plan?.label || ''}`}
            </button>
          </div>
        </div>

        {/* ── Right: Active positions ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Active stakes */}
          <div className="ex-card overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Active Stakes</span>
                <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--green)', display: 'inline-block' }} />
              </div>
              <span className="section-label">{activePosns.length} position{activePosns.length !== 1 ? 's' : ''}</span>
            </div>

            {activePosns.length === 0 ? (
              <div className="py-16 text-center">
                <Lock size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text3)' }} />
                <p className="text-sm font-semibold text-white">No active stakes</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Choose a plan and start earning</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {activePosns.map(pos => {
                  const col = PLAN_COLORS[pos.plan] || 'var(--brand-1)';
                  const days = daysLeft(pos.unlocks_at);
                  const progress = pos.duration_days > 0
                    ? Math.min(100, ((pos.duration_days - days) / pos.duration_days) * 100)
                    : 100;
                  const isFlexible = pos.duration_days === 0;
                  return (
                    <div key={pos.id} className="px-5 py-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${col}18`, border: `1px solid ${col}30` }}>
                            <Lock size={14} style={{ color: col }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{pos.plan.toUpperCase()} Plan</p>
                            <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
                              Staked {new Date(pos.staked_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleUnstake(pos.id)}
                          disabled={unstaking === pos.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          style={{ background: 'rgba(244,63,94,0.08)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.2)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.16)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.08)')}>
                          {unstaking === pos.id
                            ? <RefreshCw size={11} className="animate-spin" />
                            : <Unlock size={11} />}
                          Unstake
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <p className="section-label mb-0.5">Staked</p>
                          <p className="text-sm font-bold mono text-white">${pos.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="section-label mb-0.5">Earned</p>
                          <p className="text-sm font-bold mono" style={{ color: 'var(--green)' }}>+${pos.earned.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="section-label mb-0.5">APY</p>
                          <p className="text-sm font-bold mono" style={{ color: col }}>{(pos.apy * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text3)' }}>
                          <span>{isFlexible ? 'Flexible' : `${days} days left`}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={9} />
                            {isFlexible ? 'Unstake anytime' : new Date(pos.unlocks_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${progress}%`, background: col, transition: 'width 0.8s ease', height: '100%', borderRadius: 99 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* History */}
          {closedPosns.length > 0 && (
            <div className="ex-card overflow-hidden">
              <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm font-bold text-white">History</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                      {['Plan', 'Amount', 'Earned', 'APY', 'Status', 'Date'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--text3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {closedPosns.map(pos => (
                      <tr key={pos.id} className="ex-row">
                        <td className="px-4 py-3 font-bold text-white uppercase">{pos.plan}</td>
                        <td className="px-4 py-3 mono text-white">${pos.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 mono font-bold" style={{ color: 'var(--green)' }}>+${pos.earned.toFixed(4)}</td>
                        <td className="px-4 py-3 mono" style={{ color: PLAN_COLORS[pos.plan] }}>{(pos.apy * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize"
                            style={{
                              background: pos.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                              color: pos.status === 'completed' ? 'var(--green)' : 'var(--text3)',
                            }}>
                            {pos.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text3)' }}>
                          {new Date(pos.staked_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: DollarSign, color: 'var(--green)',   title: 'Daily Payouts', desc: 'Interest accrues every 24h directly to your balance' },
              { icon: Lock,       color: 'var(--brand-1)', title: 'Principal Safe', desc: 'Your staked amount is returned at the end of the term' },
              { icon: Zap,        color: 'var(--yellow)',  title: 'Auto Compound', desc: 'Earned interest is automatically added to your balance' },
            ].map(c => (
              <div key={c.title} className="ex-card p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${c.color}15`, border: `1px solid ${c.color}25` }}>
                  <c.icon size={15} style={{ color: c.color }} />
                </div>
                <p className="text-xs font-bold text-white mb-1">{c.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
