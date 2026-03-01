import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, Zap, DollarSign, Bot, Users, TrendingUp, Trophy, CreditCard, User } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  page?: string;
  pageLabel?: string;
  tip?: string;
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Nyx! 👋',
    description: 'Nyx is a quantitative yield platform. You deposit USDT, activate the AI engine, and earn daily returns based on your VIP tier. This tour walks you through everything.',
    icon: Zap,
    iconColor: '#f0b90b',
    tip: 'The tour takes about 2 minutes. You can revisit it anytime from your Profile.',
  },
  {
    id: 'assets',
    title: 'Step 1 — Deposit USDT',
    description: 'Go to the Assets page and click "Deposit". Use the "Send via Exchange" tab to send USDT from Binance, Bybit, or any other exchange to the platform address. Then paste your TxID to confirm.',
    icon: DollarSign,
    iconColor: '#0ecb81',
    page: '/assets',
    pageLabel: 'Open Assets',
    tip: 'Minimum deposit is $100 USDT. Send TRC20 only to avoid losing funds.',
  },
  {
    id: 'vip',
    title: 'Step 2 — Your VIP Tier',
    description: 'Your deposit amount determines your VIP tier and daily yield rate. Higher deposits unlock faster returns:\n• Starter ($100+): 1.80%/day\n• Silver ($500+): 2.50%/day\n• Gold ($1,000+): 3.50%/day\n• Platinum ($5,000+): 4.20%/day\n• Diamond ($10,000+): 5.00%/day',
    icon: TrendingUp,
    iconColor: '#a855f7',
    page: '/',
    pageLabel: 'View VIP Tiers',
    tip: 'You move up tiers automatically as your balance grows.',
  },
  {
    id: 'bot',
    title: 'Step 3 — Start the Quant Engine',
    description: 'Go to the Quant Bot page. Click "Start Engine" to begin earning. The bot runs a timed session and accumulates yield every second. When the session ends, your earnings are automatically added to your balance.',
    icon: Bot,
    iconColor: '#0ecb81',
    page: '/bot',
    pageLabel: 'Open Quant Bot',
    tip: 'You need at least $100 balance to start the engine. You can run multiple sessions per day.',
  },
  {
    id: 'withdraw',
    title: 'Step 4 — Withdraw Your Earnings',
    description: 'When you\'re ready to withdraw, go to Assets → Withdraw. Enter the amount and submit the request. Your USDT will be sent to the wallet address you set in your Profile within 24–72 hours.',
    icon: DollarSign,
    iconColor: '#f6465d',
    page: '/profile',
    pageLabel: 'Set Wallet Address',
    tip: 'Set your crypto wallet address in Profile before requesting a withdrawal.',
  },
  {
    id: 'referrals',
    title: 'Step 5 — Earn with Referrals',
    description: 'Share your referral code or link with friends. When they deposit and run the bot, you automatically earn 5% commission on every yield session they complete — paid directly to your balance.',
    icon: Users,
    iconColor: '#f0b90b',
    page: '/referrals',
    pageLabel: 'View Referrals',
    tip: 'There\'s no limit on referral commissions. The more active referrals, the more you earn passively.',
  },
  {
    id: 'markets',
    title: 'Step 6 — Live Market Data',
    description: 'The Markets page shows live prices and charts for BTC, ETH, BNB, SOL, and more. Track market conditions to decide when to deposit or withdraw.',
    icon: TrendingUp,
    iconColor: '#00b8d9',
    page: '/markets',
    pageLabel: 'Open Markets',
    tip: 'Price data refreshes every few seconds.',
  },
  {
    id: 'leaderboard',
    title: 'Step 7 — Leaderboard & Bonuses',
    description: 'See the top earners on the platform and track your own rank. The Bonuses tab shows active promotions like first-deposit bonuses, VIP upgrade rewards, and loyalty streak bonuses.',
    icon: Trophy,
    iconColor: '#f0b90b',
    page: '/leaderboard',
    pageLabel: 'Open Leaderboard',
    tip: 'Complete your KYC in Profile to unlock higher withdrawal limits.',
  },
  {
    id: 'topup',
    title: 'Step 8 — Buy Crypto',
    description: 'Don\'t have USDT yet? The Buy Crypto page has direct links to the USDT withdrawal pages on all major exchanges (Binance, Bybit, OKX, KuCoin, Coinbase, Kraken).',
    icon: CreditCard,
    iconColor: '#0ecb81',
    page: '/topup',
    pageLabel: 'Buy Crypto',
    tip: 'Always use TRC20 network for lowest fees.',
  },
  {
    id: 'profile',
    title: 'Step 9 — Your Profile',
    description: 'In Profile you can: set your withdrawal wallet address, change your password, set a transaction password for extra security, complete KYC verification, and track your account stats.',
    icon: User,
    iconColor: '#848e9c',
    page: '/profile',
    pageLabel: 'Open Profile',
    tip: 'Set your wallet address before your first withdrawal request.',
  },
  {
    id: 'done',
    title: 'You\'re all set! 🎉',
    description: 'That\'s everything you need to know to start earning on Nyx. Start by depositing USDT, activating the Quant Engine, and watching your balance grow daily.',
    icon: CheckCircle,
    iconColor: '#0ecb81',
    tip: 'This tour is available anytime from Profile → "Restart Tour".',
  },
];

const STORAGE_KEY = 'nyx_tour_completed';
const STORAGE_STEP_KEY = 'nyx_tour_step';

interface Props {
  onNavigate?: (path: string) => void;
}

export default function OnboardingTour({ onNavigate }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const savedStep = parseInt(localStorage.getItem(STORAGE_STEP_KEY) || '0', 10);
    if (!completed) {
      setStep(savedStep || 0);
      // Small delay so the app renders first
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  const saveStep = useCallback((s: number) => {
    setStep(s);
    localStorage.setItem(STORAGE_STEP_KEY, String(s));
  }, []);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    localStorage.removeItem(STORAGE_STEP_KEY);
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) saveStep(step + 1);
    else complete();
  };

  const prev = () => { if (step > 0) saveStep(step - 1); };

  const skip = () => complete();

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all"
        style={{ background: 'var(--bg2)', border: '1px solid rgba(240,185,11,0.4)', color: 'var(--yellow)' }}>
        <Zap size={13} style={{ color: 'var(--yellow)' }} />
        <span className="text-xs font-bold">Platform Tour</span>
        <span className="w-5 h-5 rounded-full flex items-center justify-center font-black text-black"
          style={{ background: 'var(--yellow)', fontSize: 9 }}>{step + 1}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: 'var(--bg2)', border: '1px solid rgba(240,185,11,0.25)' }}>

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ background: 'var(--bg4)' }}>
        <div className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: 'var(--yellow)' }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <Zap size={12} style={{ color: 'var(--yellow)' }} />
        <span className="text-xs font-bold text-white flex-1">Platform Tour</span>
        <span className="text-xs mono" style={{ color: 'var(--text3)' }}>{step + 1}/{STEPS.length}</span>
        <button onClick={() => setMinimized(true)}
          className="w-5 h-5 rounded flex items-center justify-center transition-all"
          style={{ color: 'var(--text3)' }} title="Minimize">
          <span style={{ fontSize: 14, lineHeight: 1, marginTop: -2 }}>–</span>
        </button>
        <button onClick={skip}
          className="w-5 h-5 rounded flex items-center justify-center transition-all"
          style={{ color: 'var(--text3)' }} title="Skip tour">
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Icon + title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${current.iconColor}18`, border: `1px solid ${current.iconColor}30` }}>
            <Icon size={16} style={{ color: current.iconColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white leading-tight">{current.title}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs mb-3 whitespace-pre-line"
          style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
          {current.description}
        </p>

        {/* Tip */}
        {current.tip && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg mb-3"
            style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)' }}>
            <Zap size={10} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs" style={{ color: 'var(--text3)', lineHeight: 1.6 }}>{current.tip}</p>
          </div>
        )}

        {/* Navigate button */}
        {current.page && onNavigate && (
          <button onClick={() => onNavigate(current.page!)}
            className="w-full py-2 rounded-lg text-xs font-bold mb-3 flex items-center justify-center gap-1.5 transition-all"
            style={{ background: `${current.iconColor}15`, color: current.iconColor, border: `1px solid ${current.iconColor}30` }}>
            {current.pageLabel} <ChevronRight size={11} />
          </button>
        )}

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => saveStep(i)}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 16 : 6,
                height: 6,
                background: i === step ? 'var(--yellow)' : i < step ? 'rgba(240,185,11,0.4)' : 'var(--bg4)',
              }} />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          <button onClick={prev} disabled={step === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
            style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
            <ChevronLeft size={12} /> Back
          </button>
          <button onClick={next}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all"
            style={{ background: 'var(--yellow)', color: '#000' }}>
            {step === STEPS.length - 1 ? (
              <><CheckCircle size={12} /> Done!</>
            ) : (
              <>Next <ChevronRight size={12} /></>
            )}
          </button>
          {step < STEPS.length - 1 && (
            <button onClick={skip}
              className="px-3 py-2 rounded-lg text-xs transition-all"
              style={{ color: 'var(--text3)' }}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Export a hook to restart the tour programmatically
export function useRestartTour() {
  return () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_STEP_KEY);
    window.location.reload();
  };
}
