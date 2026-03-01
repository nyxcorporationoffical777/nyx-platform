import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Shield, CheckCircle, Zap, DollarSign, ArrowRight, Star, Lock, Gift } from 'lucide-react';

const TIERS = [
  { label: 'Starter',  rate: '1.80%', color: '#6b7280', bal: '$100+' },
  { label: 'Silver',   rate: '2.20%', color: '#94a3b8', bal: '$500+' },
  { label: 'Gold',     rate: '2.80%', color: '#f59e0b', bal: '$2,000+' },
  { label: 'Platinum', rate: '3.50%', color: '#06b6d4', bal: '$5,000+' },
  { label: 'Diamond',  rate: '5.00%', color: '#8b5cf6', bal: '$10,000+' },
];

const STATS = [
  { value: '124,800+', label: 'Active Users',    color: '#f59e0b' },
  { value: '$2.4M+',   label: 'Yield Paid Out',  color: '#10b981' },
  { value: '5%',       label: 'Referral Rate',   color: '#6366f1' },
  { value: '24/7',     label: 'Auto Yield',       color: '#06b6d4' },
];

const PERKS = [
  { icon: CheckCircle, text: 'Automatic daily returns — no trading needed', color: 'var(--green)' },
  { icon: Zap,         text: 'Instant VIP tier upgrades on deposit',         color: '#f59e0b' },
  { icon: Users,       text: '5% lifetime commission on every referral',     color: '#06b6d4' },
  { icon: Lock,        text: 'Two-layer account security',                    color: '#8b5cf6' },
  { icon: DollarSign,  text: 'Withdraw to crypto wallet anytime',            color: 'var(--green)' },
  { icon: Gift,        text: 'Exclusive bonuses and mission rewards',         color: '#f59e0b' },
];

export default function RefLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code) {
      sessionStorage.setItem('ref_code', code.toUpperCase());
    }
  }, [code]);

  const handleCTA = () => {
    navigate(`/register${code ? `?ref=${code.toUpperCase()}` : ''}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Nav ── */}
      <nav className="h-[60px] flex items-center justify-between px-5 sm:px-8 flex-shrink-0"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand-1)' }}>
            <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-black text-[14px] text-white tracking-[0.1em]">NYX</p>
            <p className="text-[9px] tracking-[0.08em] uppercase" style={{ color: 'var(--text3)' }}>Wealth Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login"
            className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
            style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            Sign In
          </Link>
          <button onClick={handleCTA}
            className="btn-yellow px-4 py-2 rounded-xl text-[13px] font-semibold">
            Join Free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="px-5 sm:px-8 pt-12 pb-10 max-w-4xl mx-auto text-center">

        {code && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-[12px] font-semibold"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--brand-3)' }}>
            <Gift size={13} />
            You were invited! Referral code: <span className="font-black tracking-wider text-white">{code.toUpperCase()}</span>
          </div>
        )}

        <h1 className="font-black text-white mb-4 leading-[1.1]"
          style={{ fontSize: 'clamp(28px, 6vw, 52px)', letterSpacing: '-0.04em' }}>
          Earn up to{' '}
          <span style={{ color: 'var(--brand-1)' }}>5% daily</span>
          <br />on your portfolio
        </h1>
        <p className="text-[15px] leading-relaxed mb-8 mx-auto"
          style={{ color: 'var(--text2)', maxWidth: 520 }}>
          NYX Platform automatically generates daily yield on your USDT balance using quantitative strategies.
          No trading experience required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <button onClick={handleCTA}
            className="btn-yellow w-full sm:w-auto px-8 py-3.5 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2">
            Create Free Account <ArrowRight size={16} />
          </button>
          <button onClick={copyLink}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-[14px] font-medium transition-all"
            style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            {copied ? '✓ Link Copied!' : 'Copy Invite Link'}
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {STATS.map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-[18px] font-black mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIP Tiers ── */}
      <div className="px-5 sm:px-8 pb-10 max-w-4xl mx-auto">
        <p className="section-label text-center mb-4">Yield Tiers</p>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {TIERS.map((t, i) => (
            <div key={t.label}
              className="flex items-center justify-between px-5 py-3.5"
              style={{
                borderBottom: i < TIERS.length - 1 ? '1px solid var(--border)' : 'none',
                background: 'var(--bg-card)',
              }}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <span className="text-[13px] font-semibold text-white">{t.label}</span>
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{t.bal}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="mono text-[14px] font-black" style={{ color: '#10b981' }}>{t.rate}/day</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  ~{(parseFloat(t.rate) * 30).toFixed(0)}%/mo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Perks ── */}
      <div className="px-5 sm:px-8 pb-10 max-w-4xl mx-auto">
        <p className="section-label text-center mb-4">Why NYX?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERKS.map(p => (
            <div key={p.text} className="flex items-center gap-3 rounded-xl px-4 py-3.5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p.icon size={15} strokeWidth={2} style={{ color: p.color, flexShrink: 0 }} />
              <span className="text-[13px]" style={{ color: 'var(--text2)' }}>{p.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="px-5 sm:px-8 pb-10 max-w-4xl mx-auto">
        <p className="section-label text-center mb-4">How It Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: 1, title: 'Create Account', desc: 'Register in under 60 seconds. No KYC required to start.' },
            { n: 2, title: 'Deposit USDT',   desc: 'Fund your account with $100+ to activate the Quant Engine.' },
            { n: 3, title: 'Earn Daily',      desc: 'Start the engine each day and collect your yield automatically.' },
          ].map(s => (
            <div key={s.n} className="rounded-xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[14px] text-white mb-3"
                style={{ background: 'var(--brand-1)' }}>{s.n}</div>
              <p className="text-[14px] font-bold text-white mb-1">{s.title}</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text2)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA footer ── */}
      <div className="px-5 sm:px-8 pb-16 max-w-4xl mx-auto">
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.25)' }}>
          {code && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star size={14} style={{ color: '#f59e0b' }} />
              <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
                You're joining with referral code{' '}
                <span className="font-black text-white">{code.toUpperCase()}</span>
              </p>
            </div>
          )}
          <h2 className="text-[22px] font-black text-white mb-2" style={{ letterSpacing: '-0.03em' }}>
            Ready to start earning?
          </h2>
          <p className="text-[13px] mb-5" style={{ color: 'var(--text2)' }}>
            Join 124,800+ daily earners. Create your free account in under 60 seconds.
          </p>
          <button onClick={handleCTA}
            className="btn-yellow px-10 py-3.5 rounded-xl text-[15px] font-bold inline-flex items-center gap-2">
            Get Started Free <ArrowRight size={16} />
          </button>
          <div className="flex items-center justify-center gap-5 mt-5">
            {[
              { icon: Shield, text: '256-bit AES encryption' },
              { icon: CheckCircle, text: 'Funds secured' },
              { icon: Lock, text: 'Two-layer auth' },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-1.5">
                <t.icon size={11} strokeWidth={2} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text3)', fontSize: 11 }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 sm:px-8 py-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--text3)', fontSize: 11 }}>
          © 2025 NYX Wealth Platform · Demonstrative purposes only ·{' '}
          <Link to="/legal" style={{ color: 'var(--text3)' }}>Terms</Link>
        </p>
      </div>

    </div>
  );
}
