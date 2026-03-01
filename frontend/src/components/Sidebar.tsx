import { NavLink, useNavigate } from 'react-router-dom';
import {
  Wallet, Bot, Users, TrendingUp, LogOut, HelpCircle, BarChart2,
  Trophy, CreditCard, Settings, CandlestickChart,
  ArrowLeftRight, LayoutDashboard, ChevronUp, Lock, LineChart, X, BadgeCheck, Scale,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { section: 'Overview', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',   dot: '' },
  ]},
  { section: 'Finance', items: [
    { to: '/wallet',    icon: Wallet,           label: 'Wallet',      dot: '' },
    { to: '/assets',    icon: ArrowLeftRight,   label: 'Assets',      dot: '' },
    { to: '/topup',     icon: CreditCard,       label: 'Buy Crypto',  dot: '' },
  ]},
  { section: 'Markets', items: [
    { to: '/trade',     icon: CandlestickChart, label: 'Futures',     dot: '' },
    { to: '/markets',   icon: BarChart2,        label: 'Markets',     dot: '' },
    { to: '/analytics', icon: LineChart,        label: 'Analytics',   dot: '' },
  ]},
  { section: 'Earn', items: [
    { to: '/bot',         icon: Bot,     label: 'Quant Engine', dot: 'bot'  },
    { to: '/staking',     icon: Lock,    label: 'Staking',      dot: '' },
    { to: '/leaderboard', icon: Trophy,  label: 'Leaderboard',  dot: '' },
    { to: '/referrals',   icon: Users,   label: 'Referrals',    dot: '' },
  ]},
  { section: 'Account', items: [
    { to: '/profile', icon: Settings,   label: 'Settings',    dot: 'addr' },
    { to: '/kyc',     icon: BadgeCheck, label: 'KYC',         dot: 'kyc' },
    { to: '/legal',   icon: Scale,      label: 'Legal & T&C',  dot: '' },
    { to: '/help',    icon: HelpCircle, label: 'Help',         dot: '' },
  ]},
];

const VIP_COLOR: Record<string, string> = {
  Starter: '#6b7280', Silver: '#94a3b8', Gold: '#f59e0b', Platinum: '#06b6d4', Diamond: '#8b5cf6',
};
const VIP_NEXT: Record<string, number> = {
  Starter: 500, Silver: 2000, Gold: 5000, Platinum: 10000, Diamond: 10000,
};

interface SidebarProps { open?: boolean; onClose?: () => void; }

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const vipColor = VIP_COLOR[user?.vip_level || 'Starter'];
  const canRunBot = (user?.balance ?? 0) >= 100 && !user?.bot_running;
  const noAddress = !(user?.crypto_address);
  const nextMin = VIP_NEXT[user?.vip_level || 'Starter'];
  const vipPct = user?.vip_level === 'Diamond'
    ? 100 : Math.min(100, ((user?.balance ?? 0) / nextMin) * 100);

  const kycUnverified = user?.kyc_status === 'unverified' || !user?.kyc_status;
  const showDot = (dot: string) =>
    (dot === 'bot' && canRunBot) || (dot === 'addr' && noAddress) || (dot === 'kyc' && kycUnverified);
  const dotColor = (dot: string) =>
    dot === 'bot' ? 'var(--green)' : dot === 'kyc' ? 'var(--yellow)' : 'var(--red)';

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-56 flex flex-col z-40 transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{ background: 'var(--bg2)', borderRight: '1px solid var(--border)' }}
    >
      {/* ─── Logo bar ─── */}
      <div className="flex items-center gap-3 px-5 h-[60px] flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand-1)' }}>
          <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[13px] text-white tracking-[0.12em]">NYX</p>
          <p className="text-[9px] font-medium tracking-[0.08em] uppercase"
            style={{ color: 'var(--text3)' }}>Wealth Platform</p>
        </div>
        {/* Mobile close button */}
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg transition-colors"
          style={{ color: 'var(--text3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
          <X size={16} />
        </button>
      </div>

      {/* ─── User card ─── */}
      <div className="px-3 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)';
            (e.currentTarget as HTMLElement).style.background = 'var(--bg4)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLElement).style.background = 'var(--bg3)';
          }}>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
            style={{ background: vipColor }}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {user?.full_name?.split(' ')[0]}
            </p>
            <p className="text-[11px] mt-0.5 truncate font-medium" style={{ color: vipColor }}>
              {user?.vip_level}
            </p>
          </div>
          <ChevronUp size={12} className="flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity"
            style={{ color: 'var(--text3)' }} />
        </button>

        {/* Balance strip */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { label: 'Balance', val: `$${(user?.balance ?? 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, color: 'var(--text)' },
            { label: 'Est. daily', val: `+$${((user?.balance ?? 0) * (user?.vip_info?.dailyRate ?? 0.018)).toFixed(2)}`, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} className="rounded-lg px-3 py-2.5"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <p className="section-label mb-1">{s.label}</p>
              <p className="mono font-bold text-[12px]" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* VIP progress */}
        {user?.vip_level !== 'Diamond' && (
          <div className="mt-2.5 px-0.5">
            <div className="flex justify-between mb-1.5">
              <span style={{ color: 'var(--text3)', fontSize: 10 }}>{user?.vip_level}</span>
              <span style={{ color: 'var(--text3)', fontSize: 10 }}>{user?.next_vip?.name} · {vipPct.toFixed(0)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill-brand" style={{ width: `${vipPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: 'none' }}>
        {NAV.map(({ section, items }) => (
          <div key={section} className="mb-4">
            <p className="section-label px-3 mb-1.5">{section}</p>
            <div className="space-y-px">
              {items.map(({ to, icon: Icon, label, dot }) => (
                <NavLink key={to} to={to} onClick={onClose}>
                  {({ isActive }) => (
                    <div className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                      style={isActive
                        ? { background: 'var(--bg4)', color: 'var(--text)' }
                        : { color: 'var(--text2)' }}
                      onMouseEnter={e => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)';
                      }}
                      onMouseLeave={e => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}>
                      {/* Active left accent */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: 'var(--brand-1)' }} />
                      )}
                      {/* Badge dot */}
                      {showDot(dot) && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full blink"
                          style={{ background: dotColor(dot) }} />
                      )}
                      <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8}
                        style={{ color: isActive ? 'var(--brand-1)' : 'var(--text3)', flexShrink: 0 }} />
                      <span className="text-[13px] font-medium leading-none"
                        style={{ color: isActive ? 'var(--text)' : 'var(--text2)' }}>
                        {label}
                      </span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Sign out ─── */}
      <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all"
          style={{ color: 'var(--text3)', background: 'transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--red)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.06)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text3)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}>
          <LogOut size={14} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
