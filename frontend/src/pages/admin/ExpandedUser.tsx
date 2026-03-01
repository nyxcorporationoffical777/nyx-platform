import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Plus, RotateCcw, Zap, Save } from 'lucide-react';
import { adminApi, VIP_COLOR, TX_COLOR } from './adminTypes';
import type { AdminUser, AdminTransaction, AdminSession } from './adminTypes';

const A = {
  bg:    '#09090f',
  bg3:   '#14141e',
  bg4:   '#1a1a25',
  bg5:   '#20202d',
  border:'rgba(255,255,255,0.07)',
  text:  '#f1f1f5',
  text2: '#9191a8',
  text3: '#52525e',
  green: '#10b981',
  red:   '#f43f5e',
  yellow:'#f59e0b',
  brand: '#6366f1',
};

const iCls = 'w-full text-xs px-3 py-2 rounded-xl outline-none transition-colors';
const iStyle = { background: A.bg, border: `1px solid ${A.border}`, color: A.text };

export default function ExpandedUser({ user, onSaved, onDeleted: _onDeleted }: {
  user: AdminUser;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<AdminUser & { note: string }>({ ...user, note: '' });
  const [txForm, setTxForm] = useState({ type: 'deposit', amount: '', note: '' });
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [tab, setTab] = useState<'edit' | 'transactions' | 'sessions'>('edit');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const flash = (m: string, isErr = false) => {
    if (isErr) { setErr(m); setTimeout(() => setErr(''), 4000); }
    else { setMsg(m); setTimeout(() => setMsg(''), 4000); }
  };

  const loadDetail = () => {
    adminApi().get(`/users/${user.id}`).then(r => {
      setTransactions(r.data.transactions);
      setSessions(r.data.sessions);
      setForm({ ...r.data.user, note: '' });
    }).catch(() => {});
  };

  useEffect(() => { loadDetail(); }, [user.id]);

  const f = (key: string, val: string | number | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi().put(`/users/${user.id}`, form);
      flash('Saved successfully');
      loadDetail();
      onSaved();
    } catch (e: any) {
      flash(e.response?.data?.error || 'Save failed', true);
    } finally { setSaving(false); }
  };

  const addTx = async () => {
    if (!txForm.amount) { flash('Enter an amount', true); return; }
    setSaving(true);
    try {
      const r = await adminApi().post(`/users/${user.id}/transaction`, txForm);
      flash(`Transaction added — new balance: $${r.data.new_balance.toFixed(2)}`);
      setTxForm({ type: 'deposit', amount: '', note: '' });
      loadDetail();
      onSaved();
    } catch (e: any) {
      flash(e.response?.data?.error || 'Failed', true);
    } finally { setSaving(false); }
  };

  const resetBot = async () => {
    await adminApi().post(`/users/${user.id}/reset-bot`);
    flash('Bot force-stopped'); loadDetail(); onSaved();
  };

  const resetDaily = async () => {
    await adminApi().post(`/users/${user.id}/reset-daily`);
    flash('Daily limit reset'); loadDetail();
  };

  const TABS = ['edit', 'transactions', 'sessions'] as const;

  return (
    <tr>
      <td colSpan={11} style={{ background: A.bg3, borderBottom: `2px solid ${A.brand}`, padding: 0 }}>
        <div className="p-4 flex flex-col gap-3">

          {/* Flash messages */}
          {msg && (
            <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
              style={{ background: `${A.green}12`, border: `1px solid ${A.green}25`, color: A.green }}>
              <CheckCircle size={11} /> {msg}
            </div>
          )}
          {err && (
            <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
              style={{ background: `${A.red}12`, border: `1px solid ${A.red}25`, color: A.red }}>
              <AlertTriangle size={11} /> {err}
            </div>
          )}

          {/* Tab bar + quick actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: A.bg4 }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-3 py-1.5 rounded-lg text-xs capitalize font-semibold transition-all"
                  style={tab === t
                    ? { background: A.brand, color: '#fff' }
                    : { color: A.text3 }}>
                  {t}
                  {t === 'transactions' && transactions.length > 0 && ` (${transactions.length})`}
                  {t === 'sessions' && sessions.length > 0 && ` (${sessions.length})`}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-1.5">
              <button onClick={resetBot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: `${A.yellow}12`, border: `1px solid ${A.yellow}25`, color: A.yellow }}>
                <RotateCcw size={10} /> Stop Bot
              </button>
              <button onClick={resetDaily}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: `${A.green}12`, border: `1px solid ${A.green}25`, color: A.green }}>
                <Zap size={10} /> Reset Daily
              </button>
            </div>
          </div>

          {/* ── EDIT TAB ── */}
          {tab === 'edit' && (
            <div className="flex flex-col gap-4">
              {/* Financial */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: A.text3 }}>Financial</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { key: 'balance',           label: 'Balance' },
                    { key: 'total_deposited',   label: 'Deposited' },
                    { key: 'total_withdrawn',   label: 'Withdrawn' },
                    { key: 'total_earned',      label: 'Earned' },
                    { key: 'referral_earnings', label: 'Ref. Earnings' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-[10px] mb-1 font-medium" style={{ color: A.text3 }}>{field.label} ($)</label>
                      <input type="number" step="0.0001"
                        value={(form as any)[field.key] ?? ''}
                        onChange={e => f(field.key, e.target.value)}
                        className={iCls} style={iStyle}
                        onFocus={e => (e.target.style.borderColor = A.brand)}
                        onBlur={e => (e.target.style.borderColor = A.border)} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] mb-1 font-medium" style={{ color: A.text3 }}>VIP Level</label>
                    <select value={form.vip_level} onChange={e => f('vip_level', e.target.value)}
                      className={iCls} style={{ ...iStyle, color: VIP_COLOR[form.vip_level] || A.text }}>
                      {['Starter','Silver','Gold','Platinum','Diamond'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Account */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: A.text3 }}>Account</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'full_name',      label: 'Full Name',      type: 'text' },
                    { key: 'email',          label: 'Email',          type: 'email' },
                    { key: 'crypto_address', label: 'Crypto Address', type: 'text' },
                    { key: 'crypto_network', label: 'Network',        type: 'text' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-[10px] mb-1 font-medium" style={{ color: A.text3 }}>{field.label}</label>
                      <input type={field.type}
                        value={(form as any)[field.key] ?? ''}
                        onChange={e => f(field.key, e.target.value)}
                        className={iCls} style={iStyle}
                        onFocus={e => (e.target.style.borderColor = A.brand)}
                        onBlur={e => (e.target.style.borderColor = A.border)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Read-only chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Ref Code',    value: form.referral_code || '—' },
                  { label: 'Referred By', value: form.referred_by ? `#${form.referred_by}` : 'None' },
                  { label: 'Active Days', value: String(form.active_days || 0) },
                  { label: 'Last Session',value: form.last_bot_date || 'Never' },
                  { label: 'Joined',      value: new Date(form.created_at).toLocaleDateString() },
                ].map(r => (
                  <div key={r.label} className="px-3 py-2 rounded-xl"
                    style={{ background: A.bg4, border: `1px solid ${A.border}` }}>
                    <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: A.text3 }}>{r.label}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: A.text }}>{r.value}</p>
                  </div>
                ))}
              </div>

              {/* Note + bot + save */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1" style={{ minWidth: 200 }}>
                  <label className="block text-[10px] mb-1 font-medium" style={{ color: A.text3 }}>Admin Note</label>
                  <input type="text"
                    value={(form as any).note ?? ''}
                    onChange={e => f('note', e.target.value)}
                    placeholder="e.g. Manual correction"
                    className={iCls} style={iStyle}
                    onFocus={e => (e.target.style.borderColor = A.brand)}
                    onBlur={e => (e.target.style.borderColor = A.border)} />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer pb-1" style={{ color: A.text2 }}>
                  <input type="checkbox" checked={!!form.bot_running}
                    onChange={e => f('bot_running', e.target.checked ? 1 : 0)} />
                  Bot Running
                </label>
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ background: A.brand, color: '#fff', opacity: saving ? 0.6 : 1 }}>
                  <Save size={11} /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── TRANSACTIONS TAB ── */}
          {tab === 'transactions' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 items-end px-4 py-3 rounded-2xl"
                style={{ background: A.bg4, border: `1px solid ${A.border}` }}>
                <div>
                  <label className="block text-[10px] mb-1 font-medium" style={{ color: A.text3 }}>Type</label>
                  <select value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}
                    className={iCls} style={{ ...iStyle, width: 110 }}>
                    {['deposit','withdraw','yield','referral'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] mb-1 font-medium" style={{ color: A.text3 }}>Amount ($)</label>
                  <input type="number" step="0.01" placeholder="0.00"
                    value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className={iCls} style={{ ...iStyle, width: 120 }}
                    onFocus={e => (e.target.style.borderColor = A.brand)}
                    onBlur={e => (e.target.style.borderColor = A.border)} />
                </div>
                <div className="flex-1" style={{ minWidth: 160 }}>
                  <label className="block text-[10px] mb-1 font-medium" style={{ color: A.text3 }}>Note (optional)</label>
                  <input type="text" placeholder="Reason / description"
                    value={txForm.note}
                    onChange={e => setTxForm({ ...txForm, note: e.target.value })}
                    className={iCls} style={iStyle}
                    onFocus={e => (e.target.style.borderColor = A.brand)}
                    onBlur={e => (e.target.style.borderColor = A.border)} />
                </div>
                <button onClick={addTx} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: A.brand, color: '#fff', opacity: saving ? 0.6 : 1 }}>
                  <Plus size={11} /> Add
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${A.border}` }}>
                <table className="w-full text-xs" style={{ minWidth: 540 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                      {['ID','Type','Amount','Note','Status','Date'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: A.text3, background: A.bg4 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: `1px solid ${A.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = A.bg4)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-3 py-2.5 mono text-[10px]" style={{ color: A.text3 }}>#{tx.id}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: `${TX_COLOR[tx.type]}18`, color: TX_COLOR[tx.type], border: `1px solid ${TX_COLOR[tx.type]}30` }}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 mono font-black text-xs" style={{ color: TX_COLOR[tx.type] }}>${tx.amount.toFixed(4)}</td>
                        <td className="px-3 py-2.5 text-[10px]" style={{ color: A.text2 }}>{tx.note || '—'}</td>
                        <td className="px-3 py-2.5 text-[10px] font-semibold" style={{ color: A.green }}>{tx.status}</td>
                        <td className="px-3 py-2.5 mono text-[10px]" style={{ color: A.text3 }}>{new Date(tx.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-xs" style={{ color: A.text3 }}>No transactions yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SESSIONS TAB ── */}
          {tab === 'sessions' && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${A.border}` }}>
              <table className="w-full text-xs" style={{ minWidth: 480 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                    {['ID','VIP','Started','Ended','Earned'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: A.text3, background: A.bg4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${A.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = A.bg4)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-3 py-2.5 mono text-[10px]" style={{ color: A.text3 }}>#{s.id}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: VIP_COLOR[s.vip_level] || A.text }}>{s.vip_level}</td>
                      <td className="px-3 py-2.5 mono text-[10px]" style={{ color: A.text2 }}>{new Date(s.started_at).toLocaleString()}</td>
                      <td className="px-3 py-2.5 mono text-[10px]" style={{ color: A.text2 }}>
                        {s.ended_at ? new Date(s.ended_at).toLocaleString() : <span className="font-bold" style={{ color: A.green }}>● Live</span>}
                      </td>
                      <td className="px-3 py-2.5 mono font-black text-xs" style={{ color: s.earned > 0 ? A.green : A.text3 }}>
                        {s.earned > 0 ? `+$${s.earned.toFixed(4)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr><td colSpan={5} className="py-10 text-center text-xs" style={{ color: A.text3 }}>No sessions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
