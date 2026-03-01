import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Zap, DollarSign, ArrowDownLeft, ArrowUpRight, CheckCheck, Trash2, X, Settings, ChevronDown, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const VIP_COLOR: Record<string, string> = {
  Starter: '#6b7280', Silver: '#94a3b8', Gold: '#f59e0b', Platinum: '#06b6d4', Diamond: '#8b5cf6',
};

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard', '/wallet': 'Wallet', '/assets': 'Assets',
  '/markets': 'Markets', '/bot': 'Quant Engine',
  '/leaderboard': 'Leaderboard', '/referrals': 'Referrals',
  '/staking': 'Staking', '/analytics': 'Analytics',
  '/kyc': 'KYC Verification',
  '/legal': 'Legal & Terms of Service',
  '/profile': 'Settings', '/help': 'Help', '/topup': 'Buy Crypto',
  '/rewards': 'Rewards Center',
};

const NOTIF_ICON: Record<string, React.ReactNode> = {
  deposit:   <ArrowDownLeft size={13} style={{ color: 'var(--green)' }} />,
  withdraw:  <ArrowUpRight  size={13} style={{ color: 'var(--red)' }} />,
  bot_start: <Zap           size={13} style={{ color: 'var(--brand-1)' }} />,
  bot_stop:  <DollarSign    size={13} style={{ color: 'var(--green)' }} />,
};

interface Notification {
  id: number; type: string; title: string; message: string; read: number; created_at: string;
}

interface HeaderProps { onMenuClick?: () => void; }

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'NYX';
  const vipColor = VIP_COLOR[user?.vip_level || 'Starter'];

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications);
      setUnread(data.unread);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 12000);
    return () => clearInterval(t);
  }, [fetchNotifs]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => { await api.put('/notifications/read-all'); fetchNotifs(); };
  const clearAll = async () => { await api.delete('/notifications/clear'); setNotifs([]); setUnread(0); };
  const handleLogout = () => { logout(); navigate('/'); };

  const timeAgo = (d: string) => {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return `${Math.floor(s)}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <header className="sticky top-0 z-30 h-[60px] flex items-center justify-between px-6"
      style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>

      {/* ── Left: hamburger + page title ── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
          <Menu size={16} strokeWidth={1.8} />
        </button>
        <h1 className="text-[15px] font-semibold text-white tracking-[-0.02em]">{pageTitle}</h1>
        {user?.bot_running && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--green)', display: 'block' }} />
            <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 600 }}>Bot Running</span>
          </div>
        )}
      </div>

      {/* ── Right: balance + bell + profile ── */}
      <div className="flex items-center gap-2">

        {/* Balance display */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <div>
            <p className="section-label mb-0.5">Portfolio</p>
            <p className="mono font-bold text-[13px] text-white">
              ${(user?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
          <div>
            <p className="section-label mb-0.5">Est. today</p>
            <p className="mono font-bold text-[13px]" style={{ color: 'var(--green)' }}>
              +${((user?.balance ?? 0) * (user?.vip_info?.dailyRate ?? 0.018)).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button onClick={() => { setBellOpen(o => !o); if (!bellOpen) fetchNotifs(); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: bellOpen ? 'var(--bg4)' : 'var(--bg3)',
              border: '1px solid var(--border)',
              color: 'var(--text2)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
            <Bell size={15} strokeWidth={1.8} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'var(--red)', color: '#fff', fontSize: 7 }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50 fade-in panel">
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-white">Notifications</span>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ background: 'var(--red)', fontSize: 9 }}>{unread}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text3)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                      <CheckCheck size={13} />
                    </button>
                  )}
                  {notifs.length > 0 && (
                    <button onClick={clearAll} className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text3)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button onClick={() => setBellOpen(false)} className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                    <X size={13} />
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell size={20} className="mx-auto mb-3" style={{ color: 'var(--text4)' }} />
                    <p className="text-[13px]" style={{ color: 'var(--text3)' }}>All caught up</p>
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 ex-row cursor-default"
                    style={{ background: !n.read ? 'rgba(99,102,241,0.04)' : 'transparent' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      {NOTIF_ICON[n.type] ?? <Bell size={13} style={{ color: 'var(--text3)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-semibold text-white leading-snug">{n.title}</p>
                        <span style={{ color: 'var(--text3)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text2)' }}>{n.message}</p>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                        style={{ background: 'var(--brand-1)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile button */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => { setProfileOpen(o => !o); setBellOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
            style={{
              background: profileOpen ? 'var(--bg4)' : 'var(--bg3)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
            {user?.avatar
              ? <img src={user.avatar} alt="av" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: vipColor }}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
            }
            <div className="hidden sm:block text-left">
              <p className="text-[12px] font-semibold text-white leading-none">
                {user?.full_name?.split(' ')[0]}
              </p>
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: vipColor }}>
                {user?.vip_level}
              </p>
            </div>
            <ChevronDown size={12}
              className={`hidden sm:block transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text3)' }} />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden z-50 fade-in panel">
              {/* User info */}
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  {user?.avatar
                    ? <img src={user.avatar} alt="av" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: vipColor }}>
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{user?.full_name}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text3)' }}>{user?.email}</p>
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'Balance', v: `$${(user?.balance ?? 0).toFixed(2)}`, c: 'var(--text)' },
                    { l: 'Earned',  v: `$${(user?.total_earned ?? 0).toFixed(2)}`, c: 'var(--green)' },
                  ].map(s => (
                    <div key={s.l} className="rounded-lg px-2.5 py-2"
                      style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <p className="section-label mb-1">{s.l}</p>
                      <p className="mono font-bold text-[12px]" style={{ color: s.c }}>{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="py-1.5">
                {[
                  { label: 'Settings', path: '/profile', icon: Settings },
                ].map(item => (
                  <button key={item.path}
                    onClick={() => { navigate(item.path); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: 'transparent', color: 'var(--text2)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <item.icon size={14} strokeWidth={1.8} />
                    <span className="text-[13px]">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => { handleLogout(); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
