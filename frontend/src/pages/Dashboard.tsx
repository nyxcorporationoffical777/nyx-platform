import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Bot, Users, TrendingUp,
  ArrowUpRight, ArrowDownLeft, Zap, ChevronRight,
  BarChart2, Trophy, CreditCard, ArrowRight, Flame, Star,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const VIP_COLOR: Record<string, string> = {
  Starter: '#6b7280', Silver: '#94a3b8', Gold: '#f59e0b', Platinum: '#06b6d4', Diamond: '#8b5cf6',
};
const VIP_NEXT: Record<string, number> = {
  Starter: 500, Silver: 2000, Gold: 5000, Platinum: 10000, Diamond: 10000,
};

interface WalletAsset { asset: string; balance: number; usd_value: number; }
interface RecentTx { id: number; type: string; amount: number; note: string | null; created_at: string; }

const ASSET_COLORS: Record<string, string> = {
  USDT: '#26a17b', BTC: '#f7931a', ETH: '#627eea', BNB: '#f59e0b',
  SOL: '#9945ff', XRP: '#346aa9', DOGE: '#c3a634',
};
const ASSET_ICONS: Record<string, string> = {
  USDT: '₮', BTC: '₿', ETH: 'Ξ', BNB: 'B', SOL: '◎', XRP: 'X', DOGE: 'Ð',
};
const TX_COLORS: Record<string, string> = {
  deposit: 'var(--green)', withdraw: 'var(--red)', earn: 'var(--green)',
  convert: 'var(--cyan)', referral: 'var(--purple2)',
};
const PAIR_LABELS: Record<string, string> = {
  BTCUSDT: 'BTC/USDT', ETHUSDT: 'ETH/USDT', BNBUSDT: 'BNB/USDT', SOLUSDT: 'SOL/USDT',
  XRPUSDT: 'XRP/USDT', ADAUSDT: 'ADA/USDT', DOGEUSDT: 'DOGE/USDT', AVAXUSDT: 'AVAX/USDT',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [recentTxs, setRecentTxs] = useState<RecentTx[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Generate simulated balance sparkline (last 7 days)
  const sparkData = (() => {
    const base = (user?.balance ?? 500) * 0.85;
    const rate = user?.vip_info?.dailyRate ?? 0.018;
    return Array.from({ length: 8 }, (_, i) => ({
      v: parseFloat((base * Math.pow(1 + rate, i) * (1 + (Math.random() - 0.48) * 0.012)).toFixed(2))
    }));
  })();

  const vipColor = VIP_COLOR[user?.vip_level || 'Starter'];
  const nextMin = VIP_NEXT[user?.vip_level || 'Starter'];
  const vipPct = user?.vip_level === 'Diamond'
    ? 100 : Math.min(100, ((user?.balance ?? 0) / nextMin) * 100);
  const dailyEarn = (user?.balance ?? 0) * (user?.vip_info?.dailyRate ?? 0.018);

  const fetchAll = useCallback(async () => {
    try {
      const [walletRes, txRes, priceRes] = await Promise.allSettled([
        api.get('/wallet'),
        api.get('/wallet/transactions'),
        api.get('/futures/prices'),
      ]);
      if (walletRes.status === 'fulfilled') {
        setAssets(walletRes.value.data.assets || []);
        setTotalUsd(walletRes.value.data.total_usd || 0);
      }
      if (txRes.status === 'fulfilled') setRecentTxs((txRes.value.data.transactions || []).slice(0, 8));
      if (priceRes.status === 'fulfilled') setPrices(priceRes.value.data.prices || {});
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(() => {
      api.get('/futures/prices').then((r: { data: { prices: Record<string, number> } }) => setPrices(r.data.prices)).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-5 space-y-4 fade-in max-w-[1400px] mx-auto">

      {/* ══════ HERO — balance + KPIs ══════ */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-0">

          {/* Left — main balance */}
          <div className="p-6 flex-1 fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="live-dot" />
              <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                {greeting}, <span className="text-white font-semibold">{user?.full_name?.split(' ')[0]}</span>
              </p>
              {user?.vip_level && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold ml-1"
                  style={{ background: `${vipColor}18`, color: vipColor, border: `1px solid ${vipColor}30` }}>
                  {user.vip_level}
                </span>
              )}
            </div>
            <div className="flex items-end gap-3 mb-1">
              <span className="mono font-bold text-white count-in" style={{ fontSize: 44, letterSpacing: '-0.04em', lineHeight: 1 }}>
                ${(user?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-[12px]" style={{ color: 'var(--text3)' }}>Platform Balance</p>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--green)' }}>
                +${dailyEarn.toFixed(2)}/day
              </span>
            </div>

            {/* VIP progress */}
            {user?.vip_level !== 'Diamond' && (
              <div className="mt-5 max-w-[280px]">
                <div className="flex justify-between mb-1.5" style={{ fontSize: 11, color: 'var(--text3)' }}>
                  <span style={{ color: vipColor, fontWeight: 700 }}>{user?.vip_level}</span>
                  <span>${(user?.balance ?? 0).toFixed(0)} / ${nextMin.toLocaleString()} → next tier</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${vipPct}%`, background: vipColor, height: '100%', borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Right — sparkline + quick stats */}
          <div className="lg:w-72 flex flex-col" style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="px-5 pt-4 pb-2">
              <p className="section-label mb-2">7-day trend</p>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={() => null} />
                  <Area type="monotone" dataKey="v" stroke="var(--green)" strokeWidth={1.5}
                    fill="url(#sparkGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-px flex-1" style={{ background: 'var(--border)' }}>
              {[
                { label: 'Total Earned', val: `$${(user?.total_earned ?? 0).toFixed(2)}`, color: 'var(--green)',   icon: TrendingUp },
                { label: 'Daily Rate',   val: `${((user?.vip_info?.dailyRate ?? 0.018)*100).toFixed(2)}%`, color: 'var(--brand-1)', icon: Flame },
                { label: 'Referrals',    val: `$${(user?.referral_earnings ?? 0).toFixed(2)}`, color: 'var(--purple2)', icon: Users },
                { label: 'Active Days',  val: `${user?.active_days ?? 0}d`, color: 'var(--yellow)', icon: Star },
              ].map((k, i) => (
                <div key={k.label} className={`px-4 py-3 card-enter-${i+1}`}
                  style={{ background: 'var(--bg-card)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <k.icon size={10} style={{ color: k.color }} />
                    <p className="section-label" style={{ letterSpacing: '0.05em' }}>{k.label}</p>
                  </div>
                  <p className="mono font-bold text-[14px]" style={{ color: k.color }}>{k.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════ QUICK ACTIONS ══════ */}
      <div className="fade-in-up-1">
        <p className="section-label mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Deposit',    sub: 'Add USDT',     icon: ArrowDownLeft,    color: 'var(--green)',   path: '/assets' },
            { label: 'Auto Earn',  sub: 'Quant Engine', icon: Bot,              color: 'var(--yellow)',  path: '/bot'    },
            { label: 'Buy Crypto', sub: 'Top up',       icon: CreditCard,       color: 'var(--cyan)',    path: '/topup'  },
          ].map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg3)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                <a.icon size={17} style={{ color: a.color }} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white">{a.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{a.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ══════ PLATFORM MODULES ══════ */}
      <div className="fade-in-up-2">
        <p className="section-label mb-3">Platform</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Wallet',       sub: 'Multi-asset portfolio', icon: Wallet,           color: 'var(--green)',   path: '/wallet',      stat: `$${totalUsd.toFixed(2)}`,           label: 'Portfolio value' },
            { title: 'Quant Engine', sub: 'Automated yield',       icon: Bot,              color: 'var(--yellow)',  path: '/bot',         stat: user?.bot_running ? 'Running' : 'Idle', label: `${((user?.vip_info?.dailyRate ?? 0.018)*100).toFixed(2)}%/day` },
            { title: 'Markets',      sub: 'Live prices & charts',  icon: BarChart2,        color: 'var(--purple2)', path: '/markets',     stat: `$${(prices['BTCUSDT']||0).toLocaleString(undefined,{maximumFractionDigits:0})}`, label: 'BTC/USDT' },
            { title: 'Referrals',    sub: 'Invite & earn 5%',      icon: Users,            color: 'var(--cyan)',    path: '/referrals',   stat: `$${(user?.referral_earnings??0).toFixed(2)}`, label: `${user?.referral_count??0} referrals` },
            { title: 'Leaderboard',  sub: 'Missions & rewards',    icon: Trophy,           color: 'var(--orange)',  path: '/leaderboard', stat: `${user?.active_days??0}d`,          label: 'Active streak' },
          ].map((card, ci) => (
            <button key={card.path} onClick={() => navigate(card.path)}
              className={`group text-left rounded-2xl p-5 transition-all card-enter-${ci + 1}`}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg3)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <card.icon size={18} style={{ color: card.color }} strokeWidth={1.8} />
                </div>
                <ArrowRight size={14}
                  className="opacity-0 group-hover:opacity-40 transition-opacity mt-1"
                  style={{ color: 'var(--text3)' }} />
              </div>
              <p className="text-[14px] font-semibold text-white">{card.title}</p>
              <p className="text-[12px] mt-0.5 mb-4" style={{ color: 'var(--text3)' }}>{card.sub}</p>
              <p className="mono font-bold text-[16px]" style={{ color: card.color }}>{card.stat}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{card.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ══════ DATA PANELS ══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 fade-in-up-3">

        {/* ── Live Prices ── */}
        <div className="ex-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-white">Live Prices</span>
              <span className="w-1.5 h-1.5 rounded-full blink flex-shrink-0"
                style={{ background: 'var(--green)', display: 'block' }} />
            </div>
            <button onClick={() => navigate('/markets')}
              className="flex items-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: 'var(--text3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              View all <ChevronRight size={11} />
            </button>
          </div>
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 ex-row">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-3 w-14 rounded" />
                </div>
              ))
            : Object.entries(prices).slice(0, 8).map(([sym, price]) => (
                <div key={sym} className="flex items-center justify-between px-5 py-3 ex-row">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>
                    {PAIR_LABELS[sym] || sym}
                  </span>
                  <span className="mono text-[12px] font-semibold" style={{ color: 'var(--green)' }}>
                    ${price >= 1000 ? price.toLocaleString(undefined,{maximumFractionDigits:2}) : price >= 1 ? price.toFixed(3) : price.toFixed(5)}
                  </span>
                </div>
              ))
          }
        </div>

        {/* ── Portfolio ── */}
        <div className="ex-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-[13px] font-semibold text-white">Portfolio</span>
            <button onClick={() => navigate('/wallet')}
              className="flex items-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: 'var(--text3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              Wallet <ChevronRight size={11} />
            </button>
          </div>
          {assets.filter(a => a.balance > 0).length === 0 && !loading
              ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <Wallet size={22} style={{ color: 'var(--text4)' }} strokeWidth={1.5} />
                    <p className="text-[12px]" style={{ color: 'var(--text3)' }}>No assets yet</p>
                    <button onClick={() => navigate('/assets')}
                      className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all"
                      style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                      Deposit funds →
                    </button>
                  </div>
                )
              : assets.filter(a => a.balance > 0).slice(0, 7).map(a => (
                  <div key={a.asset} className="flex items-center gap-3 px-5 py-3 ex-row">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                      style={{ background: `${ASSET_COLORS[a.asset] || '#6b7280'}12`, color: ASSET_COLORS[a.asset] || '#6b7280' }}>
                      {ASSET_ICONS[a.asset] || a.asset[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white">{a.asset}</p>
                      <p className="mono text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                        {a.balance < 0.001 ? a.balance.toFixed(6) : a.balance.toFixed(4)}
                      </p>
                    </div>
                    <span className="mono text-[12px] font-semibold text-white">${a.usd_value.toFixed(2)}</span>
                  </div>
                ))
          }
        </div>

        {/* ── Recent Activity ── */}
        <div className="ex-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-[13px] font-semibold text-white">Activity</span>
            <button onClick={() => navigate('/assets')}
              className="flex items-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: 'var(--text3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              All <ChevronRight size={11} />
            </button>
          </div>
          {recentTxs.length === 0
            ? (
                <div className="py-12 flex flex-col items-center gap-2">
                  <Zap size={22} style={{ color: 'var(--text4)' }} strokeWidth={1.5} />
                  <p className="text-[12px]" style={{ color: 'var(--text3)' }}>No activity yet</p>
                </div>
              )
            : recentTxs.map(tx => {
                const txColor = TX_COLORS[tx.type] || 'var(--text2)';
                const isIn = ['deposit','earn','referral'].includes(tx.type);
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 ex-row">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                      {isIn
                        ? <ArrowDownLeft size={13} style={{ color: txColor }} strokeWidth={2} />
                        : tx.type === 'withdraw'
                          ? <ArrowUpRight size={13} style={{ color: txColor }} strokeWidth={2} />
                          : <Zap size={13} style={{ color: txColor }} strokeWidth={2} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white capitalize">
                        {tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="mono text-[12px] font-semibold" style={{ color: txColor }}>
                      {tx.type === 'withdraw' ? '-' : '+'}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })
          }
        </div>
      </div>

    </div>
  );
}
