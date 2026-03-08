import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Bot, Users, Gift, BarChart2, Settings,
} from 'lucide-react';

const BOTTOM_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/wallet',    icon: Wallet,           label: 'Wallet' },
  { to: '/bot',       icon: Bot,              label: 'Engine' },
  { to: '/markets',   icon: BarChart2,        label: 'Markets' },
  { to: '/rewards',   icon: Gift,             label: 'Rewards' },
  { to: '/referrals', icon: Users,            label: 'Refer' },
  { to: '/profile',   icon: Settings,         label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 60,
      }}>
      {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
          style={{ minWidth: 0 }}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                  style={{ background: 'var(--brand-1)' }} />
              )}
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.6}
                style={{ color: isActive ? 'var(--brand-1)' : 'var(--text3)', flexShrink: 0 }} />
              <span style={{
                fontSize: 9,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--brand-1)' : 'var(--text3)',
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
