import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { User, Mail, Shield, TrendingUp, Calendar, Bot, CheckCircle, Star, Lock, Wallet, Copy, Users, Key, Eye, EyeOff, Zap, Gift, Clock, ScanFace, Upload, AlertTriangle, FileText, BadgeCheck, XCircle, PlayCircle, Info } from 'lucide-react';
import { useRestartTour } from '../components/OnboardingTour';
import TooltipHint from '../components/Tooltip';
import { useToast } from '../components/Toast';

const VIP_COLOR: Record<string, string> = {
  Starter: '#8888aa', Silver: '#cbd5e1', Gold: '#f5c542', Platinum: '#06b6d4', Diamond: '#a78bfa',
};
const NETWORKS = ['TRC20 (USDT)', 'ERC20 (USDT)', 'BEP20 (USDT)', 'Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)', 'BNB Smart Chain'];

const iCls = 'w-full text-xs px-3 py-2.5 rounded outline-none transition-all';
const iStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' };
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--yellow)'; };
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--border)'; };

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="ex-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <Icon size={13} style={{ color: 'var(--yellow)' }} />
        <span className="text-xs font-semibold text-white">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SuccessMsg({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded mb-3"
      style={{ background: 'rgba(14,203,129,0.08)', border: '1px solid rgba(14,203,129,0.25)', color: 'var(--green)' }}>
      <CheckCircle size={12} />{text}
    </div>
  );
}
function ErrMsg({ text }: { text: string }) {
  return (
    <div className="text-xs px-3 py-2 rounded mb-3"
      style={{ background: 'rgba(246,70,93,0.08)', border: '1px solid rgba(246,70,93,0.25)', color: 'var(--red)' }}>
      {text}
    </div>
  );
}

function SaveBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} className="btn-yellow px-4 py-2 rounded text-xs flex items-center gap-1.5">
      {loading ? <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <CheckCircle size={12} />}
      {label}
    </button>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const vipColor = VIP_COLOR[user?.vip_level || 'Starter'];
  const nextVip = user?.next_vip;
  const progress = nextVip ? Math.min(100, ((user?.balance || 0) / nextVip.minBalance) * 100) : 100;

  // Profile
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setProfileErr(''); setProfileMsg('');
    if (!profileForm.full_name.trim()) { setProfileErr('Name required'); return; }
    setProfileLoading(true);
    try {
      await api.put('/user/profile', { full_name: profileForm.full_name });
      setProfileMsg('Profile updated'); await refreshUser();
      toast('success', 'Profile Updated', 'Your display name has been saved.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: any) {
      const e = err.response?.data?.error || 'Failed';
      setProfileErr(e); toast('error', 'Update Failed', e);
    }
    finally { setProfileLoading(false); }
  };

  // Login password
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPassErr(''); setPassMsg('');
    if (passForm.new_password !== passForm.confirm) { setPassErr('Passwords do not match'); return; }
    if (passForm.new_password.length < 6) { setPassErr('Min. 6 characters'); return; }
    setPassLoading(true);
    try {
      await api.put('/user/password', { current_password: passForm.current_password, new_password: passForm.new_password });
      setPassMsg('Password updated'); setPassForm({ current_password: '', new_password: '', confirm: '' });
      toast('success', 'Password Changed', 'Your login password has been updated.');
      setTimeout(() => setPassMsg(''), 3000);
    } catch (err: any) {
      const e = err.response?.data?.error || 'Failed';
      setPassErr(e); toast('error', 'Password Change Failed', e);
    }
    finally { setPassLoading(false); }
  };

  // Transaction password
  const [txForm, setTxForm] = useState({ login_password: '', transaction_password: '', confirm: '' });
  const [txMsg, setTxMsg] = useState('');
  const [txErr, setTxErr] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [showTxPass, setShowTxPass] = useState(false);

  const saveTxPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setTxErr(''); setTxMsg('');
    if (txForm.transaction_password !== txForm.confirm) { setTxErr('Passwords do not match'); return; }
    if (txForm.transaction_password.length < 6) { setTxErr('Min. 6 characters'); return; }
    setTxLoading(true);
    try {
      await api.put('/user/transaction-password', {
        login_password: txForm.login_password,
        transaction_password: txForm.transaction_password,
      });
      setTxMsg('Transaction password set'); setTxForm({ login_password: '', transaction_password: '', confirm: '' });
      toast('success', 'Transaction Password Set', 'Used to authorise sensitive operations.');
      await refreshUser(); setTimeout(() => setTxMsg(''), 3000);
    } catch (err: any) {
      const e = err.response?.data?.error || 'Failed';
      setTxErr(e); toast('error', 'Failed', e);
    }
    finally { setTxLoading(false); }
  };

  // Crypto address
  const [cryptoForm, setCryptoForm] = useState({
    crypto_address: user?.crypto_address || '',
    crypto_network: user?.crypto_network || '',
  });
  const [cryptoMsg, setCryptoMsg] = useState('');
  const [cryptoErr, setCryptoErr] = useState('');
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveCrypto = async (e: React.FormEvent) => {
    e.preventDefault(); setCryptoErr(''); setCryptoMsg('');
    if (!cryptoForm.crypto_address.trim()) { setCryptoErr('Address required'); return; }
    if (!cryptoForm.crypto_network) { setCryptoErr('Select a network'); return; }
    setCryptoLoading(true);
    try {
      await api.put('/user/crypto', { crypto_address: cryptoForm.crypto_address, crypto_network: cryptoForm.crypto_network });
      setCryptoMsg('Address saved'); await refreshUser();
      toast('success', 'Withdrawal Address Saved', 'Withdrawals will be sent to this wallet.');
      setTimeout(() => setCryptoMsg(''), 3000);
    } catch (err: any) {
      const e = err.response?.data?.error || 'Failed';
      setCryptoErr(e); toast('error', 'Address Save Failed', e);
    }
    finally { setCryptoLoading(false); }
  };

  const copyAddress = () => {
    if (user?.crypto_address) {
      navigator.clipboard.writeText(user.crypto_address);
      setCopied(true);
      toast('info', 'Address Copied', 'Your withdrawal address is in the clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const memberDays = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)
    : 0;

  const restartTour = useRestartTour();

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<{ secret?: string; qr_code?: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [twoFAErr, setTwoFAErr] = useState('');
  const [twoFAMsg, setTwoFAMsg] = useState('');

  useEffect(() => {
    api.get('/2fa/status').then(r => setTwoFAEnabled(r.data.enabled)).catch(() => {});
  }, []);

  const startSetup2FA = async () => {
    setTwoFALoading(true); setTwoFAErr(''); setTwoFAMsg('');
    try {
      const { data } = await api.get('/2fa/setup');
      setTwoFASetup({ secret: data.secret, qr_code: data.qr_code });
      setTwoFAStep('setup');
    } catch (e: any) { setTwoFAErr(e.response?.data?.error || 'Failed'); }
    finally { setTwoFALoading(false); }
  };

  const confirm2FA = async () => {
    setTwoFALoading(true); setTwoFAErr('');
    try {
      await api.post('/2fa/enable', { code: twoFACode });
      setTwoFAEnabled(true); setTwoFAStep('idle'); setTwoFASetup(null); setTwoFACode('');
      setTwoFAMsg('2FA enabled successfully');
      toast('success', '2FA Enabled', 'Your account is now protected with TOTP.');
      setTimeout(() => setTwoFAMsg(''), 4000);
    } catch (e: any) { setTwoFAErr(e.response?.data?.error || 'Invalid code'); }
    finally { setTwoFALoading(false); }
  };

  const disable2FA = async () => {
    setTwoFALoading(true); setTwoFAErr('');
    try {
      await api.post('/2fa/disable', { code: twoFACode });
      setTwoFAEnabled(false); setTwoFAStep('idle'); setTwoFACode('');
      setTwoFAMsg('2FA disabled');
      toast('info', '2FA Disabled', 'Two-factor authentication has been turned off.');
      setTimeout(() => setTwoFAMsg(''), 4000);
    } catch (e: any) { setTwoFAErr(e.response?.data?.error || 'Invalid code'); }
    finally { setTwoFALoading(false); }
  };

  // KYC state (frontend-only UI; real backend integration can be added later)
  type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
  const [kycStatus, setKycStatus] = useState<KycStatus>('unverified');
  const [kycStep, setKycStep] = useState(1);
  const [kycDocType, setKycDocType] = useState('');
  const [kycFileName, setKycFileName] = useState('');
  const [kycSelfie, setKycSelfie] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const submitKyc = () => {
    if (!kycDocType || !kycFileName) return;
    setKycSubmitting(true);
    setTimeout(() => {
      setKycStatus('pending');
      setKycSubmitting(false);
    }, 1800);
  };

  return (
    <div className="space-y-4 min-w-0 w-full">
      <div>
        <h1 className="font-bold text-base text-white">Account</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Manage your profile, security and withdrawal settings</p>
      </div>

      {/* Account summary banner */}
      <div className="ex-card overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[
            { label: 'Balance',       value: `$${(user?.balance ?? 0).toFixed(2)}`,           color: 'var(--yellow)', icon: Wallet },
            { label: 'Total Earned',  value: `$${(user?.total_earned ?? 0).toFixed(4)}`,       color: 'var(--green)',  icon: TrendingUp },
            { label: 'Active Days',   value: `${user?.active_days ?? 0} days`,                 color: 'var(--text)',   icon: Clock },
            { label: 'Member For',    value: `${memberDays} days`,                             color: 'var(--text2)',  icon: Calendar },
          ].map((s, i) => (
            <div key={s.label} className="px-4 py-3"
              style={{
                borderRight: [0,2].includes(i) ? '1px solid var(--border)' : 'none',
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
              }}>
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon size={11} style={{ color: 'var(--text3)' }} />
                <p className="text-xs" style={{ color: 'var(--text3)' }}>{s.label}</p>
              </div>
              <p className="text-sm font-bold mono" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left Column ── */}
        <div className="space-y-4">

          {/* Profile card */}
          <div className="ex-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
                style={{ background: 'var(--yellow)' }}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate">{user?.full_name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-1.5">
                <Star size={11} style={{ color: vipColor }} />
                <span className="text-xs font-bold" style={{ color: vipColor }}>{user?.vip_level} VIP</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>
                Since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>

          {/* VIP Progress */}
          <div className="ex-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white">VIP Progress</span>
              <span className="text-xs mono font-bold" style={{ color: vipColor }}>{user?.vip_level}</span>
            </div>
            {nextVip ? (
              <>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text3)' }}>
                  <span>→ {nextVip.name}</span><span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full rounded-full h-1.5 mb-2" style={{ background: 'var(--bg4)' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${progress}%`, background: 'var(--yellow)' }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  Need <span className="font-bold text-white">${(nextVip.minBalance - (user?.balance || 0)).toFixed(2)}</span> more
                  · <span style={{ color: 'var(--green)' }}>{(nextVip.dailyRate * 100).toFixed(1)}%/day</span>
                </p>
              </>
            ) : (
              <p className="text-xs font-bold text-center" style={{ color: '#a855f7' }}>🏆 Max tier reached!</p>
            )}
          </div>

          {/* Stats */}
          <div className="ex-card overflow-hidden">
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <span className="text-xs font-semibold text-white">Account Stats</span>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { icon: TrendingUp, label: 'Total Earned',    value: `$${(user?.total_earned || 0).toFixed(4)}`,      color: 'var(--yellow)' },
                { icon: Gift,       label: 'Referral Earned', value: `$${(user?.referral_earnings || 0).toFixed(4)}`, color: '#a855f7' },
                { icon: Shield,     label: 'Deposited',       value: `$${(user?.total_deposited || 0).toFixed(2)}`,   color: 'var(--green)' },
                { icon: Zap,        label: 'Withdrawn',       value: `$${(user?.total_withdrawn || 0).toFixed(2)}`,   color: 'var(--red)' },
                { icon: Users,      label: 'Referrals',       value: `${user?.referral_count || 0} total / ${user?.active_referral_count || 0} active`, color: 'var(--text2)' },
                { icon: Bot,        label: 'Daily Rate',      value: `${((user?.vip_info?.dailyRate || 0.005) * 100).toFixed(2)}%/day`, color: 'var(--green)' },
                { icon: Calendar,   label: 'Active Days',     value: `${user?.active_days || 0}`,                     color: 'var(--text)' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-0.5">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text3)' }}>
                    <s.icon size={11} />{s.label}
                  </span>
                  <span className="text-xs font-semibold mono" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Referral code */}
          <div className="ex-card p-4">
            <p className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
              <Users size={12} style={{ color: 'var(--yellow)' }} /> Referral Code
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded mono font-black text-center tracking-widest"
                style={{ background: 'var(--bg)', border: '1px solid rgba(240,185,11,0.3)', color: 'var(--yellow)', fontSize: 16 }}>
                {user?.referral_code || '—'}
              </div>
              <button onClick={() => navigator.clipboard.writeText(user?.referral_code || '')}
                className="btn-yellow w-9 h-9 rounded flex items-center justify-center flex-shrink-0">
                <Copy size={13} />
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>
              {user?.referral_count || 0} referrals · {user?.active_referral_count || 0} active
            </p>
          </div>

          {/* Current withdrawal address */}
          {user?.crypto_address && (
            <div className="ex-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Wallet size={12} style={{ color: 'var(--yellow)' }} /> Withdrawal Address
                </p>
                <button onClick={copyAddress}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors"
                  style={{ color: copied ? 'var(--green)' : 'var(--yellow)', border: `1px solid ${copied ? 'rgba(14,203,129,0.3)' : 'rgba(240,185,11,0.3)'}` }}>
                  {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs mono break-all leading-relaxed" style={{ color: 'var(--text2)' }}>{user.crypto_address}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{user.crypto_network}</p>
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Edit Profile */}
          <SectionCard title="Edit Profile" icon={User}>
            {profileMsg && <SuccessMsg text={profileMsg} />}
            {profileErr && <ErrMsg text={profileErr} />}
            <form onSubmit={saveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Full Name</label>
                <input type="text" value={profileForm.full_name}
                  onChange={e => setProfileForm({ full_name: e.target.value })}
                  className={iCls} style={iStyle} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Email Address</label>
                <div className="relative">
                  <input type="email" value={user?.email || ''} disabled
                    className={iCls + ' opacity-40 cursor-not-allowed'} style={iStyle} />
                  <Mail size={12} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Email cannot be changed</p>
              </div>
              <SaveBtn loading={profileLoading} label="Save Changes" />
            </form>
          </SectionCard>

          {/* Withdrawal Address */}
          <SectionCard title="Withdrawal Address" icon={Wallet}>
            {cryptoMsg && <SuccessMsg text={cryptoMsg} />}
            {cryptoErr && <ErrMsg text={cryptoErr} />}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded mb-3 text-xs"
              style={{ background: 'rgba(14,203,129,0.05)', border: '1px solid rgba(14,203,129,0.15)' }}>
              <Info size={12} style={{ color: 'var(--green)', marginTop: 1, flexShrink: 0 }} />
              <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                This address is where your withdrawals will be sent. Make sure it matches the network you select.
                Double-check before saving — <strong style={{ color: 'var(--red)' }}>sending to a wrong address is irreversible.</strong>
              </p>
            </div>
            <form onSubmit={saveCrypto} className="space-y-3">
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text2)' }}>Network</label>
                  <TooltipHint content="Select the blockchain network that matches where your wallet address lives. TRC20 is recommended for USDT." position="right">
                    <Info size={10} style={{ color: 'var(--text3)', cursor: 'help' }} />
                  </TooltipHint>
                </div>
                <select value={cryptoForm.crypto_network}
                  onChange={e => setCryptoForm({ ...cryptoForm, crypto_network: e.target.value })}
                  className={iCls} style={iStyle} onFocus={onF} onBlur={onB}>
                  <option value="">Select network...</option>
                  {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Wallet Address</label>
                <input type="text" value={cryptoForm.crypto_address}
                  onChange={e => setCryptoForm({ ...cryptoForm, crypto_address: e.target.value })}
                  className={iCls} style={iStyle} onFocus={onF} onBlur={onB}
                  placeholder="e.g. TRx... / 0x... / bc1..." />
              </div>
              <SaveBtn loading={cryptoLoading} label="Save Address" />
            </form>
          </SectionCard>

          {/* Transaction Password */}
          <SectionCard title="Transaction Password" icon={Key}>
            {txMsg && <SuccessMsg text={txMsg} />}
            {txErr && <ErrMsg text={txErr} />}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded mb-3 text-xs"
              style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)' }}>
              <Shield size={12} style={{ color: 'var(--yellow)', marginTop: 1, flexShrink: 0 }} />
              <p style={{ color: 'var(--text2)' }}>
                A separate transaction password adds extra security for withdrawals.
                {user?.transaction_password
                  ? <span style={{ color: 'var(--green)' }}> ✓ Currently set.</span>
                  : <span style={{ color: 'var(--text3)' }}> Not set yet.</span>}
              </p>
            </div>
            <form onSubmit={saveTxPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Login Password (verification)</label>
                <input type="password" value={txForm.login_password}
                  onChange={e => setTxForm({ ...txForm, login_password: e.target.value })}
                  className={iCls} style={iStyle} onFocus={onF} onBlur={onB}
                  placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>New Transaction Password</label>
                <div className="relative">
                  <input type={showTxPass ? 'text' : 'password'} value={txForm.transaction_password}
                    onChange={e => setTxForm({ ...txForm, transaction_password: e.target.value })}
                    className={iCls + ' pr-9'} style={iStyle} onFocus={onF} onBlur={onB}
                    placeholder="Min. 6 characters" required />
                  <button type="button" onClick={() => setShowTxPass(!showTxPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }}>
                    {showTxPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Confirm Transaction Password</label>
                <input type="password" value={txForm.confirm}
                  onChange={e => setTxForm({ ...txForm, confirm: e.target.value })}
                  className={iCls} style={iStyle} onFocus={onF} onBlur={onB}
                  placeholder="Repeat password" required />
              </div>
              <SaveBtn loading={txLoading} label={user?.transaction_password ? 'Update Transaction Password' : 'Set Transaction Password'} />
            </form>
          </SectionCard>

          {/* Login Password */}
          <SectionCard title="Change Login Password" icon={Lock}>
            {passMsg && <SuccessMsg text={passMsg} />}
            {passErr && <ErrMsg text={passErr} />}
            <form onSubmit={savePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Current Password</label>
                <input type="password" value={passForm.current_password}
                  onChange={e => setPassForm({ ...passForm, current_password: e.target.value })}
                  className={iCls} style={iStyle} onFocus={onF} onBlur={onB}
                  placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>New Password</label>
                <div className="relative">
                  <input type={showNewPass ? 'text' : 'password'} value={passForm.new_password}
                    onChange={e => setPassForm({ ...passForm, new_password: e.target.value })}
                    className={iCls + ' pr-9'} style={iStyle} onFocus={onF} onBlur={onB}
                    placeholder="Min. 6 characters" required />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }}>
                    {showNewPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Confirm New Password</label>
                <input type="password" value={passForm.confirm}
                  onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                  className={iCls} style={iStyle} onFocus={onF} onBlur={onB}
                  placeholder="Repeat new password" required />
              </div>
              <SaveBtn loading={passLoading} label="Update Password" />
            </form>
          </SectionCard>

          {/* Platform Tour */}
          <div className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-3"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(240,185,11,0.1)', border: '1px solid rgba(240,185,11,0.2)' }}>
                <PlayCircle size={15} style={{ color: 'var(--yellow)' }} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Platform Tour</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Restart the guided intro walkthrough</p>
              </div>
            </div>
            <button onClick={restartTour}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(240,185,11,0.1)', color: 'var(--yellow)', border: '1px solid rgba(240,185,11,0.25)' }}>
              Restart Tour
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <SectionCard title="Two-Factor Authentication" icon={Shield}>
            {twoFAMsg && <SuccessMsg text={twoFAMsg} />}
            {twoFAErr && <ErrMsg text={twoFAErr} />}

            {/* Status row */}
            <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-lg"
              style={{ background: twoFAEnabled ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${twoFAEnabled ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${twoFAEnabled ? 'blink' : ''}`}
                  style={{ background: twoFAEnabled ? 'var(--green)' : 'var(--text3)' }} />
                <span className="text-xs font-semibold" style={{ color: twoFAEnabled ? 'var(--green)' : 'var(--text2)' }}>
                  {twoFAEnabled ? 'Enabled — account protected' : 'Not enabled'}
                </span>
              </div>
              {twoFAStep === 'idle' && (
                <button
                  onClick={() => twoFAEnabled ? setTwoFAStep('disable') : startSetup2FA()}
                  disabled={twoFALoading}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                  style={twoFAEnabled
                    ? { background: 'rgba(244,63,94,0.08)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.2)' }
                    : { background: 'rgba(99,102,241,0.1)', color: 'var(--brand-1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  {twoFALoading ? '…' : twoFAEnabled ? 'Disable' : 'Enable 2FA'}
                </button>
              )}
            </div>

            {/* Setup flow — scan QR */}
            {twoFAStep === 'setup' && twoFASetup && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: 'var(--text2)' }}>
                  Scan this QR code with <strong className="text-white">Google Authenticator</strong> or any TOTP app, then enter the 6-digit code to confirm.
                </p>
                <div className="flex justify-center py-2">
                  <img src={twoFASetup.qr_code} alt="2FA QR" className="rounded-xl" style={{ width: 160, height: 160, background: '#fff', padding: 8 }} />
                </div>
                <div className="px-3 py-2 rounded-lg text-center" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <p className="text-[10px] mb-1" style={{ color: 'var(--text3)' }}>Manual entry key</p>
                  <p className="mono text-xs font-bold tracking-widest text-white break-all">{twoFASetup.secret}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Verification Code</label>
                  <input type="text" inputMode="numeric" maxLength={7}
                    value={twoFACode} onChange={e => setTwoFACode(e.target.value)}
                    className={iCls + ' text-center text-lg font-black mono tracking-[0.3em]'}
                    style={iStyle} onFocus={onF} onBlur={onB}
                    placeholder="000 000" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setTwoFAStep('idle'); setTwoFASetup(null); setTwoFACode(''); setTwoFAErr(''); }}
                    className="px-3 py-2 rounded text-xs font-semibold"
                    style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    Cancel
                  </button>
                  <button onClick={confirm2FA} disabled={twoFALoading || twoFACode.replace(/\s/g, '').length < 6}
                    className="btn-yellow px-4 py-2 rounded text-xs flex items-center gap-1.5 disabled:opacity-40">
                    {twoFALoading ? <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <CheckCircle size={12} />}
                    Confirm &amp; Enable
                  </button>
                </div>
              </div>
            )}

            {/* Disable flow */}
            {twoFAStep === 'disable' && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: 'var(--text2)' }}>
                  Enter your current authenticator code to disable 2FA.
                </p>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Authenticator Code</label>
                  <input type="text" inputMode="numeric" maxLength={7}
                    value={twoFACode} onChange={e => setTwoFACode(e.target.value)}
                    className={iCls + ' text-center text-lg font-black mono tracking-[0.3em]'}
                    style={iStyle} onFocus={onF} onBlur={onB}
                    placeholder="000 000" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setTwoFAStep('idle'); setTwoFACode(''); setTwoFAErr(''); }}
                    className="px-3 py-2 rounded text-xs font-semibold"
                    style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    Cancel
                  </button>
                  <button onClick={disable2FA} disabled={twoFALoading || twoFACode.replace(/\s/g, '').length < 6}
                    className="px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                    style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.25)' }}>
                    {twoFALoading ? <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <XCircle size={12} />}
                    Disable 2FA
                  </button>
                </div>
              </div>
            )}

            {twoFAStep === 'idle' && !twoFAEnabled && (
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { label: 'TOTP Standard', desc: 'RFC 6238 compatible' },
                  { label: 'Google Auth', desc: 'Works with all TOTP apps' },
                  { label: 'Instant Enable', desc: 'Active on next login' },
                ].map(f => (
                  <div key={f.label} className="rounded-lg p-2.5 text-center"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-bold text-white">{f.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* KYC Verification */}
          <SectionCard title="KYC Verification" icon={ScanFace}>

            {/* Status banner */}
            {kycStatus === 'unverified' && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg mb-4"
                style={{ background: 'rgba(246,70,93,0.07)', border: '1px solid rgba(246,70,93,0.2)' }}>
                <XCircle size={13} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--red)' }}>Identity Not Verified</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                    Complete KYC to unlock higher withdrawal limits and full account access.
                  </p>
                </div>
              </div>
            )}
            {kycStatus === 'pending' && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg mb-4"
                style={{ background: 'rgba(240,185,11,0.07)', border: '1px solid rgba(240,185,11,0.25)' }}>
                <AlertTriangle size={13} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--yellow)' }}>Verification Under Review</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                    Your documents have been submitted. Review typically takes 1–3 business days.
                  </p>
                </div>
              </div>
            )}
            {kycStatus === 'verified' && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg mb-4"
                style={{ background: 'rgba(14,203,129,0.07)', border: '1px solid rgba(14,203,129,0.25)' }}>
                <BadgeCheck size={13} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--green)' }}>Identity Verified ✓</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                    Your account is fully verified. All features and limits are unlocked.
                  </p>
                </div>
              </div>
            )}
            {kycStatus === 'rejected' && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg mb-4"
                style={{ background: 'rgba(246,70,93,0.07)', border: '1px solid rgba(246,70,93,0.2)' }}>
                <XCircle size={13} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--red)' }}>Verification Rejected</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                    Your submission was rejected. Please re-submit with clearer documents.
                  </p>
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: BadgeCheck, label: 'Higher Limits',  sub: 'Up to $50K/day',  color: '#22c55e' },
                { icon: Shield,     label: 'Secure Account', sub: 'Full protection',  color: '#06b6d4' },
                { icon: FileText,   label: 'Full Access',    sub: 'All features',     color: '#a855f7' },
              ].map(b => (
                <div key={b.label} className="rounded-lg p-2.5 text-center"
                  style={{ background: 'var(--bg3)', border: `1px solid ${b.color}20` }}>
                  <b.icon size={14} className="mx-auto mb-1" style={{ color: b.color }} />
                  <p className="text-xs font-bold text-white">{b.label}</p>
                  <p style={{ color: 'var(--text3)', fontSize: 10 }}>{b.sub}</p>
                </div>
              ))}
            </div>

            {/* Form — only show when unverified or rejected */}
            {(kycStatus === 'unverified' || kycStatus === 'rejected') && (
              <div className="space-y-4">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-1">
                  {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center font-black text-black transition-all"
                        style={{
                          background: kycStep >= s ? 'var(--yellow)' : 'var(--bg4)',
                          color: kycStep >= s ? '#000' : 'var(--text3)',
                          fontSize: 9,
                        }}>{s}</div>
                      {s < 3 && <div className="flex-1 h-px w-6"
                        style={{ background: kycStep > s ? 'var(--yellow)' : 'var(--bg4)' }} />}
                    </div>
                  ))}
                  <span className="text-xs ml-1" style={{ color: 'var(--text3)' }}>
                    {kycStep === 1 ? 'Personal Info' : kycStep === 2 ? 'Document' : 'Selfie'}
                  </span>
                </div>

                {/* Step 1: Personal info */}
                {kycStep === 1 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>First Name</label>
                        <input type="text" className={iCls} style={iStyle} onFocus={onF} onBlur={onB} placeholder="John" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Last Name</label>
                        <input type="text" className={iCls} style={iStyle} onFocus={onF} onBlur={onB} placeholder="Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Date of Birth</label>
                      <input type="date" className={iCls} style={iStyle} onFocus={onF} onBlur={onB} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Country of Residence</label>
                      <select className={iCls} style={iStyle} onFocus={onF} onBlur={onB}>
                        <option value="">Select country...</option>
                        {['United States','United Kingdom','Germany','France','Canada','Australia','Romania','Bulgaria','Other'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => setKycStep(2)}
                      className="btn-yellow px-4 py-2 rounded text-xs flex items-center gap-1.5">
                      Continue <FileText size={12} />
                    </button>
                  </div>
                )}

                {/* Step 2: Document upload */}
                {kycStep === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Document Type</label>
                      <select value={kycDocType} onChange={e => setKycDocType(e.target.value)}
                        className={iCls} style={iStyle} onFocus={onF} onBlur={onB}>
                        <option value="">Select document...</option>
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID Card</option>
                        <option value="drivers_license">Driver's License</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Upload Document (front)</label>
                      <label className="flex flex-col items-center justify-center w-full py-6 rounded-lg cursor-pointer transition-all"
                        style={{ border: '2px dashed var(--border)', background: 'var(--bg)' }}>
                        <Upload size={18} style={{ color: 'var(--text3)', marginBottom: 6 }} />
                        <span className="text-xs font-medium" style={{ color: kycFileName ? 'var(--green)' : 'var(--text3)' }}>
                          {kycFileName || 'Click to upload (JPG, PNG, PDF)'}
                        </span>
                        <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                          onChange={e => setKycFileName(e.target.files?.[0]?.name || '')} />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setKycStep(1)}
                        className="px-4 py-2 rounded text-xs font-semibold"
                        style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                        Back
                      </button>
                      <button onClick={() => setKycStep(3)} disabled={!kycDocType || !kycFileName}
                        className="btn-yellow px-4 py-2 rounded text-xs flex items-center gap-1.5 disabled:opacity-40">
                        Continue <ScanFace size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Selfie */}
                {kycStep === 3 && (
                  <div className="space-y-3">
                    <div className="rounded-lg p-3 text-xs"
                      style={{ background: 'rgba(0,184,217,0.06)', border: '1px solid rgba(0,184,217,0.2)', color: 'var(--text2)', lineHeight: 1.7 }}>
                      Take a clear selfie holding your ID document next to your face. Ensure both your face and document are clearly visible.
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Upload Selfie with Document</label>
                      <label className="flex flex-col items-center justify-center w-full py-6 rounded-lg cursor-pointer transition-all"
                        style={{ border: '2px dashed var(--border)', background: 'var(--bg)' }}>
                        <ScanFace size={22} style={{ color: 'var(--text3)', marginBottom: 6 }} />
                        <span className="text-xs font-medium" style={{ color: kycSelfie ? 'var(--green)' : 'var(--text3)' }}>
                          {kycSelfie || 'Click to upload selfie (JPG, PNG)'}
                        </span>
                        <input type="file" className="hidden" accept=".jpg,.jpeg,.png"
                          onChange={e => setKycSelfie(e.target.files?.[0]?.name || '')} />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setKycStep(2)}
                        className="px-4 py-2 rounded text-xs font-semibold"
                        style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                        Back
                      </button>
                      <button onClick={submitKyc} disabled={kycSubmitting}
                        className="btn-yellow px-4 py-2 rounded text-xs flex items-center gap-1.5 disabled:opacity-60">
                        {kycSubmitting
                          ? <><div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Submitting...</>
                          : <><Upload size={12} /> Submit for Review</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
