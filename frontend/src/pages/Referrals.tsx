import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Users, Copy, CheckCircle, TrendingUp, Star, Gift, ExternalLink, Info } from 'lucide-react';
import { useToast } from '../components/Toast';
import Tooltip from '../components/Tooltip';

interface Referral {
  id: number;
  full_name: string;
  email: string;
  vip_level: string;
  total_earned: number;
  total_deposited: number;
  created_at: string;
}

const VIP_COLOR: Record<string, string> = {
  Starter: '#8888aa', Silver: '#cbd5e1', Gold: '#f5c542', Platinum: '#06b6d4', Diamond: '#a78bfa',
};

export default function Referrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [commissionRate, setCommissionRate] = useState(0.05);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchReferrals = useCallback(async () => {
    try {
      const res = await api.get('/user/referrals');
      setReferrals(res.data.referrals);
      setTotalEarnings(res.data.total_referral_earnings);
      setCommissionRate(res.data.commission_rate);
    } catch {} finally { setLoaded(true); }
  }, []);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;

  const copy = (text: string, which: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (which === 'code') {
      setCopiedCode(true);
      toast('info', 'Referral Code Copied', 'Share it with friends so they register under you.');
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      toast('info', 'Referral Link Copied', 'Send this link to friends — you earn 5% of every session they run.');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const commPct = (commissionRate * 100).toFixed(0);

  return (
    <div className="p-6 space-y-5 min-w-0 w-full fade-in">
      <div>
        <p className="section-label mb-1.5">Growth</p>
        <h1 className="font-bold text-white" style={{ fontSize: 22, letterSpacing: '-0.025em' }}>Referrals</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
          Invite friends and earn <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>{commPct}%</span> commission on every yield session they complete
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Referrals',   value: referrals.length,                suffix: ' users',  color: 'var(--yellow)', tip: 'Total number of users who registered using your referral code or link.' },
          { label: 'Active Referrals',  value: referrals.filter(r => r.total_deposited > 0).length, suffix: ' active', color: 'var(--green)', tip: 'Referrals who have made at least one deposit and are actively using the platform.' },
          { label: 'Commission Earned', value: `$${totalEarnings.toFixed(4)}`,  suffix: '',        color: '#a855f7', tip: `You earn ${commPct}% of every yield session completed by your referrals — forever, with no cap.` },
        ].map(s => (
          <div key={s.label} className="ex-card px-4 py-4">
            <div className="flex items-center gap-1 mb-2">
              <p className="section-label">{s.label}</p>
              <Tooltip content={s.tip} position="bottom">
                <Info size={9} style={{ color: 'var(--text3)', cursor: 'help' }} />
              </Tooltip>
            </div>
            <p className="text-2xl font-black mono" style={{ color: s.color }}>
              {loaded ? `${s.value}${s.suffix}` : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Tip: no referrals yet */}
      {loaded && referrals.length === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(245,197,66,0.06)', border: '1px solid rgba(245,197,66,0.15)' }}>
          <Info size={14} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--yellow)' }}>No referrals yet</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
              Copy your referral link below and share it on social media, Telegram, or with friends.
              You'll earn <strong>{commPct}%</strong> on every session they run — automatically.
            </p>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="ex-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <Gift size={13} style={{ color: 'var(--yellow)' }} />
          <span className="text-xs font-semibold text-white">How Referrals Work</span>
        </div>
        <div className="grid sm:grid-cols-3 divide-x p-0" style={{ borderColor: 'var(--border)' }}>
          {[
            { n: '01', text: 'Share your referral code or link with friends' },
            { n: '02', text: 'They register using your code and deposit funds' },
            { n: '03', text: `You automatically earn ${commPct}% of every yield session they complete` },
          ].map(s => (
            <div key={s.n} className="px-5 py-4" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xl font-black mono mb-2" style={{ color: 'rgba(240,185,11,0.2)' }}>{s.n}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Code + Link */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="ex-card p-4">
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text3)' }}>Your Referral Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2.5 rounded text-center mono font-black text-xl tracking-widest"
              style={{ background: 'var(--bg)', border: '1px solid rgba(240,185,11,0.3)', color: 'var(--yellow)' }}>
              {user?.referral_code || '—'}
            </div>
            <button onClick={() => copy(user?.referral_code || '', 'code')}
              className="btn-yellow w-10 h-10 rounded flex items-center justify-center flex-shrink-0">
              {copiedCode ? <CheckCircle size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
        <div className="ex-card p-4">
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text3)' }}>Your Referral Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded mono text-xs truncate"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              {referralLink}
            </div>
            <button onClick={() => copy(referralLink, 'link')}
              className="btn-yellow w-10 h-10 rounded flex items-center justify-center flex-shrink-0">
              {copiedLink ? <CheckCircle size={15} /> : <ExternalLink size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Referrals table */}
      <div className="ex-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <div className="flex items-center gap-2">
            <Users size={13} style={{ color: 'var(--yellow)' }} />
            <span className="text-xs font-semibold text-white">Your Referrals</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text3)' }}>{referrals.length} total</span>
        </div>

        {referrals.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto mb-2" style={{ color: 'var(--text3)', opacity: 0.3 }} />
            <p className="text-xs" style={{ color: 'var(--text3)' }}>No referrals yet — share your code to start earning</p>
          </div>
        ) : (
          <>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  {['User', 'VIP', 'Deposited', 'Their Earnings', 'Your Commission', 'Joined'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map(ref => {
                  const myComm = ref.total_earned * commissionRate;
                  const vc = VIP_COLOR[ref.vip_level] || '#848e9c';
                  return (
                    <tr key={ref.id} className="ex-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                            style={{ background: 'var(--yellow)' }}>
                            {ref.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{ref.full_name}</p>
                            <p className="text-xs" style={{ color: 'var(--text3)' }}>{ref.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 font-semibold" style={{ color: vc }}>
                          <Star size={10} />{ref.vip_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 mono font-medium text-white">${ref.total_deposited.toFixed(2)}</td>
                      <td className="px-4 py-3 mono" style={{ color: 'var(--green)' }}>${ref.total_earned.toFixed(4)}</td>
                      <td className="px-4 py-3 mono font-bold" style={{ color: 'var(--yellow)' }}>+${myComm.toFixed(4)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text3)' }}>
                        {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <TrendingUp size={12} style={{ color: 'var(--yellow)' }} />
              <span className="text-xs" style={{ color: 'var(--text3)' }}>Total commission earned:</span>
              <span className="text-xs font-bold mono" style={{ color: 'var(--yellow)' }}>${totalEarnings.toFixed(4)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
