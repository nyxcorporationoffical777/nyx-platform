import { useState, useEffect, useCallback } from 'react';
import { Wallet as WalletIcon, Copy, RefreshCw, ArrowUpRight, ArrowDownLeft, TrendingUp, ChevronRight, CheckCircle, ArrowLeftRight } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

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

  // Convert state
  const [fromAsset, setFromAsset] = useState('USDT');
  const [toAsset, setToAsset] = useState('BTC');
  const [convertAmount, setConvertAmount] = useState('');
  const [converting, setConverting] = useState(false);

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
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text3)' }} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 fade-in">
      {/* ── Header ── */}
      <div className="rounded-2xl p-4"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <p className="section-label mb-3">Portfolio</p>
        <div className="flex flex-wrap gap-3">
          {/* Platform balance */}
          <div className="flex-1 min-w-[140px] px-4 py-3 rounded-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <p className="section-label mb-1">Platform Balance</p>
            <p className="mono font-bold text-white" style={{ fontSize: 20, letterSpacing: '-0.03em' }}>
              ${(user?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>USD · yield + deposits</p>
          </div>
          {totalUsd > 0 && (
            <div className="flex-1 min-w-[140px] px-4 py-3 rounded-xl" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <p className="section-label mb-1">Crypto Holdings</p>
              <p className="mono font-bold" style={{ fontSize: 20, letterSpacing: '-0.03em', color: 'var(--yellow)' }}>
                ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{assets.filter(a => a.balance > 0).length} assets</p>
            </div>
          )}
        </div>
      </div>

      {/* Asset pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {assets.map(a => {
          const color = ASSET_COLORS[a.asset] || '#8b8b9a';
          const isSelected = selectedAsset?.asset === a.asset && tab === 'portfolio';
          return (
            <button key={a.asset}
              onClick={() => { setSelectedAsset(a); setTab('portfolio'); }}
              className="flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-150"
              style={isSelected
                ? { background: `${color}12`, border: `1px solid ${color}30` }
                : { background: 'var(--bg2)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; } }}
              onMouseLeave={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; } }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm mb-2"
                style={{ background: `${color}14`, color, border: `1px solid ${color}20` }}>
                {ASSET_ICONS[a.asset] || a.asset.charAt(0)}
              </div>
              <p className="text-xs font-semibold" style={{ color: isSelected ? '#fff' : 'var(--text2)' }}>{a.asset}</p>
              <p className="mono mt-0.5" style={{ color: isSelected ? color : 'var(--text3)', fontSize: 10 }}>
                {a.balance < 0.001 ? a.balance.toFixed(5) : a.balance.toFixed(4)}
              </p>
              <p className="mt-0.5" style={{ color: isSelected ? 'var(--yellow)' : 'var(--text3)', fontSize: 10 }}>
                ${a.usd_value.toFixed(2)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {(['portfolio', 'transactions', 'convert'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
    </div>
  );
}
