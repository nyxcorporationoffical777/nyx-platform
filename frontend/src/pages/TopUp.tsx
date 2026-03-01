import { useState } from 'react';
import { ExternalLink, Shield, DollarSign, Copy, CheckCircle, ArrowRight, Send, AlertTriangle, Info, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const EXCHANGES = [
  {
    id: 'binance',
    name: 'Binance',
    initials: 'BN',
    tagline: 'World\'s #1 Exchange',
    color: '#f5c542',
    badge: 'MOST POPULAR',
    badgeColor: '#f5c542',
    // Direct USDT withdrawal page
    url: 'https://www.binance.com/en/my/wallet/account/main/withdrawal/crypto/USDT',
    fee: '~1 USDT flat',
    networks: ['TRC20', 'ERC20', 'BEP20'],
    rating: 5,
    instant: true,
  },
  {
    id: 'bybit',
    name: 'Bybit',
    initials: 'BB',
    tagline: 'Low Fees, High Speed',
    color: '#f7a600',
    badge: 'LOW FEES',
    badgeColor: '#f7a600',
    // Direct USDT withdrawal page
    url: 'https://www.bybit.com/user/assets/withdraw?coin=USDT',
    fee: '~1 USDT flat',
    networks: ['TRC20', 'ERC20', 'BEP20'],
    rating: 5,
    instant: true,
  },
  {
    id: 'okx',
    name: 'OKX',
    initials: 'OK',
    tagline: 'Global Web3 Exchange',
    color: '#06b6d4',
    badge: 'WEB3',
    badgeColor: '#06b6d4',
    // Direct OKX withdrawal
    url: 'https://www.okx.com/balance/withdrawal',
    fee: '~1 USDT flat',
    networks: ['TRC20', 'ERC20', 'BEP20'],
    rating: 4,
    instant: true,
  },
  {
    id: 'kucoin',
    name: 'KuCoin',
    initials: 'KC',
    tagline: 'The People\'s Exchange',
    color: '#22c55e',
    badge: 'P2P',
    badgeColor: '#22c55e',
    // Direct USDT withdrawal
    url: 'https://www.kucoin.com/assets/withdraw/USDT',
    fee: '~2 USDT flat',
    networks: ['TRC20', 'ERC20', 'BEP20'],
    rating: 4,
    instant: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    initials: 'CB',
    tagline: 'US-Regulated & Trusted',
    color: '#0052ff',
    badge: 'REGULATED',
    badgeColor: '#0052ff',
    // Coinbase send page
    url: 'https://accounts.coinbase.com/send',
    fee: '~2–5 USDT',
    networks: ['ERC20'],
    rating: 4,
    instant: true,
  },
  {
    id: 'kraken',
    name: 'Kraken',
    initials: 'KR',
    tagline: 'Trusted Since 2011',
    color: '#5741d9',
    badge: 'SECURE',
    badgeColor: '#5741d9',
    // Kraken USDT withdrawal
    url: 'https://www.kraken.com/u/funding/withdraw?asset=USDT',
    fee: '~2 USDT flat',
    networks: ['TRC20', 'ERC20'],
    rating: 4,
    instant: false,
  },
];

const STEPS = [
  { n: 1, icon: DollarSign, color: '#f5c542', title: 'Log in to your exchange', desc: 'Open your exchange account. Make sure you have USDT available.' },
  { n: 2, icon: Send,       color: '#22c55e', title: 'Click "Send USDT" below',  desc: 'Use the direct button — it takes you straight to the USDT withdrawal form.' },
  { n: 3, icon: Copy,       color: '#06b6d4', title: 'Paste your Nyx address',   desc: 'Copy your Nyx deposit address below and paste it as recipient.' },
  { n: 4, icon: CheckCircle,color: '#a78bfa', title: 'Confirm & earn',           desc: 'Submit the transfer. Funds arrive within minutes and yield starts immediately.' },
];

export default function TopUp() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (user?.crypto_address) {
      navigator.clipboard.writeText(user.crypto_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-w-0 w-full p-5 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <Send size={16} style={{ color: 'var(--yellow)' }} />
            Send USDT to Nyx
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
            Withdraw USDT from your exchange directly to your Nyx deposit address
          </p>
        </div>
        <Link to="/assets"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold"
          style={{ background: 'var(--yellow)', color: '#000' }}>
          View Assets <ArrowRight size={12} />
        </Link>
      </div>

      {/* USDT-only warning */}
      <div className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: 'rgba(240,185,11,0.07)', border: '1px solid rgba(240,185,11,0.3)' }}>
        <AlertTriangle size={15} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-xs font-bold text-white mb-1">Send USDT Only — Other coins will be lost</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
            Nyx only accepts <strong style={{ color: 'var(--yellow)' }}>USDT (Tether)</strong> deposits.
            Supported networks: <strong style={{ color: 'var(--text)' }}>TRC20 · ERC20 · BEP20</strong>.
            Minimum deposit: <strong style={{ color: 'var(--yellow)' }}>$100 USDT</strong>.
            Crypto transfers are irreversible — always double-check the address.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="ex-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <Info size={12} style={{ color: 'var(--yellow)' }} />
          <span className="text-xs font-bold text-white">How to send USDT in 4 steps</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="p-4"
              style={{ borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-4 h-4 rounded-full flex items-center justify-center font-black flex-shrink-0 text-black"
                  style={{ background: s.color, fontSize: 9 }}>{s.n}</span>
                <p className="text-xs font-bold text-white">{s.title}</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text3)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit address */}
      <div className="ex-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <Shield size={12} style={{ color: 'var(--yellow)' }} />
          <span className="text-xs font-bold text-white">Your Nyx USDT Deposit Address</span>
          {user?.crypto_network && (
            <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold text-black"
              style={{ background: 'var(--yellow)', fontSize: 9 }}>
              {user.crypto_network}
            </span>
          )}
        </div>
        <div className="p-4">
          {user?.crypto_address ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 rounded-lg px-4 py-3 mono text-xs font-medium break-all"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', letterSpacing: '0.02em' }}>
                {user.crypto_address}
              </div>
              <button onClick={copyAddress}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold flex-shrink-0 transition-all"
                style={{
                  background: copied ? 'rgba(14,203,129,0.12)' : 'rgba(240,185,11,0.1)',
                  color: copied ? 'var(--green)' : 'var(--yellow)',
                  border: `1px solid ${copied ? 'rgba(14,203,129,0.35)' : 'rgba(240,185,11,0.35)'}`,
                  minWidth: 90,
                }}>
                {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                No deposit address set yet.
              </p>
              <Link to="/profile"
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
                style={{ background: 'var(--yellow)', color: '#000' }}>
                Set in Profile <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Exchange list header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-white">Send USDT From Your Exchange</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Each button opens the USDT withdrawal page directly</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(14,203,129,0.08)', border: '1px solid rgba(14,203,129,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--green)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--green)' }}>USDT direct links</span>
        </div>
      </div>

      {/* Exchange cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {EXCHANGES.map(ex => (
          <div key={ex.id} className="rounded-xl overflow-hidden transition-all"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>

            {/* Color stripe */}
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${ex.color}, ${ex.color}44)` }} />

            <div className="p-4 flex flex-col gap-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${ex.color}20`, color: ex.color, border: `1px solid ${ex.color}35` }}>
                    {ex.initials}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{ex.name}</p>
                    <p style={{ color: 'var(--text3)', fontSize: 10 }}>{ex.tagline}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded font-black"
                  style={{ background: `${ex.badgeColor}18`, color: ex.badgeColor, border: `1px solid ${ex.badgeColor}35`, fontSize: 9 }}>
                  {ex.badge}
                </span>
              </div>

              {/* Info row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg3)' }}>
                  <p style={{ color: 'var(--text3)', fontSize: 10 }}>Withdrawal fee</p>
                  <p className="text-xs font-bold text-white mt-0.5">{ex.fee}</p>
                </div>
                <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg3)' }}>
                  <p style={{ color: 'var(--text3)', fontSize: 10 }}>Speed</p>
                  <p className="text-xs font-bold mt-0.5"
                    style={{ color: ex.instant ? 'var(--green)' : 'var(--text2)' }}>
                    {ex.instant ? '⚡ Instant' : '~1–24h'}
                  </p>
                </div>
              </div>

              {/* Networks */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {ex.networks.map(n => (
                  <span key={n} className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ background: `${ex.color}12`, color: ex.color, border: `1px solid ${ex.color}25` }}>
                    {n}
                  </span>
                ))}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={10} style={{ color: i <= ex.rating ? 'var(--yellow)' : 'var(--bg4)', fill: i <= ex.rating ? 'var(--yellow)' : 'var(--bg4)' }} />
                  ))}
                </div>
                <span style={{ color: 'var(--text3)', fontSize: 10 }}>{ex.rating}.0 / 5</span>
              </div>

              {/* CTA button */}
              <a href={ex.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: `${ex.color}18`, border: `1px solid ${ex.color}40`, color: ex.color }}>
                <span className="flex items-center gap-1.5">
                  <Send size={11} /> Send USDT via {ex.name}
                </span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <Shield size={13} style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text3)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text2)' }}>Disclaimer:</strong> Nyx is not affiliated with any exchange listed above.
          Links redirect to external platforms. Always verify the recipient address before confirming.
          Min. deposit is <strong style={{ color: 'var(--text2)' }}>$100 USDT</strong>. Transactions are irreversible.
        </p>
      </div>

    </div>
  );
}
