import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Plus, RotateCcw, Zap } from 'lucide-react';
import { adminApi, VIP_COLOR, TX_COLOR } from './adminTypes';
import type { AdminUser, AdminTransaction, AdminSession } from './adminTypes';

interface DetailData {
  user: AdminUser;
  transactions: AdminTransaction[];
  sessions: AdminSession[];
  referrals: AdminUser[];
}

export default function UserDetailModal({ userId, onClose, onRefresh }: {
  userId: number; onClose: () => void; onRefresh: () => void;
}) {
  const [data, setData] = useState<DetailData | null>(null);
  const [tab, setTab] = useState<'overview' | 'transactions' | 'sessions' | 'referrals' | 'edit'>('overview');
  const [editForm, setEditForm] = useState<Partial<AdminUser & { note: string }>>({});
  const [txForm, setTxForm] = useState({ type: 'deposit', amount: '', note: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await adminApi().get(`/users/${userId}`);
      setData(r.data);
      setEditForm({ ...r.data.user, note: '' });
    } catch { onClose(); }
  }, [userId, onClose]);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string, isErr = false) => {
    if (isErr) setErr(m); else setMsg(m);
    setTimeout(() => { setMsg(''); setErr(''); }, 3000);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminApi().put(`/users/${userId}`, editForm);
      flash('Saved successfully'); load(); onRefresh();
    } catch (e: any) { flash(e.response?.data?.error || 'Failed', true); }
    finally { setSaving(false); }
  };

  const addTx = async () => {
    if (!txForm.amount) { flash('Amount required', true); return; }
    setSaving(true);
    try {
      await adminApi().post(`/users/${userId}/transaction`, txForm);
      flash('Transaction added');
      setTxForm({ type: 'deposit', amount: '', note: '' });
      load(); onRefresh();
    } catch (e: any) { flash(e.response?.data?.error || 'Failed', true); }
    finally { setSaving(false); }
  };

  const resetBot = async () => {
    await adminApi().post(`/users/${userId}/reset-bot`);
    flash('Bot force-stopped'); load(); onRefresh();
  };

  const resetDaily = async () => {
    await adminApi().post(`/users/${userId}/reset-daily`);
    flash('Daily limit reset'); load();
  };

  if (!data) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <p className="text-sm" style={{ color: 'var(--text3)' }}>Loading...</p>
    </div>
  );

  const { user, transactions, sessions, referrals } = data;
  const iCls = 'w-full text-xs px-3 py-2 rounded outline-none';
  const iStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' };
  const TABS = ['overview', 'transactions', 'sessions', 'referrals', 'edit'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-5xl rounded" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3.5 sticky top-0 z-10"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <div>
            <span className="font-semibold text-sm text-white">{user.full_name}</span>
            <span className="text-xs ml-2" style={{ color: 'var(--text3)' }}>#{user.id} · {user.email}</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text3)' }}><X size={16} /></button>
        </div>

        <div className="p-5">
          {/* Flash messages */}
          {msg && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded mb-3"
              style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.3)', color: 'var(--green)' }}>
              <CheckCircle size={11} /> {msg}
            </div>
          )}
          {err && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded mb-3"
              style={{ background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.3)', color: 'var(--red)' }}>
              <AlertTriangle size={11} /> {err}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4 flex-wrap">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded text-xs capitalize font-medium transition-all"
                style={tab === t
                  ? { background: 'var(--yellow)', color: '#000' }
                  : { background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                {t}{t === 'transactions' ? ` (${transactions.length})` : t === 'sessions' ? ` (${sessions.length})` : t === 'referrals' ? ` (${referrals.length})` : ''}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Balance',      value: `$${user.balance.toFixed(2)}`,        color: 'var(--yellow)' },
                  { label: 'Deposited',    value: `$${user.total_deposited.toFixed(2)}`, color: 'var(--green)' },
                  { label: 'Withdrawn',    value: `$${user.total_withdrawn.toFixed(2)}`, color: 'var(--red)' },
                  { label: 'Total Earned', value: `$${user.total_earned.toFixed(4)}`,    color: 'var(--yellow)' },
                ].map(s => (
                  <div key={s.label} className="ex-card px-3 py-2.5">
                    <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>{s.label}</p>
                    <p className="text-base font-bold mono" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="ex-card overflow-hidden">
                <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  <span className="text-xs font-semibold text-white">Account Details</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  {[
                    { label: 'VIP Level',       value: user.vip_level },
                    { label: 'Bot Running',      value: user.bot_running ? '🟢 Active' : '⚫ Idle' },
                    { label: 'Last Session',     value: user.last_bot_date || 'Never' },
                    { label: 'Active Days',      value: String(user.active_days || 0) },
                    { label: 'Referral Code',    value: user.referral_code || '—' },
                    { label: 'Referred By',      value: user.referred_by ? `User #${user.referred_by}` : 'None' },
                    { label: 'Referral Earned',  value: `$${(user.referral_earnings || 0).toFixed(4)}` },
                    { label: 'Crypto Address',   value: user.crypto_address ? `${user.crypto_address.slice(0,20)}...` : '—' },
                    { label: 'Network',          value: user.crypto_network || '—' },
                    { label: 'Joined',           value: new Date(user.created_at).toLocaleString() },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-xs" style={{ color: 'var(--text3)' }}>{r.label}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={resetBot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                  style={{ background: 'rgba(240,185,11,0.1)', border: '1px solid rgba(240,185,11,0.3)', color: 'var(--yellow)' }}>
                  <RotateCcw size={11} /> Force Stop Bot
                </button>
                <button onClick={resetDaily}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                  style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.3)', color: 'var(--green)' }}>
                  <Zap size={11} /> Reset Daily Limit
                </button>
              </div>
            </div>
          )}

          {/* ── Transactions ── */}
          {tab === 'transactions' && (
            <div className="space-y-3">
              <div className="ex-card p-4">
                <p className="text-xs font-semibold text-white mb-3">Add Manual Transaction</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <select value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}
                    className={iCls} style={iStyle}>
                    {['deposit','withdraw','yield','referral'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" placeholder="Amount ($)" value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className={iCls} style={iStyle} />
                  <input type="text" placeholder="Note (optional)" value={txForm.note}
                    onChange={e => setTxForm({ ...txForm, note: e.target.value })}
                    className={iCls} style={iStyle} />
                </div>
                <button onClick={addTx} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold btn-yellow">
                  <Plus size={11} /> Add Transaction
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                      {['#','Type','Amount','Note','Status','Date'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="ex-row">
                        <td className="px-3 py-2" style={{ color: 'var(--text3)' }}>{tx.id}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ background: `${TX_COLOR[tx.type] || '#fff'}18`, color: TX_COLOR[tx.type] || 'var(--text)', border: `1px solid ${TX_COLOR[tx.type] || '#fff'}30` }}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 mono font-semibold" style={{ color: TX_COLOR[tx.type] || 'var(--text)' }}>
                          ${tx.amount.toFixed(4)}
                        </td>
                        <td className="px-3 py-2" style={{ color: 'var(--text2)' }}>{tx.note || '—'}</td>
                        <td className="px-3 py-2" style={{ color: 'var(--green)' }}>{tx.status}</td>
                        <td className="px-3 py-2 mono" style={{ color: 'var(--text3)' }}>{new Date(tx.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-8 text-center" style={{ color: 'var(--text3)' }}>No transactions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Sessions ── */}
          {tab === 'sessions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 480 }}>
                <thead>
                  <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                    {['#','VIP','Started','Ended','Earned'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="ex-row">
                      <td className="px-3 py-2.5" style={{ color: 'var(--text3)' }}>{s.id}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: VIP_COLOR[s.vip_level] || 'var(--text)' }}>{s.vip_level}</td>
                      <td className="px-3 py-2.5 mono" style={{ color: 'var(--text2)' }}>{new Date(s.started_at).toLocaleString()}</td>
                      <td className="px-3 py-2.5 mono" style={{ color: 'var(--text2)' }}>
                        {s.ended_at ? new Date(s.ended_at).toLocaleString() : <span style={{ color: 'var(--green)' }}>Running</span>}
                      </td>
                      <td className="px-3 py-2.5 mono font-bold" style={{ color: s.earned > 0 ? 'var(--green)' : 'var(--text3)' }}>
                        {s.earned > 0 ? `+$${s.earned.toFixed(4)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-8 text-center" style={{ color: 'var(--text3)' }}>No sessions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Referrals ── */}
          {tab === 'referrals' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 520 }}>
                <thead>
                  <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                    {['#','Name','Email','Balance','VIP','Earned','Joined'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r.id} className="ex-row">
                      <td className="px-3 py-2.5" style={{ color: 'var(--text3)' }}>{r.id}</td>
                      <td className="px-3 py-2.5 font-medium text-white">{r.full_name}</td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--text2)' }}>{r.email}</td>
                      <td className="px-3 py-2.5 mono" style={{ color: 'var(--yellow)' }}>${r.balance.toFixed(2)}</td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: VIP_COLOR[r.vip_level] }}>{r.vip_level}</td>
                      <td className="px-3 py-2.5 mono" style={{ color: 'var(--green)' }}>${r.total_earned.toFixed(4)}</td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--text3)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {referrals.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-8 text-center" style={{ color: 'var(--text3)' }}>No referrals</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Edit ── */}
          {tab === 'edit' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'full_name',          label: 'Full Name',              type: 'text' },
                  { key: 'email',              label: 'Email',                  type: 'email' },
                  { key: 'balance',            label: 'Balance ($)',            type: 'number' },
                  { key: 'vip_level',          label: 'VIP Level',              type: 'select', options: ['Starter','Silver','Gold','Platinum','Diamond'] },
                  { key: 'total_deposited',    label: 'Total Deposited ($)',    type: 'number' },
                  { key: 'total_withdrawn',    label: 'Total Withdrawn ($)',    type: 'number' },
                  { key: 'total_earned',       label: 'Total Earned ($)',       type: 'number' },
                  { key: 'referral_earnings',  label: 'Referral Earnings ($)',  type: 'number' },
                  { key: 'crypto_address',     label: 'Crypto Address',         type: 'text' },
                  { key: 'crypto_network',     label: 'Crypto Network',         type: 'text' },
                  { key: 'note',               label: 'Admin Note (balance adj)', type: 'text' },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text2)' }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={(editForm as any)[f.key] || ''}
                        onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                        className={iCls} style={iStyle}>
                        {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={(editForm as any)[f.key] ?? ''}
                        onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                        className={iCls} style={iStyle} />
                    )}
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text2)' }}>
                <input type="checkbox" checked={!!editForm.bot_running}
                  onChange={e => setEditForm({ ...editForm, bot_running: e.target.checked ? 1 : 0 })} />
                Bot Running (force toggle)
              </label>
              <button onClick={saveEdit} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold btn-yellow">
                <CheckCircle size={12} /> {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
