import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { TrendingUp, Eye, EyeOff, UserPlus, Shield, CheckCircle, Users, Zap, DollarSign, Lock, Mail } from 'lucide-react';

const TIERS_REG = [
  { label: 'Starter',  rate: '1.80%', color: '#6b7280', bal: '$100+' },
  { label: 'Silver',   rate: '2.20%', color: '#94a3b8', bal: '$500+' },
  { label: 'Gold',     rate: '2.80%', color: '#f59e0b', bal: '$2,000+' },
  { label: 'Platinum', rate: '3.50%', color: '#06b6d4', bal: '$5,000+' },
  { label: 'Diamond',  rate: '5.00%', color: '#8b5cf6', bal: '$10,000+' },
];

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', referral_code: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        referral_code: form.referral_code || undefined,
      });
      setRegistered(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      setResent(true);
    } catch {}
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 overflow-y-auto"
        style={{ background: 'var(--bg2)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-8 h-[72px] flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand-1)' }}>
            <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-black text-[14px] text-white tracking-[0.1em]">NYX</p>
            <p className="text-[9px] tracking-[0.08em] uppercase" style={{ color: 'var(--text3)' }}>
              Wealth Platform
            </p>
          </div>
        </div>

        <div className="flex-1 px-10 py-10 space-y-8">
          {/* Headline */}
          <div className="fade-in-up">
            <p className="section-label mb-4">Get Started Free</p>
            <h2 className="font-bold text-white leading-[1.1] mb-4"
              style={{ fontSize: 34, letterSpacing: '-0.04em' }}>
              Join 124,800+<br />
              <span style={{ color: 'var(--brand-1)' }}>daily earners</span>
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text2)', maxWidth: 320 }}>
              Create your account and earn automatic daily returns — no trading experience required.
            </p>
          </div>

          {/* Perks */}
          <div className="space-y-3 fade-in-up-1">
            {[
              { icon: CheckCircle, text: 'No KYC required to start earning',  color: 'var(--green)'   },
              { icon: Zap,         text: 'Automatic VIP tier upgrades',       color: 'var(--yellow)'  },
              { icon: Users,       text: '5% commission on every referral',   color: 'var(--cyan)'    },
              { icon: Lock,        text: 'Dual-password account security',    color: 'var(--purple2)' },
              { icon: DollarSign,  text: 'Withdraw to crypto anytime',        color: 'var(--green)'   },
            ].map(p => (
              <div key={p.text} className="flex items-center gap-3">
                <p.icon size={14} strokeWidth={2} style={{ color: p.color, flexShrink: 0 }} />
                <span className="text-[13px]" style={{ color: 'var(--text2)' }}>{p.text}</span>
              </div>
            ))}
          </div>

          {/* VIP tiers */}
          <div className="fade-in-up-2">
            <p className="section-label mb-3">Yield Tiers</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {TIERS_REG.map((t, i) => (
                <div key={t.label}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < TIERS_REG.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg3)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{t.label}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{t.bal}</span>
                  </div>
                  <span className="mono text-[13px] font-bold" style={{ color: 'var(--green)' }}>{t.rate}/day</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-10 py-5 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text3)', fontSize: 11 }}>© 2025 Nyx Wealth Platform · Demonstrative purposes only</p>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px] fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--brand-1)' }}>
              <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <p className="font-black text-[14px] text-white tracking-[0.1em]">NYX</p>
          </div>

          {registered ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Mail size={28} style={{ color: 'var(--brand-1)' }} />
              </div>
              <div>
                <h1 className="font-bold text-white mb-2" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
                  Check your inbox
                </h1>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text2)' }}>
                  We sent a verification link to<br />
                  <span className="font-semibold text-white">{form.email}</span>
                </p>
              </div>
              <div className="rounded-xl p-4 text-left space-y-2"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                {['Check your spam/junk folder if not in inbox', 'Click the link in the email to activate', 'Link expires in 24 hours'].map(s => (
                  <div key={s} className="flex items-center gap-2.5">
                    <CheckCircle size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    <span className="text-[12px]" style={{ color: 'var(--text2)' }}>{s}</span>
                  </div>
                ))}
              </div>
              {resent && (
                <div className="text-[12px] px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  Verification email resent!
                </div>
              )}
              <button onClick={handleResend}
                className="w-full py-3 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                Resend verification email
              </button>
              <Link to="/login" className="block text-center text-[13px] font-medium transition-colors"
                style={{ color: 'var(--brand-1)' }}>
                Already verified? Sign in →
              </Link>
            </div>
          ) : (
          <>
          <div className="mb-7">
            <h1 className="font-bold text-white mb-2" style={{ fontSize: 26, letterSpacing: '-0.03em' }}>
              Create account
            </h1>
            <p className="text-[14px]" style={{ color: 'var(--text3)' }}>
              Already have one?{' '}
              <Link to="/login" className="font-semibold transition-colors"
                style={{ color: 'var(--brand-1)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--brand-1)')}>
                Sign in →
              </Link>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-[13px]"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--red)' }}>
              <Shield size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'full_name', type: 'text',  ph: 'John Doe',        req: true },
              { label: 'Email',     key: 'email',     type: 'email', ph: 'you@example.com', req: true },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="ex-input" placeholder={f.ph} required={f.req}
                />
              </div>
            ))}

            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="ex-input" style={{ paddingRight: 44 }}
                  placeholder="Min. 6 characters" required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                  {showPass ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Confirm Password</label>
              <input
                type="password" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                className="ex-input" placeholder="Repeat password" required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>
                Referral Code <span style={{ color: 'var(--text3)' }}>(optional)</span>
              </label>
              <input
                type="text" value={form.referral_code}
                onChange={e => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
                className="ex-input" placeholder="e.g. AB12CD34" maxLength={8}
              />
            </div>

            <button type="submit" disabled={loading}
              className="btn-yellow w-full py-3.5 rounded-xl flex items-center justify-center gap-2 mt-1 text-[14px]">
              {loading
                ? <div className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.25)', borderTopColor: '#fff' }} />
                : <><UserPlus size={14} strokeWidth={2} /> Create Account</>}
            </button>
          </form>

          <div className="mt-6 pt-5 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { icon: Shield,      text: '256-bit AES encryption' },
              { icon: CheckCircle, text: 'Funds secured and protected' },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2.5">
                <t.icon size={12} strokeWidth={2} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>{t.text}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] mt-4 text-center" style={{ color: 'var(--text3)' }}>
            By creating an account you agree to our Terms of Service
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
