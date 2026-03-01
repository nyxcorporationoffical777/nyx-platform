import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Eye, EyeOff, Lock, Shield, CheckCircle, ArrowRight } from 'lucide-react';

const TIERS = [
  { label: 'Starter',  rate: '1.80%', color: '#6b7280', bal: '$100+' },
  { label: 'Silver',   rate: '2.20%', color: '#94a3b8', bal: '$500+' },
  { label: 'Gold',     rate: '2.80%', color: '#f59e0b', bal: '$2,000+' },
  { label: 'Platinum', rate: '3.50%', color: '#06b6d4', bal: '$5,000+' },
  { label: 'Diamond',  rate: '5.00%', color: '#8b5cf6', bal: '$10,000+' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.needs2FA) {
        setNeeds2FA(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password, totpCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0"
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

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-10 py-12">
          <div className="fade-in-up">
            <p className="section-label mb-4">Algorithmic Yield</p>
            <h2 className="font-bold text-white leading-[1.1] mb-5"
              style={{ fontSize: 36, letterSpacing: '-0.04em' }}>
              Earn up to<br />
              <span style={{ color: 'var(--brand-1)' }}>5% daily</span><br />
              on your portfolio
            </h2>
            <p className="text-[14px] leading-relaxed mb-8" style={{ color: 'var(--text2)', maxWidth: 340 }}>
              Activate the quant engine and generate passive yield automatically — no trading experience required.
            </p>
          </div>

          {/* VIP tier table */}
          <div className="fade-in-up-1">
            <p className="section-label mb-3">Yield Tiers</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {TIERS.map((t, i) => (
                <div key={t.label}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < TIERS.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg3)' }}>
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

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--brand-1)' }}>
              <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <p className="font-black text-[14px] text-white tracking-[0.1em]">NYX</p>
          </div>

          <div className="mb-8">
            <h1 className="font-bold text-white mb-2" style={{ fontSize: 26, letterSpacing: '-0.03em' }}>
              Welcome back
            </h1>
            <p className="text-[14px]" style={{ color: 'var(--text3)' }}>
              No account?{' '}
              <Link to="/register" className="font-semibold transition-colors"
                style={{ color: 'var(--brand-1)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--brand-1)')}>
                Create one →
              </Link>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-[13px]"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--red)' }}>
              <Shield size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          {!needs2FA ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>
                  Email address
                </label>
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="ex-input"
                  placeholder="you@example.com" required />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>
                  Password
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="ex-input" style={{ paddingRight: 44 }}
                    placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                    {showPass ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-yellow w-full py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 text-[14px]">
                {loading
                  ? <div className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(255,255,255,0.25)', borderTopColor: '#fff' }} />
                  : <><Lock size={14} strokeWidth={2} /> Sign In</>}
              </button>
            </form>
          ) : (
            /* ── 2FA challenge step ── */
            <form onSubmit={handle2FA} className="space-y-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Shield size={16} style={{ color: 'var(--brand-1)', flexShrink: 0 }} />
                <div>
                  <p className="text-xs font-semibold text-white">Two-Factor Authentication</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>
                  Authenticator Code
                </label>
                <input
                  type="text" inputMode="numeric" pattern="[0-9 ]*" maxLength={7}
                  value={totpCode} onChange={e => setTotpCode(e.target.value)}
                  className="ex-input text-center text-xl font-black mono tracking-[0.3em]"
                  placeholder="000 000" required autoFocus />
              </div>
              <button type="submit" disabled={loading || totpCode.replace(/\s/g,'').length < 6}
                className="btn-yellow w-full py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 text-[14px]">
                {loading
                  ? <div className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(255,255,255,0.25)', borderTopColor: '#fff' }} />
                  : <><Shield size={14} strokeWidth={2} /> Verify &amp; Sign In</>}
              </button>
              <button type="button" onClick={() => { setNeeds2FA(false); setTotpCode(''); setError(''); }}
                className="w-full text-xs text-center py-2 transition-colors"
                style={{ color: 'var(--text3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                ← Back to login
              </button>
            </form>
          )}

          {/* Trust indicators */}
          <div className="mt-8 pt-6 space-y-2.5" style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { icon: Shield,      text: '256-bit AES encryption' },
              { icon: CheckCircle, text: 'Funds secured and protected' },
              { icon: Lock,        text: 'Two-layer authentication' },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2.5">
                <t.icon size={12} strokeWidth={2} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>{t.text}</span>
              </div>
            ))}
          </div>

          {/* Register link */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <Link to="/register"
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div>
                <p className="text-[13px] font-semibold text-white">New to Nyx?</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>Create a free account</p>
              </div>
              <ArrowRight size={15} style={{ color: 'var(--text3)' }} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
