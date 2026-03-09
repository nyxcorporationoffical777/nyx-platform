import { useState, useEffect, useCallback } from 'react';
import { Wallet as WalletIcon, Copy, RefreshCw, ArrowUpRight, ArrowDownLeft, TrendingUp, ChevronRight, CheckCircle, ArrowLeftRight, ArrowDownCircle, ArrowUpCircle, Clock, AlertTriangle, Star, Zap, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import TooltipHint from '../components/Tooltip';
import { DepositModal, WithdrawModal } from './WalletModals';

interface Asset {
  id: number; user_id: number; asset: string; balance: number;
  total_deposited: number; total_withdrawn: number;
  usd_value: number; deposit_address: string | null; network: string | null;
}
interface Tx {
  id: number; type: string; amount: number; note: string | null; status: string; created_at: string;
}

const ASSET_COLORS: Record<string, string> = {
  USDT: '#26a17b', BTC: '#f7931a', ETH: '#627eea', BNB: '#f5c542',
  SOL: '#9945ff', XRP: '#346aa9', DOGE: '#c3a634',
};
const ASSET_ICONS: Record<string, string> = {
  USDT: '₮', BTC: '₿', ETH: 'Ξ', BNB: 'BNB', SOL: '◎', XRP: 'XRP', DOGE: 'Ð',
};

const TX_COLORS: Record<string, string> = {
  deposit: 'var(--green)', withdraw: 'var(--red)', earn: 'var(--green)',
  convert: '#06b6d4', referral: '#a78bfa', trade_close: 'var(--yellow)',
};

const TX_META: Record<string, { label: string; color: string; sign: string }> = {
  deposit:  { label: 'Deposit',    color: 'var(--green)', sign: '+' },
  withdraw: { label: 'Withdrawal', color: 'var(--red)',   sign: '-' },
  yield:    { label: 'Yield',      color: 'var(--yellow)',sign: '+' },
  referral: { label: 'Referral',   color: '#a855f7',      sign: '+' },
};

const DEPOSIT_EXCHANGES = [
  { id: 'binance', name: 'Binance', initials: 'BN', color: '#f5c542', url: 'https://www.binance.com/en/my/wallet/account/main/withdrawal/crypto/USDT' },
  { id: 'bybit',   name: 'Bybit',   initials: 'BB', color: '#f97316', url: 'https://www.bybit.com/user/assets/withdraw?coin=USDT' },
  { id: 'okx',     name: 'OKX',     initials: 'OK', color: '#06b6d4', url: 'https://www.okx.com/balance/withdrawal' },
  { id: 'kucoin',  name: 'KuCoin',  initials: 'KC', color: '#22c55e', url: 'https://www.kucoin.com/assets/withdraw/USDT' },
  { id: 'coinbase',name: 'Coinbase',initials: 'CB', color: '#0052ff', url: 'https://accounts.coinbase.com/send' },
  { id: 'kraken',  name: 'Kraken',  initials: 'KR', color: '#5741d9', url: 'https://www.kraken.com/u/funding/withdraw?asset=USDT' },
];

// Platform USDT TRC20 deposit address
const PLATFORM_ADDRESS = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';

export default function Wallet() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'portfolio'|'transactions'|'convert'>('portfolio');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [copied, setCopied] = useState('');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);

  // Convert state
  const [fromAsset, setFromAsset] = useState('USDT');
  const [toAsset, setToAsset] = useState('BTC');
  const [convertAmount, setConvertAmount] = useState('');
  const [converting, setConverting] = useState(false);

  // Assets/deposit/withdraw state
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [depositTab, setDepositTab] = useState<'send' | 'manual'>('send');
  const [txid, setTxid] = useState('');
  const [txidLoading, setTxidLoading] = useState(false);
  const [txidMsg, setTxidMsg] = useState('');
  const [txidError, setTxidError] = useState('');
  const [platCopied, setPlatCopied] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await api.get('/wallet');
      setAssets(data.assets);
      setTotalUsd(data.total_usd);
      if (!selectedAsset && data.assets.length > 0) {
        setSelectedAsset(data.assets.find((a: Asset) => a.asset === 'USDT') || data.assets[0]);
      }
    } catch {
      toast('error', 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [selectedAsset, toast]);

  const fetchTx = useCallback(async () => {
    try { const r = await api.get('/assets/transactions'); setTxs(r.data); } catch {}
  }, []);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWallet(), fetchTx()]);
    setRefreshing(false);
  };

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
      await fetchWallet(); await fetchTx();
    } catch (e: any) {
      const err = e.response?.data?.error || 'Verification failed. Try again.';
      setTxidError(err);
      toast('error', 'Deposit Failed', err);
    } finally { setTxidLoading(false); }
  };

  const handleDeposit = async () => {
    setError(''); setMsg('');
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (Number(amount) < 100) { setError('Minimum deposit is $100'); return; }
    setLoading(true);
    try {
      const r = await api.post('/assets/deposit', { amount: Number(amount) });
      setMsg(r.data.message); setAmount('');
      toast('success', 'Deposit Recorded', `$${Number(amount).toFixed(2)} added to your balance.`);
      await fetchWallet(); await fetchTx();
      setTimeout(() => { setShowDeposit(false); setAmount(''); setMsg(''); setError(''); }, 1500);
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
      await fetchWallet(); await fetchTx();
      setTimeout(() => { setShowWithdraw(false); setAmount(''); setMsg(''); setError(''); }, 1500);
    } catch (e: any) {
      const err = e.response?.data?.error || 'Failed';
      setError(err);
      toast('error', 'Withdrawal Failed', err);
    }
    finally { setLoading(false); }
  };

  const closeModal = () => { 
    setShowDeposit(false); 
    setShowWithdraw(false); 
    setAmount(''); 
    setMsg(''); 
    setError(''); 
    setTxid(''); 
    setTxidError(''); 
    setTxidMsg('');
  };

  const fetchTxs = useCallback(async () => {
    try {
      const { data } = await api.get('/wallet/transactions');
      setTxs(data.transactions);
    } catch {}
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchTxs();
    const t = setInterval(fetchWallet, 15000);
    return () => clearInterval(t);
  }, [fetchWallet, fetchTxs]);

  const copyAddress = (addr: string, asset: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(asset);
    toast('success', 'Address copied!', addr.slice(0, 20) + '...');
    setTimeout(() => setCopied(''), 2000);
  };

  const handleConvert = async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) {
      toast('warning', 'Enter a valid amount');
      return;
    }
    if (fromAsset === toAsset) {
      toast('warning', 'Select different assets');
      return;
    }
    setConverting(true);
    try {
      const { data } = await api.post('/wallet/convert', {
        from_asset: fromAsset,
        to_asset: toAsset,
        amount: parseFloat(convertAmount),
      });
      toast('success', `Converted ${data.from_amount} ${fromAsset}`, `Received ${data.to_amount.toFixed(6)} ${toAsset}`);
      setConvertAmount('');
      fetchWallet();
    } catch (e: any) {
      toast('error', e.response?.data?.error || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  const fromBal = assets.find(a => a.asset === fromAsset)?.balance || 0;
  const SUPPORTED = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE'];
  const filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter);

  const chartData = (() => {
    let running = 0;
    return [...txs].reverse().map(t => {
      if (['deposit','yield','referral'].includes(t.type)) running += t.amount;
      else if (t.type === 'withdraw') running = Math.max(0, running - t.amount);
      return { date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), balance: parseFloat(running.toFixed(2)) };
    });
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text3)' }} />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="section-label mb-1">Finance</p>
          <h1 className="font-bold text-white text-lg" style={{ letterSpacing: '-0.025em' }}>Wallet & Assets</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Balance · Deposits · Withdrawals · Portfolio</p>
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

      {/* Tabs */}
      <div className="flex gap-1.5">
        {(['portfolio', 'transactions', 'convert'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={tab === t
              ? { background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border2)' }
              : { background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { if (tab !== t) { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}}
            onMouseLeave={e => { if (tab !== t) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text3)'; }}}>
            {t === 'portfolio' ? 'Portfolio' : t === 'transactions' ? 'History' : 'Convert'}
          </button>
        ))}
      </div>

      {/* Portfolio tab */}
      {tab === 'portfolio' && selectedAsset && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Asset detail card */}
          <div className="ex-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: `${ASSET_COLORS[selectedAsset.asset] || '#8b8b9a'}14`, color: ASSET_COLORS[selectedAsset.asset] || '#8b8b9a', border: `1px solid ${ASSET_COLORS[selectedAsset.asset] || '#8b8b9a'}22` }}>
                {ASSET_ICONS[selectedAsset.asset] || selectedAsset.asset.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{selectedAsset.asset}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{selectedAsset.network || 'Multiple networks'}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-black mono text-lg text-white">
                  {selectedAsset.balance < 0.001 ? selectedAsset.balance.toFixed(8) : selectedAsset.balance.toFixed(6)}
                </p>
                <p className="text-sm font-bold" style={{ color: 'var(--yellow)' }}>${selectedAsset.usd_value.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Total Deposited</p>
                <p className="font-bold mono text-sm text-white mt-0.5">{selectedAsset.total_deposited.toFixed(4)}</p>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Total Withdrawn</p>
                <p className="font-bold mono text-sm text-white mt-0.5">{selectedAsset.total_withdrawn.toFixed(4)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTab('convert')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'var(--bg4)', color: 'var(--cyan)', border: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg5)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg4)')}>
                <ArrowLeftRight size={12} />Convert
              </button>
              <button
                onClick={() => setTab('transactions')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'var(--bg4)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg5)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg4)')}>
                <TrendingUp size={12} />History
              </button>
            </div>
          </div>

          {/* Deposit address */}
          <div className="ex-card p-5 space-y-4" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-2">
              <ArrowDownLeft size={14} style={{ color: 'var(--green)' }} />
              <span className="text-sm font-black text-white">Deposit {selectedAsset.asset}</span>
            </div>

            {selectedAsset.deposit_address ? (
              <>
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--text3)' }}>Network</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded"
                      style={{ background: `${ASSET_COLORS[selectedAsset.asset] || '#848e9c'}18`, color: ASSET_COLORS[selectedAsset.asset] || '#848e9c' }}>
                      {selectedAsset.network}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold block mb-1" style={{ color: 'var(--text3)' }}>Deposit Address</span>
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg4)' }}>
                      <span className="flex-1 text-xs mono text-white break-all" style={{ fontSize: 10 }}>
                        {selectedAsset.deposit_address}
                      </span>
                      <button
                        onClick={() => copyAddress(selectedAsset.deposit_address!, selectedAsset.asset)}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-all"
                        style={{ background: copied === selectedAsset.asset ? 'rgba(14,203,129,0.2)' : 'var(--bg3)' }}>
                        {copied === selectedAsset.asset
                          ? <CheckCircle size={12} style={{ color: 'var(--green)' }} />
                          : <Copy size={12} style={{ color: 'var(--text2)' }} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)' }}>
                  <span style={{ color: 'var(--yellow)', fontSize: 12 }}>⚠</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
                    Only send <strong style={{ color: 'var(--yellow)' }}>{selectedAsset.asset}</strong> on the <strong style={{ color: 'var(--yellow)' }}>{selectedAsset.network}</strong> network. Sending other assets may result in permanent loss.
                  </p>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <WalletIcon size={28} className="mx-auto mb-2" style={{ color: 'var(--text3)', opacity: 0.3 }} />
                <p className="text-xs" style={{ color: 'var(--text3)' }}>No deposit address available for {selectedAsset.asset}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <div className="ex-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-xs font-bold text-white">Transaction History</span>
            <span className="text-xs" style={{ color: 'var(--text3)' }}>{txs.length} records</span>
          </div>
          {txs.length === 0 ? (
            <div className="py-16 text-center">
              <ArrowUpRight size={28} className="mx-auto mb-2" style={{ color: 'var(--text3)', opacity: 0.3 }} />
              <p className="text-sm font-bold text-white">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {txs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${TX_COLORS[tx.type] || 'var(--text3)'}18` }}>
                    {tx.type.includes('deposit') || tx.type.includes('earn') || tx.type.includes('referral')
                      ? <ArrowDownLeft size={13} style={{ color: TX_COLORS[tx.type] || 'var(--text3)' }} />
                      : tx.type.includes('withdraw')
                        ? <ArrowUpRight size={13} style={{ color: TX_COLORS[tx.type] || 'var(--text3)' }} />
                        : <ArrowLeftRight size={13} style={{ color: TX_COLORS[tx.type] || 'var(--text3)' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    {tx.note && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{tx.note}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black mono" style={{ color: TX_COLORS[tx.type] || 'var(--text)' }}>
                      {tx.type.includes('withdraw') ? '-' : '+'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text3)', fontSize: 10 }}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Convert tab */}
      {tab === 'convert' && (
        <div className="max-w-md mx-auto">
          <div className="ex-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={14} style={{ color: '#06b6d4' }} />
              <span className="text-sm font-black text-white">Convert Assets</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>0.1% conversion fee applies. Conversion uses live market prices.</p>

            {/* From */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: 'var(--text3)' }}>From</span>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>
                  Balance: <span className="font-bold text-white">{fromBal.toFixed(6)} {fromAsset}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select value={fromAsset} onChange={e => setFromAsset(e.target.value)}
                  className="px-2 py-1.5 rounded-lg text-xs font-bold outline-none"
                  style={{ background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  {SUPPORTED.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input type="number" value={convertAmount} onChange={e => setConvertAmount(e.target.value)}
                  placeholder="0.00" className="flex-1 px-3 py-1.5 rounded-lg text-sm font-bold mono text-white outline-none"
                  style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }} />
                <button onClick={() => setConvertAmount(fromBal.toFixed(6))}
                  className="px-2 py-1 rounded text-xs font-black"
                  style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4' }}>
                  MAX
                </button>
              </div>
            </div>

            {/* Swap arrow */}
            <div className="flex justify-center">
              <button onClick={() => { const tmp = fromAsset; setFromAsset(toAsset); setToAsset(tmp); }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg3)')}>
                <ArrowLeftRight size={14} style={{ color: 'var(--cyan)' }} />
              </button>
            </div>

            {/* To */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <span className="text-xs font-bold" style={{ color: 'var(--text3)' }}>To</span>
              <select value={toAsset} onChange={e => setToAsset(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg text-xs font-bold outline-none"
                style={{ background: 'var(--bg4)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                {SUPPORTED.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <button onClick={handleConvert} disabled={converting || !convertAmount}
              className="w-full py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--brand-1)', color: '#fff', border: 'none' }}>
              {converting ? <RefreshCw size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
              Convert {fromAsset} → {toAsset}
            </button>

            <div className="flex items-center gap-2 px-2">
              <ChevronRight size={10} style={{ color: 'var(--text3)' }} />
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                Conversions are instant. Fee: 0.1%. Prices sourced from Binance live feed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deposit and Withdraw Modals */}
      <DepositModal
        show={showDeposit}
        onClose={closeModal}
        amount={amount}
        setAmount={setAmount}
        error={error}
        setError={setError}
        msg={msg}
        loading={loading}
        onSubmit={handleDeposit}
        depositTab={depositTab}
        setDepositTab={setDepositTab}
        txid={txid}
        setTxid={setTxid}
        txidError={txidError}
        setTxidError={setTxidError}
        txidMsg={txidMsg}
        txidLoading={txidLoading}
        submitTxid={submitTxid}
        platCopied={platCopied}
        copyPlatformAddress={copyPlatformAddress}
      />
      
      <WithdrawModal
        show={showWithdraw}
        onClose={closeModal}
        amount={amount}
        setAmount={setAmount}
        error={error}
        setError={setError}
        msg={msg}
        loading={loading}
        onSubmit={handleWithdraw}
        user={user}
      />
    </div>
  );
}
