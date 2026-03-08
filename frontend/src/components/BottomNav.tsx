import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Bot, BarChart2, Menu, X,
  Settings, Users, Gift, Trophy, CreditCard, Lock,
  HelpCircle, Scale, BadgeCheck, LineChart, ArrowLeftRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MAIN_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/wallet',    icon: Wallet,           label: 'Wallet' },
  { to: '/bot',       icon: Bot,              label: 'Engine' },
  { to: '/markets',   icon: BarChart2,        label: 'Markets' },
];

const MORE_NAV = [
  { section: 'Earn', items: [
    { to: '/rewards',     icon: Gift,          label: 'Rewards' },
    { to: '/staking',     icon: Lock,          label: 'Staking' },
    { to: '/referrals',   icon: Users,         label: 'Referrals' },
    { to: '/leaderboard', icon: Trophy,        label: 'Leaderboard' },
  ]},
  { section: 'Finance', items: [
    { to: '/assets',  icon: ArrowLeftRight, label: 'Assets / Deposit' },
    { to: '/topup',   icon: CreditCard,     label: 'Buy Crypto' },
    { to: '/analytics', icon: LineChart,    label: 'Analytics' },
  ]},
  { section: 'Account', items: [
    { to: '/profile',  icon: Settings,    label: 'Settings' },
    { to: '/kyc',      icon: BadgeCheck,  label: 'KYC Verification' },
    { to: '/help',     icon: HelpCircle,  label: 'Help & FAQ' },
    { to: '/legal',    icon: Scale,       label: 'Legal & T&C' },
  ]},
];

export default function BottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleMore = (to: string) => {
    setDrawerOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)' }}
          onClick={() => setDrawerOpen(false)} />
      )}

      {/* More drawer — slides up from bottom */}
      <div className={`lg:hidden fixed left-0 right-0 z-50 rounded-t-2xl overflow-hidden transition-transform duration-300 ${
        drawerOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
        style={{
          bottom: 60,
          background: 'var(--bg2)',
          borderTop: '1px solid var(--border)',
          maxHeight: '75vh',
          overflowY: 'auto',
        }}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-3 sticky top-0"
          style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-bold text-white">Menu</p>
          <button onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--bg4)', color: 'var(--text3)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Sections */}
        <div className="p-4 space-y-4 pb-6">
          {MORE_NAV.map(({ section, items }) => (
            <div key={section}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1"
                style={{ color: 'var(--text3)' }}>{section}</p>
              <div className="grid grid-cols-2 gap-2">
                {items.map(({ to, icon: Icon, label }) => (
                  <button key={to} onClick={() => handleMore(to)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-left"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg4)' }}>
                      <Icon size={15} style={{ color: 'var(--brand-1)' }} strokeWidth={1.8} />
                    </div>
                    <span className="text-xs font-medium text-white leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Sign out */}
          <button onClick={() => { logout(); setDrawerOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-2"
            style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
            <LogOut size={15} style={{ color: 'var(--red)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--red)' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          background: 'var(--bg2)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 60,
        }}>
        {MAIN_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            style={{ minWidth: 0 }}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                    style={{ background: 'var(--brand-1)' }} />
                )}
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.6}
                  style={{ color: isActive ? 'var(--brand-1)' : 'var(--text3)' }} />
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--brand-1)' : 'var(--text3)',
                  letterSpacing: '0.02em', lineHeight: 1,
                }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More button */}
        <button onClick={() => setDrawerOpen(o => !o)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
          style={{ minWidth: 0 }}>
          {drawerOpen && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
              style={{ background: 'var(--brand-1)' }} />
          )}
          <Menu size={19} strokeWidth={drawerOpen ? 2.2 : 1.6}
            style={{ color: drawerOpen ? 'var(--brand-1)' : 'var(--text3)' }} />
          <span style={{
            fontSize: 9, fontWeight: drawerOpen ? 700 : 500,
            color: drawerOpen ? 'var(--brand-1)' : 'var(--text3)',
            letterSpacing: '0.02em', lineHeight: 1,
          }}>More</span>
        </button>
      </nav>
    </>
  );
}
