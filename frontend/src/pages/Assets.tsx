import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, X, AlertTriangle, RefreshCw, TrendingUp, Star, Zap, Info, Send, Copy, ExternalLink, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TooltipHint from '../components/Tooltip';
import { useToast } from '../components/Toast';

interface Transaction { id: number; type: string; amount: number; status: string; note: string; created_at: string; }

const TX_META: Record<string, { label: string; color: string; sign: string }> = {
  deposit:  { label: 'Deposit',    color: 'var(--green)', sign: '+' },
  withdraw: { label: 'Withdrawal', color: 'var(--red)',   sign: '-' },
  yield:    { label: 'Yield',      color: 'var(--yellow)',sign: '+' },
  referral: { label: 'Referral',   color: '#a855f7',      sign: '+' },
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <span className="font-black text-sm text-white">{title}</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--text3)', background: 'var(--bg4)' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}><X size={14} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Assets() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [depositTab, setDepositTab] = useState<'send' | 'manual'>('send');
  const [txid, setTxid] = useState('');
  const [txidLoading, setTxidLoading] = useState(false);
  const [txidMsg, setTxidMsg] = useState('');
  const [txidError, setTxidError] = useState('');

  // Platform USDT TRC20 deposit address — must match backend PLATFORM_DEPOSIT_ADDRESS
  const PLATFORM_ADDRESS = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';
  const [platCopied, setPlatCopied] = useState(false);

  const copyPlatformAddress = () => {
    navigator.clipboard.writeText(PLATFORM_ADDRESS);
    setPlatCopied(true);
    toast('info', 'Address Copied', 'Paste it in your exchange withdrawal form as the destination.');
    setTimeout(() => setPlatCopied(false), 2500);
  };

  const submitTxid = async () => {
    setTxidError(''); setTxidMsg('');
    if (!txid.trim()) { setTxidError('Paste your transaction ID (TxID)'); return; }
    setTxidLoading(true);
    try {
      const r = await api.post('/assets/deposit-txid', { txid: txid.trim() });
      setTxidMsg(r.data.message);
      setTxid('');
      toast('success', 'Deposit Submitted', 'Your transaction is being verified. Balance updates once confirmed.');
      await refreshUser(); await fetchTx();
    } catch (e: any) {
      const err = e.response?.data?.error || 'Verification failed. Try again.';
      setTxidError(err);
      toast('error', 'Deposit Failed', err);
    } finally { setTxidLoading(false); }
  };

  const DEPOSIT_EXCHANGES = [
    { id: 'binance', name: 'Binance', initials: 'BN', color: '#f5c542', url: 'https://www.binance.com/en/my/wallet/account/main/withdrawal/crypto/USDT' },
    { id: 'bybit',   name: 'Bybit',   initials: 'BB', color: '#f97316', url: 'https://www.bybit.com/user/assets/withdraw?coin=USDT' },
    { id: 'okx',     name: 'OKX',     initials: 'OK', color: '#06b6d4', url: 'https://www.okx.com/balance/withdrawal' },
    { id: 'kucoin',  name: 'KuCoin',  initials: 'KC', color: '#22c55e', url: 'https://www.kucoin.com/assets/withdraw/USDT' },
    { id: 'coinbase',name: 'Coinbase',initials: 'CB', color: '#0052ff', url: 'https://accounts.coinbase.com/send' },
    { id: 'kraken',  name: 'Kraken',  initials: 'KR', color: '#5741d9', url: 'https://www.kraken.com/u/funding/withdraw?asset=USDT' },
  ];

  const fetchTx = useCallback(async () => {
    try { const r = await api.get('/assets/transactions'); setTransactions(r.data); } catch {}
  }, []);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTx(), refreshUser()]);
    setRefreshing(false);
  };

  const closeModal = () => { setShowDeposit(false); setShowWithdraw(false); setAmount(''); setMsg(''); setError(''); };

  const handleDeposit = async () => {
    setError(''); setMsg('');
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (Number(amount) < 100) { setError('Minimum deposit is $100'); return; }
    setLoading(true);
    try {
      const r = await api.post('/assets/deposit', { amount: Number(amount) });
      setMsg(r.data.message); setAmount('');
      toast('success', 'Deposit Recorded', `$${Number(amount).toFixed(2)} added to your balance.`);
      await refreshUser(); await fetchTx();
      setTimeout(closeModal, 1500);
    } catch (e: any) {
      const err = e.response?.data?.error || 'Failed';
      setError(err);
      toast('error', 'Deposit Failed', err);
    }
    finally { setLoading(false); }
  };

  const handleWithdraw = async () => {
    setError(''); setMsg('');
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!user?.crypto_address) {
      setError('Set a withdrawal address in Account settings first.');
      toast('warning', 'No Withdrawal Address', 'Go to Account → Withdrawal Address and add your USDT wallet.');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/assets/withdraw', { amount: Number(amount) });
      setMsg(r.data.message); setAmount('');
      toast('info', 'Withdrawal Requested', 'Your request is being reviewed. Processing takes 1–3 business days.');
      await refreshUser(); await fetchTx();
      setTimeout(closeModal, 1500);
    } catch (e: any) {
      const err = e.response?.data?.error || 'Failed';
      setError(err);
      toast('error', 'Withdrawal Failed', err);
    }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const chartData = (() => {
    let running = 0;
    return [...transactions].reverse().map(t => {
      if (['deposit','yield','referral'].includes(t.type)) running += t.amount;
      else if (t.type === 'withdraw') running = Math.max(0, running - t.amount);
      return { date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), balance: parseFloat(running.toFixed(2)) };
    });
  })();

  return (
    <div className="p-6 space-y-5 min-w-0 w-full fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1.5">Finance</p>
          <h1 className="font-bold text-white" style={{ fontSize: 22, letterSpacing: '-0.025em' }}>Assets</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>Manage your balance, deposits and withdrawals</p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--yellow)'; (e.currentTarget as HTMLElement).style.color = 'var(--yellow)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}>
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Balance',   value: (user?.balance ?? 0).toFixed(2),         color: 'var(--yellow)', prefix: '$', sub: `${user?.vip_level || 'Starter'} tier`,   tip: 'Your current spendable balance. Grows with deposits and yield sessions.',  glow: 'rgba(240,185,11,0.08)' },
          { label: 'Total Deposited', value: (user?.total_deposited ?? 0).toFixed(2), color: 'var(--green)',  prefix: '$', sub: 'All time',                               tip: 'Total amount you have deposited across all time.',                         glow: 'rgba(14,203,129,0.08)' },
          { label: 'Total Withdrawn', value: (user?.total_withdrawn ?? 0).toFixed(2), color: 'var(--red)',    prefix: '$', sub: 'All time',                               tip: 'Total amount withdrawn. Withdrawals require a verified wallet address.',   glow: 'rgba(246,70,93,0.08)' },
          { label: 'Total Earned',    value: (user?.total_earned ?? 0).toFixed(4),    color: 'var(--yellow)', prefix: '$', sub: 'Yield + referral',                      tip: 'Lifetime earnings from yield sessions and referral commissions.',          glow: 'rgba(245,197,66,0.08)' },
        ].map(c => (
          <div key={c.label} className="ex-card px-4 py-4">
            <div className="flex items-center gap-1 mb-2">
              <p className="section-label">{c.label}</p>
              <TooltipHint content={c.tip} position="bottom">
                <Info size={9} style={{ color: 'var(--text3)', cursor: 'help' }} />
              </TooltipHint>
            </div>
            <p className="font-bold mono text-xl" style={{ color: c.color }}>{c.prefix}{c.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* VIP + Daily rate info row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* VIP card */}
        <div className="ex-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,197,66,0.1)', border: '1px solid rgba(245,197,66,0.18)' }}>
            <Star size={16} style={{ color: 'var(--yellow)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Current VIP Tier</p>
            <p className="font-semibold text-sm text-white">{user?.vip_level || 'Starter'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--green)' }}>
              {((user?.vip_info?.dailyRate ?? 0.005) * 100).toFixed(2)}%/day
            </p>
          </div>
        </div>
        {/* Daily profit estimate */}
        <div className="ex-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.18)' }}>
            <TrendingUp size={16} style={{ color: 'var(--green)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Est. Daily Profit</p>
            <p className="font-semibold text-sm mono" style={{ color: 'var(--green)' }}>
              ${((user?.balance ?? 0) * (user?.vip_info?.dailyRate ?? 0.005)).toFixed(4)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>$100 min balance</p>
          </div>
        </div>
        {/* Next tier */}
        {user?.next_vip ? (
          <div className="ex-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,197,66,0.1)', border: '1px solid rgba(245,197,66,0.18)' }}>
              <Zap size={16} style={{ color: 'var(--yellow)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: 'var(--text3)' }}>Next: {user.next_vip.name}</p>
              <p className="font-semibold text-sm mono" style={{ color: 'var(--yellow)' }}>
                ${(user.next_vip.minBalance - (user.balance ?? 0)).toFixed(2)} away
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                Unlocks {(user.next_vip.dailyRate * 100).toFixed(1)}%/day
              </p>
            </div>
          </div>
        ) : (
          <div className="ex-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.18)' }}>
              <Star size={16} style={{ color: '#a855f7' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>VIP Status</p>
              <p className="font-semibold text-sm" style={{ color: '#a855f7' }}>Max Tier</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>5.0%/day</p>
            </div>
          </div>
        )}
      </div>

      {/* Deposit address notice */}
      {!user?.crypto_address && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(246,70,93,0.06)', border: '1px solid rgba(246,70,93,0.2)' }}>
          <AlertTriangle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: 'var(--red)' }}>No withdrawal address set</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
              You must add your <strong>USDT TRC-20 wallet address</strong> before you can request a withdrawal.
              {' '}<a href="/profile" className="font-bold" style={{ color: 'var(--yellow)' }}>Set it in Account →</a>
            </p>
          </div>
        </div>
      )}

      {/* First-time deposit tip */}
      {(user?.total_deposited ?? 0) === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)' }}>
          <Info size={14} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--yellow)' }}>How to start earning</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
              1. Click <strong>Deposit</strong> below → copy our USDT TRC-20 address → send from your exchange.
              &nbsp;2. Once confirmed, go to <strong>Quant Engine</strong> and start a session to earn yield.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <TooltipHint content="Send USDT (TRC-20) to our platform address. Minimum deposit: $100." position="bottom">
          <button onClick={() => { setShowDeposit(true); setError(''); setMsg(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold transition-colors"
            style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.3)', color: 'var(--green)' }}>
            <ArrowDownCircle size={14} /> Deposit
          </button>
        </TooltipHint>
        <TooltipHint content={user?.crypto_address ? 'Withdraw to your saved wallet address. Processed within 1–3 business days.' : 'Add a withdrawal address in Account settings first.'} position="bottom">
          <button onClick={() => { setShowWithdraw(true); setError(''); setMsg(''); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold transition-colors"
            style={{ background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', color: 'var(--red)' }}>
            <ArrowUpCircle size={14} /> Withdraw
          </button>
        </TooltipHint>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="ex-card p-4">
          <p className="text-xs font-semibold text-white mb-3">Balance History</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 11 }} />
              <Area type="monotone" dataKey="balance" stroke="var(--brand-1)" fill="url(#balGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction history */}
      <div className="ex-card overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white">Transaction History</span>
            <div className="flex items-center gap-1 flex-wrap">
              {['all','deposit','withdraw','yield','referral'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-2.5 py-1 rounded text-xs capitalize transition-all"
                  style={filter === f
                    ? { background: 'var(--bg4)', color: 'var(--text)', fontWeight: 600, border: '1px solid var(--border2)' }
                    : { color: 'var(--text3)', background: 'transparent', border: '1px solid transparent' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text3)' }}>No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                {['Type','Amount','Note','Status','Date & Time'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => {
                const m = TX_META[tx.type] || TX_META.deposit;
                return (
                  <tr key={tx.id} className="ex-row">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}>
                        {m.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 mono font-semibold" style={{ color: m.color }}>
                      {m.sign}${tx.amount.toFixed(4)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text2)' }}>{tx.note || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1" style={{ color: 'var(--green)' }}>
                        <CheckCircle size={11} /> {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 mono" style={{ color: 'var(--text3)' }}>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {new Date(tx.created_at).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <Modal title="Deposit USDT" onClose={closeModal}>
          {msg ? (
            <div className="text-center py-6">
              <CheckCircle size={36} className="mx-auto mb-2" style={{ color: 'var(--green)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--green)' }}>{msg}</p>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex gap-1 p-1 rounded-lg mb-4" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <button onClick={() => setDepositTab('send')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all"
                  style={depositTab === 'send'
                    ? { background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))', color: '#fff' }
                    : { color: 'var(--text2)' }}>
                  <Send size={11} /> Send via Exchange
                </button>
                <button onClick={() => setDepositTab('manual')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-all"
                  style={depositTab === 'manual'
                    ? { background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))', color: '#fff' }
                    : { color: 'var(--text2)' }}>
                  <Zap size={11} /> Manual Entry
                </button>
              </div>

              {/* ── SEND VIA EXCHANGE TAB ── */}
              {depositTab === 'send' && (
                <div className="space-y-3">

                  {/* USDT-only notice */}
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                    style={{ background: 'rgba(240,185,11,0.07)', border: '1px solid rgba(240,185,11,0.25)' }}>
                    <AlertTriangle size={12} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                      Send <strong style={{ color: 'var(--yellow)' }}>USDT TRC20 only</strong> · Min <strong style={{ color: 'var(--yellow)' }}>$100</strong> · Network: <strong style={{ color: 'var(--text)' }}>TRC20 (Tron)</strong>
                    </p>
                  </div>

                  {/* Platform deposit address */}
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 px-3 py-2"
                      style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                      <Shield size={11} style={{ color: 'var(--yellow)' }} />
                      <span className="text-xs font-bold text-white">Nyx Platform Deposit Address</span>
                      <span className="ml-auto px-1.5 py-0.5 rounded font-black text-black"
                        style={{ background: 'var(--yellow)', fontSize: 9 }}>TRC20</span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center gap-2">
                      <span className="flex-1 text-xs mono truncate" style={{ color: 'var(--text2)' }}>
                        {PLATFORM_ADDRESS}
                      </span>
                      <button onClick={copyPlatformAddress}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold flex-shrink-0 transition-all"
                        style={{
                          background: platCopied ? 'rgba(14,203,129,0.12)' : 'rgba(240,185,11,0.1)',
                          color: platCopied ? 'var(--green)' : 'var(--yellow)',
                          border: `1px solid ${platCopied ? 'rgba(14,203,129,0.35)' : 'rgba(240,185,11,0.35)'}`,
                        }}>
                        {platCopied ? <CheckCircle size={11} /> : <Copy size={11} />}
                        {platCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Exchange quick-links */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text3)' }}>Open withdrawal page on your exchange:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {DEPOSIT_EXCHANGES.map(ex => (
                        <a key={ex.id} href={ex.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                          style={{ background: `${ex.color}10`, border: `1px solid ${ex.color}30` }}>
                          <div className="w-6 h-6 rounded flex items-center justify-center font-black flex-shrink-0"
                            style={{ background: `${ex.color}22`, color: ex.color, fontSize: 9 }}>
                            {ex.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{ex.name}</p>
                            <p className="flex items-center gap-0.5" style={{ color: ex.color, fontSize: 9 }}>
                              <ExternalLink size={8} /> Send USDT
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--text3)' }}>STEP 2 — After sending</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>

                  {/* TxID submission */}
                  {txidMsg ? (
                    <div className="flex items-center gap-2 px-3 py-3 rounded-lg"
                      style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.3)' }}>
                      <CheckCircle size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--green)' }}>{txidMsg}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold" style={{ color: 'var(--text2)' }}>
                        Paste Transaction ID (TxID) to confirm deposit:
                      </label>
                      {txidError && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded text-xs"
                          style={{ background: 'rgba(246,70,93,0.08)', border: '1px solid rgba(246,70,93,0.25)', color: 'var(--red)' }}>
                          <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} /> {txidError}
                        </div>
                      )}
                      <input
                        type="text"
                        value={txid}
                        onChange={e => setTxid(e.target.value)}
                        placeholder="e.g. a1b2c3d4e5f6... (64 hex chars)"
                        className="ex-input mono"
                        style={{ fontSize: 11 }}
                        onFocus={e => e.target.style.borderColor = 'var(--yellow)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                      <p className="text-xs" style={{ color: 'var(--text3)', lineHeight: 1.6 }}>
                        After sending USDT to the address above, copy the TxID from your exchange and paste it here. We'll verify it on-chain and credit your balance automatically.
                      </p>
                      <button onClick={submitTxid} disabled={txidLoading || !txid.trim()}
                        className="w-full py-2.5 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ background: 'var(--green)', color: '#000' }}>
                        {txidLoading
                          ? <><div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Verifying on-chain...</>
                          : <><CheckCircle size={13} /> Verify & Credit Balance</>}
                      </button>
                    </div>
                  )}

                  <button onClick={closeModal} className="w-full py-2 rounded text-xs btn-outline">Close</button>
                </div>
              )}

              {/* ── MANUAL ENTRY TAB ── */}
              {depositTab === 'manual' && (
                <>
                  {error && (
                    <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded mb-4"
                      style={{ background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', color: 'var(--red)' }}>
                      <AlertTriangle size={12} /> {error}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 px-3 py-2 rounded mb-4 text-xs"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    {[{ label: 'Min deposit', val: '$100', c: 'var(--yellow)' }, { label: 'Engine unlock', val: '$100', c: 'var(--green)' }].map(r => (
                      <div key={r.label}>
                        <span style={{ color: 'var(--text3)' }}>{r.label}: </span>
                        <span className="font-bold mono" style={{ color: r.c }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Amount (USD)</label>
                    <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                      className="ex-input"
                      onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      placeholder="e.g. 500" />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[100, 500, 1000, 2000].map(v => (
                      <button key={v} onClick={() => setAmount(String(v))}
                        className="py-1.5 rounded text-xs btn-outline">${v}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={closeModal} className="flex-1 py-2.5 rounded text-xs btn-outline">Cancel</button>
                    <button onClick={handleDeposit} disabled={loading}
                      className="flex-1 py-2.5 rounded text-xs btn-yellow">
                      {loading ? 'Processing...' : 'Confirm Deposit'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </Modal>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <Modal title="Request Withdrawal" onClose={closeModal}>
          {msg ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle size={36} className="mx-auto" style={{ color: 'var(--green)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--green)' }}>{msg}</p>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>Your USDT will arrive in 24–72 hours after admin review.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded mb-4"
                  style={{ background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', color: 'var(--red)' }}>
                  <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                </div>
              )}

              {/* How it works banner */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded mb-4"
                style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.2)' }}>
                <Info size={12} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                  Withdrawals are <strong style={{ color: 'var(--yellow)' }}>request-based</strong>. Your balance is held while admin processes the request and sends USDT to your address. Processing: <strong style={{ color: 'var(--text)' }}>24–72 hours</strong>.
                </p>
              </div>

              {/* Balance + address row */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="px-3 py-2.5 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text3)' }}>Available balance</p>
                  <p className="text-sm font-bold mono" style={{ color: 'var(--yellow)' }}>${(user?.balance ?? 0).toFixed(2)}</p>
                </div>
                <div className="px-3 py-2.5 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text3)' }}>Send to</p>
                  {user?.crypto_address ? (
                    <p className="text-xs mono font-medium truncate" style={{ color: 'var(--text2)' }}>
                      {user.crypto_address.slice(0, 10)}...
                      <span className="ml-1 px-1 rounded font-bold text-black" style={{ background: 'var(--yellow)', fontSize: 9 }}>{user.crypto_network}</span>
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--red)' }}>Not set</p>
                  )}
                </div>
              </div>

              {/* Requirements checklist */}
              <div className="rounded-lg mb-4 overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-3 py-2" style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs font-bold text-white">Requirements</span>
                </div>
                <div className="px-3 py-2.5 space-y-1.5">
                  {[
                    { ok: (user?.balance ?? 0) >= 100, label: 'Balance ≥ $100', hint: `Current: $${(user?.balance ?? 0).toFixed(2)}` },
                    { ok: !user?.bot_running,           label: 'Quant Engine stopped', hint: 'Stop the bot first' },
                    { ok: !!user?.crypto_address,       label: 'Withdrawal address set', hint: 'Set in Profile' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-2 text-xs">
                      {r.ok
                        ? <CheckCircle size={11} style={{ color: 'var(--green)', flexShrink: 0 }} />
                        : <AlertTriangle size={11} style={{ color: 'var(--red)', flexShrink: 0 }} />}
                      <span style={{ color: r.ok ? 'var(--text2)' : 'var(--red)' }}>{r.label}</span>
                      {!r.ok && <span style={{ color: 'var(--text3)', marginLeft: 'auto' }}>{r.hint}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Amount (USDT)</label>
                <input type="number" min="10" max={user?.balance} value={amount} onChange={e => setAmount(e.target.value)}
                  className="ex-input"
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,197,66,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,197,66,0.07)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="e.g. 100" />
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[50, 100, 500, 1000].map(v => (
                  <button key={v} onClick={() => setAmount(String(v))}
                    className="py-1.5 rounded text-xs btn-outline" disabled={(user?.balance ?? 0) < v}>
                    ${v}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={closeModal} className="flex-1 py-2.5 rounded text-xs btn-outline">Cancel</button>
                <button onClick={handleWithdraw}
                  disabled={loading || !!user?.bot_running || (user?.balance ?? 0) < 100 || !user?.crypto_address}
                  className="flex-1 py-2.5 rounded text-xs font-bold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(246,70,93,0.15)', border: '1px solid rgba(246,70,93,0.4)', color: 'var(--red)' }}>
                  {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
