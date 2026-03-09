import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Send, Zap, Shield, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '../components/Toast';
import TooltipHint from '../components/Tooltip';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <span className="font-black text-sm text-white">{title}</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--text3)', background: 'var(--bg4)' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}><X size={14} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface DepositModalProps {
  show: boolean;
  onClose: () => void;
  amount: string;
  setAmount: (val: string) => void;
  error: string;
  setError: (val: string) => void;
  msg: string;
  loading: boolean;
  onSubmit: () => void;
  depositTab: 'send' | 'manual';
  setDepositTab: (val: 'send' | 'manual') => void;
  txid: string;
  setTxid: (val: string) => void;
  txidError: string;
  setTxidError: (val: string) => void;
  txidMsg: string;
  txidLoading: boolean;
  submitTxid: () => void;
  platCopied: boolean;
  copyPlatformAddress: () => void;
}

export function DepositModal({ show, onClose, amount, setAmount, error, setError, msg, loading, onSubmit, depositTab, setDepositTab, txid, setTxid, txidError, setTxidError, txidMsg, txidLoading, submitTxid, platCopied, copyPlatformAddress }: DepositModalProps) {
  if (!show) return null;

  const PLATFORM_ADDRESS = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';
  const DEPOSIT_EXCHANGES = [
    { id: 'binance', name: 'Binance', initials: 'BN', color: '#f5c542', url: 'https://www.binance.com/en/my/wallet/account/main/withdrawal/crypto/USDT' },
    { id: 'bybit',   name: 'Bybit',   initials: 'BB', color: '#f97316', url: 'https://www.bybit.com/user/assets/withdraw?coin=USDT' },
    { id: 'okx',     name: 'OKX',     initials: 'OK', color: '#06b6d4', url: 'https://www.okx.com/balance/withdrawal' },
    { id: 'kucoin',  name: 'KuCoin',  initials: 'KC', color: '#22c55e', url: 'https://www.kucoin.com/assets/withdraw/USDT' },
    { id: 'coinbase',name: 'Coinbase',initials: 'CB', color: '#0052ff', url: 'https://accounts.coinbase.com/send' },
    { id: 'kraken',  name: 'Kraken',  initials: 'KR', color: '#5741d9', url: 'https://www.kraken.com/u/funding/withdraw?asset=USDT' },
  ];

  return (
    <Modal title="Deposit USDT" onClose={onClose}>
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
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--yellow)'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
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

              <button onClick={onClose} className="w-full py-2 rounded text-xs btn-outline">Close</button>
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
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-1)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
                  placeholder="e.g. 500" />
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[100, 500, 1000, 2000].map(v => (
                  <button key={v} onClick={() => setAmount(String(v))}
                    className="py-1.5 rounded text-xs btn-outline">${v}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded text-xs btn-outline">Cancel</button>
                <button onClick={onSubmit} disabled={loading}
                  className="flex-1 py-2.5 rounded text-xs btn-yellow">
                  {loading ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

interface WithdrawModalProps {
  show: boolean;
  onClose: () => void;
  amount: string;
  setAmount: (val: string) => void;
  error: string;
  setError: (val: string) => void;
  msg: string;
  loading: boolean;
  onSubmit: () => void;
  user: any;
}

export function WithdrawModal({ show, onClose, amount, setAmount, error, setError, msg, loading, onSubmit, user }: WithdrawModalProps) {
  if (!show) return null;

  return (
    <Modal title="Request Withdrawal" onClose={onClose}>
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
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(245,197,66,0.5)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(245,197,66,0.07)'; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
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
            <button onClick={onClose} className="flex-1 py-2.5 rounded text-xs btn-outline">Cancel</button>
            <button onClick={onSubmit}
              disabled={loading || !!user?.bot_running || (user?.balance ?? 0) < 100 || !user?.crypto_address}
              className="flex-1 py-2.5 rounded text-xs font-bold transition-all disabled:opacity-40"
              style={{ background: 'rgba(246,70,93,0.15)', border: '1px solid rgba(246,70,93,0.4)', color: 'var(--red)' }}>
              {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
