import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, LogOut, Trash2, Shield, Star,
  Users, Bot, Activity, ChevronDown, ChevronUp,
  ArrowDownCircle, CheckCircle, XCircle, Clock, BadgeCheck, FileText,
  TrendingUp, TrendingDown, Wallet, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { adminApi, VIP_COLOR, TX_COLOR } from './adminTypes';
import type { AdminUser, AdminTransaction, AdminSession, AdminStats } from './adminTypes';
import ExpandedUser from './ExpandedUser';

// Admin design tokens
const A = {
  bg:    '#09090f',
  bg2:   '#0f0f17',
  bg3:   '#14141e',
  bg4:   '#1a1a25',
  bg5:   '#20202d',
  card:  '#111119',
  border:'rgba(255,255,255,0.07)',
  text:  '#f1f1f5',
  text2: '#9191a8',
  text3: '#52525e',
  green: '#10b981',
  red:   '#f43f5e',
  yellow:'#f59e0b',
  brand: '#6366f1',
  cyan:  '#06b6d4',
  purple:'#a78bfa',
};

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: A.card, border: `1px solid ${A.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium" style={{ color: A.text3 }}>{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-black mono leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-1.5" style={{ color: A.text3 }}>{sub}</p>}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function Modal({ title, icon: Icon, iconColor, children, onClose }: { title: string; icon: any; iconColor: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: A.bg3, border: `1px solid ${A.border}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${A.border}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}15` }}>
              <Icon size={14} style={{ color: iconColor }} />
            </div>
            <span className="font-bold text-sm" style={{ color: A.text }}>{title}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: A.bg4, color: A.text3 }}>
            <XCircle size={13} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const LIMIT = 25;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [search, setSearch] = useState('');
  const [vipFilter, setVipFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(0);
  const [mainTab, setMainTab] = useState<'users' | 'transactions' | 'sessions' | 'withdrawals'>('users');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  interface WithdrawalRequest {
    id: number; user_id: number; full_name: string; email: string; vip_level: string;
    amount: number; crypto_address: string; crypto_network: string;
    status: string; admin_note: string | null; requested_at: string; processed_at: string | null;
  }
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<''>('');
  const [pendingCount, setPendingCount] = useState(0);
  const [actionNote, setActionNote] = useState('');
  const [actionTarget, setActionTarget] = useState<{id: number; type: 'approve'|'reject'} | null>(null);

  interface KycSubmission {
    id: number; user_id: number; user_name: string; user_email: string;
    doc_type: string; full_name: string; dob: string; country: string;
    status: string; admin_note: string | null; submitted_at: string;
    id_front_path: string | null; id_back_path: string | null; selfie_path: string | null;
  }
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([]);
  const [kycPendingCount, setKycPendingCount] = useState(0);
  const [kycFilter, setKycFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [kycActionTarget, setKycActionTarget] = useState<{id: number; type: 'approve'|'reject'} | null>(null);
  const [kycActionNote, setKycActionNote] = useState('');

  // Health metrics
  interface HealthData {
    dailySignups: { day: string; count: number }[];
    dailyYield: { day: string; amount: number }[];
    dailyDeposits: { day: string; amount: number }[];
    dailyWithdrawals: { day: string; amount: number }[];
    vipDistribution: { vip_level: string; count: number; total_balance: number }[];
    topEarners: { id: number; full_name: string; email: string; vip_level: string; balance: number; total_earned: number; total_deposited: number; active_days: number }[];
    topBalances: { id: number; full_name: string; email: string; vip_level: string; balance: number; total_earned: number }[];
    retention: { total: number; day1: number; day7: number; day30: number };
    hourlyBots: { hour: string; count: number }[];
    totals: { users: number; total_balance: number; total_deposited: number; total_withdrawn: number; total_earned: number; total_referral_earnings: number; active_bots: number; new_today: number; new_week: number };
    totalSessions: number;
    pendingWithdrawals: { c: number; s: number };
  }
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const logout = () => { localStorage.removeItem('admin_token'); navigate('/admin'); };

  const checkAuth = useCallback(async () => {
    try { await adminApi().get('/stats'); } catch { navigate('/admin'); }
  }, [navigate]);

  const loadStats = useCallback(async () => {
    try { const r = await adminApi().get('/stats'); setStats(r.data); } catch {}
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const r = await adminApi().get('/users', {
        params: { search, vip: vipFilter, sort: sortBy, limit: LIMIT, offset: page * LIMIT }
      });
      setUsers(r.data.users);
      setTotalCount(r.data.total);
    } catch {}
  }, [search, vipFilter, sortBy, page]);

  const loadTransactions = useCallback(async () => {
    try { const r = await adminApi().get('/transactions'); setTransactions(r.data); } catch {}
  }, []);

  const loadSessions = useCallback(async () => {
    try { const r = await adminApi().get('/sessions'); setSessions(r.data); } catch {}
  }, []);

  const loadWithdrawals = useCallback(async () => {
    try {
      const r = await adminApi().get('/withdrawal-requests', { params: { status: withdrawalFilter } });
      setWithdrawals(r.data.requests);
      setPendingCount(r.data.pending_count);
    } catch {}
  }, [withdrawalFilter]);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try { const r = await adminApi().get('/health'); setHealth(r.data); } catch {}
    finally { setHealthLoading(false); }
  }, []);

  const loadKyc = useCallback(async () => {
    try {
      const r = await adminApi().get('/kyc', { params: { status: kycFilter } });
      setKycSubmissions(r.data.submissions);
      setKycPendingCount(r.data.pendingCount);
    } catch {}
  }, [kycFilter]);

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => { loadStats(); loadUsers(); }, [loadStats, loadUsers]);
  useEffect(() => { if (mainTab === 'transactions') loadTransactions(); }, [mainTab, loadTransactions]);
  useEffect(() => { if (mainTab === 'sessions') loadSessions(); }, [mainTab, loadSessions]);
  useEffect(() => { if (mainTab === 'withdrawals') loadWithdrawals(); }, [mainTab, loadWithdrawals]);
  useEffect(() => { loadWithdrawals(); }, [loadWithdrawals]);
  useEffect(() => { if ((mainTab as string) === 'kyc') loadKyc(); }, [mainTab, loadKyc, kycFilter]);
  useEffect(() => { loadKyc(); }, [loadKyc]);
  useEffect(() => { if ((mainTab as string) === 'health') loadHealth(); }, [mainTab, loadHealth]);

  // Auto-refresh every 10s
  useEffect(() => {
    const t = setInterval(() => {
      loadStats(); loadUsers(); setLastUpdated(new Date());
    }, 10000);
    return () => clearInterval(t);
  }, [loadStats, loadUsers]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadUsers(), loadTransactions(), loadSessions(), loadWithdrawals(), loadKyc()]);
    setLastUpdated(new Date());
    setRefreshing(false);
  };

  const handleKycAction = async () => {
    if (!kycActionTarget) return;
    try {
      await adminApi().post(`/kyc/${kycActionTarget.id}/${kycActionTarget.type}`, { note: kycActionNote });
      setKycActionTarget(null); setKycActionNote('');
      loadKyc();
    } catch {}
  };

  const handleWithdrawalAction = async () => {
    if (!actionTarget) return;
    try {
      await adminApi().post(`/withdrawal-requests/${actionTarget.id}/${actionTarget.type}`, { note: actionNote });
      setActionTarget(null); setActionNote('');
      loadWithdrawals(); loadStats();
    } catch {}
  };

  const deleteUser = async (id: number) => {
    try {
      await adminApi().delete(`/users/${id}`);
      setDeleteConfirm(null);
      if (expandedId === id) setExpandedId(null);
      loadStats(); loadUsers();
    } catch {}
  };

  const TABS = [
    { id: 'users',        label: 'Users',       icon: Users },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'sessions',     label: 'Bot Sessions', icon: Bot },
    { id: 'withdrawals',  label: 'Withdrawals',  icon: ArrowDownCircle },
    { id: 'kyc',          label: 'KYC',          icon: BadgeCheck },
    { id: 'health',       label: 'Health',       icon: BarChart2 },
  ] as const;

  const iSty = { background: A.bg, border: `1px solid ${A.border}`, color: A.text };
  const iCls = 'w-full text-xs px-3 py-2 rounded-xl outline-none transition-colors';

  return (
    <div className="min-h-screen w-full" style={{ background: A.bg, color: A.text }}>

      {/* ── Topbar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6"
        style={{ height: 56, background: A.bg2, borderBottom: `1px solid ${A.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${A.red}18`, border: `1px solid ${A.red}30` }}>
            <Shield size={14} style={{ color: A.red }} />
          </div>
          <div>
            <p className="text-sm font-black leading-none" style={{ color: A.text }}>NYX Admin</p>
            <p className="text-[10px] mt-0.5" style={{ color: A.text3 }}>Control Panel</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
            style={{ background: `${A.red}12`, color: A.red, border: `1px solid ${A.red}20` }}>RESTRICTED</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs mono flex items-center gap-1.5" style={{ color: A.text3 }}>
            <span className="w-1.5 h-1.5 rounded-full blink" style={{ background: A.green, display: 'inline-block' }} />
            {lastUpdated.toLocaleTimeString()}
          </span>
          <button onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: A.bg3, border: `1px solid ${A.border}`, color: A.text2 }}>
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: `${A.red}12`, border: `1px solid ${A.red}25`, color: A.red }}>
            <LogOut size={11} /> Sign Out
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Stats ── */}
        {stats && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              <StatCard icon={Users}       label="Total Users"     value={String(stats.totalUsers)}   color={A.brand}  sub={`+${stats.newToday} today`} />
              <StatCard icon={TrendingUp}  label="Deposited"       value={`$${stats.totalDeposited.toLocaleString('en',{maximumFractionDigits:2})}`} color={A.green} />
              <StatCard icon={TrendingDown} label="Withdrawn"      value={`$${stats.totalWithdrawn.toLocaleString('en',{maximumFractionDigits:2})}`} color={A.red} />
              <StatCard icon={Activity}    label="Yield Paid"      value={`$${stats.totalEarned.toLocaleString('en',{maximumFractionDigits:2})}`}    color={A.yellow} />
              <StatCard icon={Bot}         label="Active Engines"  value={String(stats.activeBot)}    color={A.cyan}   sub={`${stats.totalSessions} sessions`} />
              <StatCard icon={Wallet}      label="Total Balance"   value={`$${stats.totalBalance.toLocaleString('en',{maximumFractionDigits:2})}`}   color={A.purple} sub={`${stats.totalTx} txns`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-2xl px-4 py-3 flex flex-wrap gap-2 items-center"
                style={{ background: A.card, border: `1px solid ${A.border}` }}>
                <p className="text-xs font-semibold mr-2" style={{ color: A.text3 }}>VIP Distribution</p>
                {stats.vipCounts.map(v => (
                  <div key={v.vip_level} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                    style={{ background: A.bg4, border: `1px solid ${VIP_COLOR[v.vip_level] || A.border}30` }}>
                    <Star size={9} style={{ color: VIP_COLOR[v.vip_level] }} />
                    <span className="text-xs font-semibold" style={{ color: VIP_COLOR[v.vip_level] }}>{v.vip_level}</span>
                    <span className="text-xs mono font-black" style={{ color: A.text }}>{v.count}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl px-4 py-3 flex items-center gap-6"
                style={{ background: A.card, border: `1px solid ${A.border}` }}>
                <div>
                  <p className="text-[10px] font-medium" style={{ color: A.text3 }}>Net Flow</p>
                  <p className="text-xl font-black mono mt-1" style={{ color: stats.totalDeposited - stats.totalWithdrawn >= 0 ? A.green : A.red }}>
                    {stats.totalDeposited - stats.totalWithdrawn >= 0 ? '+' : ''}${(stats.totalDeposited - stats.totalWithdrawn).toFixed(2)}
                  </p>
                </div>
                <div className="w-px h-8 self-center" style={{ background: A.border }} />
                <div>
                  <p className="text-[10px] font-medium" style={{ color: A.text3 }}>Retention</p>
                  <p className="text-xl font-black mono mt-1" style={{ color: A.cyan }}>
                    {stats.totalDeposited > 0 ? ((stats.totalBalance / stats.totalDeposited) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
                {pendingCount > 0 && <>
                  <div className="w-px h-8 self-center" style={{ background: A.border }} />
                  <div>
                    <p className="text-[10px] font-medium" style={{ color: A.text3 }}>Pending W/D</p>
                    <p className="text-xl font-black mono mt-1" style={{ color: A.red }}>{pendingCount}</p>
                  </div>
                </>}
                {kycPendingCount > 0 && <>
                  <div className="w-px h-8 self-center" style={{ background: A.border }} />
                  <div>
                    <p className="text-[10px] font-medium" style={{ color: A.text3 }}>KYC Queue</p>
                    <p className="text-xl font-black mono mt-1" style={{ color: A.yellow }}>{kycPendingCount}</p>
                  </div>
                </>}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex gap-1.5 flex-wrap p-1 rounded-2xl" style={{ background: A.bg2, border: `1px solid ${A.border}` }}>
          {TABS.map(t => {
            const active = mainTab === t.id;
            const badge = t.id === 'withdrawals' ? pendingCount : t.id === 'kyc' ? kycPendingCount : 0;
            return (
              <button key={t.id} onClick={() => setMainTab(t.id as typeof mainTab)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={active ? { background: A.brand, color: '#fff' } : { color: A.text3 }}>
                <t.icon size={12} />
                {t.label}
                {badge > 0 && !active && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px]"
                    style={{ background: t.id === 'withdrawals' ? A.red : A.yellow, color: t.id === 'withdrawals' ? '#fff' : '#000' }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── USERS TAB ── */}
        {mainTab === 'users' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-52">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: A.text3 }} />
                <input type="text" placeholder="Search name, email, code…"
                  value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                  className={iCls + ' pl-8'} style={iSty} />
              </div>
              <select value={vipFilter} onChange={e => { setVipFilter(e.target.value); setPage(0); }}
                className={iCls} style={{ ...iSty, width: 150 }}>
                <option value="">All VIP Tiers</option>
                {['Starter','Silver','Gold','Platinum','Diamond'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className={iCls} style={{ ...iSty, width: 160 }}>
                <option value="created_at">Newest First</option>
                <option value="balance">Balance ↓</option>
                <option value="total_deposited">Deposited ↓</option>
                <option value="total_earned">Earned ↓</option>
              </select>
              <span className="mono text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: A.bg3, color: A.text3 }}>{totalCount} users</span>
            </div>

            {/* Users table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: A.card, border: `1px solid ${A.border}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 900 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                      {['', 'ID', 'User', 'VIP', 'Balance', 'Deposited', 'Withdrawn', 'Earned', 'Engine', 'Joined', ''].map((h, i) => (
                        <th key={i} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: A.text3, background: A.bg3 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <>
                        <tr key={u.id} style={{ borderBottom: `1px solid ${A.border}`, cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = A.bg3)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td className="px-2 py-3 w-9" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{ background: expandedId === u.id ? A.brand : A.bg4, color: expandedId === u.id ? '#fff' : A.text3 }}>
                              {expandedId === u.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </div>
                          </td>
                          <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }} onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>#{u.id}</td>
                          <td className="px-3 py-3" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>
                            <p className="font-semibold" style={{ color: A.text }}>{u.full_name}</p>
                            <p className="text-[10px]" style={{ color: A.text3 }}>{u.email}</p>
                          </td>
                          <td className="px-3 py-3" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>
                            <Badge color={VIP_COLOR[u.vip_level] || A.text3}><Star size={8} />{u.vip_level}</Badge>
                          </td>
                          <td className="px-3 py-3 mono font-black text-xs" style={{ color: A.yellow }} onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>${u.balance.toFixed(2)}</td>
                          <td className="px-3 py-3 mono text-xs" style={{ color: A.green }} onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>${u.total_deposited.toFixed(2)}</td>
                          <td className="px-3 py-3 mono text-xs" style={{ color: A.red }} onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>${u.total_withdrawn.toFixed(2)}</td>
                          <td className="px-3 py-3 mono text-xs" style={{ color: A.yellow }} onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>${u.total_earned.toFixed(2)}</td>
                          <td className="px-3 py-3" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>
                            <span className="flex items-center gap-1 text-[10px] font-bold">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.bot_running ? 'blink' : ''}`} style={{ background: u.bot_running ? A.green : A.bg5 }} />
                              <span style={{ color: u.bot_running ? A.green : A.text3 }}>{u.bot_running ? 'ON' : 'OFF'}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }} onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-3 py-3">
                            <button onClick={() => setDeleteConfirm(u.id)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${A.red}12`, color: A.red }}>
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                        {expandedId === u.id && (
                          <ExpandedUser key={`exp-${u.id}`} user={u}
                            onSaved={() => { loadStats(); loadUsers(); }}
                            onDeleted={() => { setExpandedId(null); loadStats(); loadUsers(); }} />
                        )}
                      </>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={11} className="py-16 text-center text-sm" style={{ color: A.text3 }}>No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {totalCount > LIMIT && (
              <div className="flex items-center gap-3">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                  style={{ background: A.bg3, border: `1px solid ${A.border}`, color: A.text2 }}>← Prev</button>
                <span className="text-xs mono" style={{ color: A.text3 }}>Page {page + 1} / {Math.ceil(totalCount / LIMIT)}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= totalCount}
                  className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                  style={{ background: A.bg3, border: `1px solid ${A.border}`, color: A.text2 }}>Next →</button>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {mainTab === 'transactions' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: A.card, border: `1px solid ${A.border}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 720 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                    {['ID', 'User', 'Email', 'Type', 'Amount', 'Note', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: A.text3, background: A.bg3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: `1px solid ${A.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = A.bg3)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }}>#{tx.id}</td>
                      <td className="px-3 py-3 font-semibold" style={{ color: A.text }}>{tx.full_name}</td>
                      <td className="px-3 py-3 text-[10px]" style={{ color: A.text3 }}>{tx.email}</td>
                      <td className="px-3 py-3"><Badge color={TX_COLOR[tx.type] || A.text3}>{tx.type}</Badge></td>
                      <td className="px-3 py-3 mono font-black" style={{ color: TX_COLOR[tx.type] }}>${tx.amount.toFixed(4)}</td>
                      <td className="px-3 py-3 text-[10px]" style={{ color: A.text2 }}>{tx.note || '—'}</td>
                      <td className="px-3 py-3 text-[10px] font-semibold" style={{ color: A.green }}>{tx.status}</td>
                      <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }}>{new Date(tx.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={8} className="py-16 text-center text-sm" style={{ color: A.text3 }}>No transactions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {mainTab === 'sessions' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: A.card, border: `1px solid ${A.border}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 660 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                    {['ID', 'User', 'Email', 'VIP', 'Started', 'Ended', 'Earned'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: A.text3, background: A.bg3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${A.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = A.bg3)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }}>#{s.id}</td>
                      <td className="px-3 py-3 font-semibold" style={{ color: A.text }}>{s.full_name}</td>
                      <td className="px-3 py-3 text-[10px]" style={{ color: A.text3 }}>{s.email}</td>
                      <td className="px-3 py-3"><Badge color={VIP_COLOR[s.vip_level] || A.text3}>{s.vip_level}</Badge></td>
                      <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text2 }}>{new Date(s.started_at).toLocaleString()}</td>
                      <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text2 }}>
                        {s.ended_at ? new Date(s.ended_at).toLocaleString() : <span className="font-bold" style={{ color: A.green }}>● Live</span>}
                      </td>
                      <td className="px-3 py-3 mono font-black text-xs" style={{ color: s.earned > 0 ? A.green : A.text3 }}>
                        {s.earned > 0 ? `+$${s.earned.toFixed(4)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr><td colSpan={7} className="py-16 text-center text-sm" style={{ color: A.text3 }}>No sessions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WITHDRAWALS TAB ── */}
        {mainTab === 'withdrawals' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {pendingCount > 0 && <Badge color={A.red}>{pendingCount} pending</Badge>}
              <div className="ml-auto flex gap-1.5">
                {(['', 'pending', 'approved', 'rejected'] as const).map(f => (
                  <button key={f} onClick={() => setWithdrawalFilter(f as any)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
                    style={withdrawalFilter === f
                      ? { background: A.brand, color: '#fff' }
                      : { background: A.bg3, color: A.text3, border: `1px solid ${A.border}` }}>
                    {f || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: A.card, border: `1px solid ${A.border}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 820 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                      {['ID', 'User', 'VIP', 'Amount', 'Address', 'Network', 'Status', 'Requested', 'Actions'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: A.text3, background: A.bg3 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(wr => (
                      <tr key={wr.id} style={{ borderBottom: `1px solid ${A.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = A.bg3)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }}>#{wr.id}</td>
                        <td className="px-3 py-3">
                          <p className="font-semibold" style={{ color: A.text }}>{wr.full_name}</p>
                          <p className="text-[10px]" style={{ color: A.text3 }}>{wr.email}</p>
                        </td>
                        <td className="px-3 py-3"><Badge color={VIP_COLOR[wr.vip_level] || A.text3}>{wr.vip_level}</Badge></td>
                        <td className="px-3 py-3 mono font-black text-xs" style={{ color: A.red }}>${wr.amount.toFixed(2)}</td>
                        <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text2 }}>
                          <span title={wr.crypto_address}>{wr.crypto_address.slice(0,10)}…{wr.crypto_address.slice(-6)}</span>
                        </td>
                        <td className="px-3 py-3"><Badge color={A.cyan}>{wr.crypto_network}</Badge></td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1 text-xs font-semibold"
                            style={{ color: wr.status === 'pending' ? A.yellow : wr.status === 'approved' ? A.green : A.red }}>
                            {wr.status === 'pending' && <Clock size={10} />}
                            {wr.status === 'approved' && <CheckCircle size={10} />}
                            {wr.status === 'rejected' && <XCircle size={10} />}
                            {wr.status}
                          </span>
                          {wr.admin_note && <p className="text-[9px] mt-0.5" style={{ color: A.text3 }}>{wr.admin_note}</p>}
                        </td>
                        <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }}>{new Date(wr.requested_at).toLocaleString()}</td>
                        <td className="px-3 py-3">
                          {wr.status === 'pending' ? (
                            <div className="flex gap-1">
                              <button onClick={() => setActionTarget({ id: wr.id, type: 'approve' })}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                                style={{ background: `${A.green}15`, color: A.green, border: `1px solid ${A.green}30` }}>
                                <CheckCircle size={9} /> Approve
                              </button>
                              <button onClick={() => setActionTarget({ id: wr.id, type: 'reject' })}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                                style={{ background: `${A.red}12`, color: A.red, border: `1px solid ${A.red}25` }}>
                                <XCircle size={9} /> Reject
                              </button>
                            </div>
                          ) : <span style={{ color: A.text3 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                    {withdrawals.length === 0 && (
                      <tr><td colSpan={9} className="py-16 text-center text-sm" style={{ color: A.text3 }}>No withdrawal requests</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── KYC TAB ── */}
        {(mainTab as string) === 'kyc' && (
          <div className="space-y-3">
            <div className="flex gap-1.5">
              {(['pending', 'approved', 'rejected'] as const).map(f => (
                <button key={f} onClick={() => setKycFilter(f)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                  style={kycFilter === f
                    ? { background: f === 'approved' ? A.green : f === 'rejected' ? A.red : A.yellow, color: f === 'rejected' ? '#fff' : '#000' }
                    : { background: A.bg3, color: A.text3, border: `1px solid ${A.border}` }}>
                  {f}
                  {f === 'pending' && kycPendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: A.yellow, color: '#000' }}>{kycPendingCount}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: A.card, border: `1px solid ${A.border}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                      {['ID', 'User', 'Doc Type', 'Full Name', 'Country', 'Submitted', 'Documents', 'Actions'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: A.text3, background: A.bg3 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kycSubmissions.map(sub => (
                      <tr key={sub.id} style={{ borderBottom: `1px solid ${A.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = A.bg3)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }}>#{sub.id}</td>
                        <td className="px-3 py-3">
                          <p className="font-semibold" style={{ color: A.text }}>{sub.user_name}</p>
                          <p className="text-[10px]" style={{ color: A.text3 }}>{sub.user_email}</p>
                        </td>
                        <td className="px-3 py-3 capitalize text-[10px]" style={{ color: A.text2 }}>{sub.doc_type?.replace('_', ' ')}</td>
                        <td className="px-3 py-3 text-xs" style={{ color: A.text }}>{sub.full_name || '—'}</td>
                        <td className="px-3 py-3 text-[10px]" style={{ color: A.text2 }}>{sub.country || '—'}</td>
                        <td className="px-3 py-3 mono text-[10px]" style={{ color: A.text3 }}>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            {[sub.id_front_path && 'Front', sub.id_back_path && 'Back', sub.selfie_path && 'Selfie'].filter(Boolean).map(label => (
                              <a key={label}
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/uploads/kyc/${label === 'Front' ? sub.id_front_path : label === 'Back' ? sub.id_back_path : sub.selfie_path}`}
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                style={{ background: A.bg4, color: A.text2, border: `1px solid ${A.border}` }}>
                                <FileText size={9} /> {label}
                              </a>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {sub.status === 'pending' ? (
                            <div className="flex gap-1">
                              <button onClick={() => setKycActionTarget({ id: sub.id, type: 'approve' })}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                                style={{ background: `${A.green}15`, color: A.green, border: `1px solid ${A.green}30` }}>
                                <CheckCircle size={9} /> Approve
                              </button>
                              <button onClick={() => setKycActionTarget({ id: sub.id, type: 'reject' })}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                                style={{ background: `${A.red}12`, color: A.red, border: `1px solid ${A.red}25` }}>
                                <XCircle size={9} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold capitalize" style={{ color: sub.status === 'approved' ? A.green : A.red }}>{sub.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {kycSubmissions.length === 0 && (
                      <tr><td colSpan={8} className="py-16 text-center text-sm" style={{ color: A.text3 }}>No {kycFilter} KYC submissions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* ── HEALTH TAB ── */}
        {(mainTab as string) === 'health' && (
          <div className="space-y-5">
            {healthLoading && !health && (
              <div className="py-20 text-center text-xs" style={{ color: A.text3 }}>Loading health data…</div>
            )}
            {health && (() => {
              const fmt = (n: number) => `$${n.toLocaleString('en', { maximumFractionDigits: 0 })}`;
              const pct = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '0%';

              // Merge daily arrays into one for chart
              const days30: Record<string, { day: string; signups: number; yield: number; deposits: number; withdrawals: number }> = {};
              health.dailySignups.forEach(d => { days30[d.day] = { ...(days30[d.day] || { day: d.day, signups: 0, yield: 0, deposits: 0, withdrawals: 0 }), signups: d.count }; });
              health.dailyYield.forEach(d => { days30[d.day] = { ...(days30[d.day] || { day: d.day, signups: 0, yield: 0, deposits: 0, withdrawals: 0 }), yield: d.amount }; });
              health.dailyDeposits.forEach(d => { days30[d.day] = { ...(days30[d.day] || { day: d.day, signups: 0, yield: 0, deposits: 0, withdrawals: 0 }), deposits: d.amount }; });
              health.dailyWithdrawals.forEach(d => { days30[d.day] = { ...(days30[d.day] || { day: d.day, signups: 0, yield: 0, deposits: 0, withdrawals: 0 }), withdrawals: d.amount }; });
              const chartData = Object.values(days30).sort((a, b) => a.day.localeCompare(b.day)).map(d => ({ ...d, day: d.day.slice(5) }));

              return (<>
                {/* KPI strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Users',    value: String(health.totals.users),           sub: `+${health.totals.new_today} today · +${health.totals.new_week} this week`, color: A.brand },
                    { label: 'Platform AUM',   value: fmt(health.totals.total_balance),      sub: `${fmt(health.totals.total_deposited)} deposited`,  color: A.green },
                    { label: 'Yield Paid Out', value: fmt(health.totals.total_earned),       sub: `+ ${fmt(health.totals.total_referral_earnings)} referral earnings`, color: A.yellow },
                    { label: 'Active Bots',    value: String(health.totals.active_bots),     sub: `${health.totalSessions} total sessions`, color: A.cyan },
                  ].map(k => (
                    <div key={k.label} className="rounded-2xl p-4" style={{ background: A.card, border: `1px solid ${A.border}` }}>
                      <p className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: A.text3 }}>{k.label}</p>
                      <p className="text-xl font-black mono" style={{ color: k.color }}>{k.value}</p>
                      <p className="text-[10px] mt-1" style={{ color: A.text3 }}>{k.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Daily Signups + Yield charts */}
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl p-4" style={{ background: A.card, border: `1px solid ${A.border}` }}>
                    <p className="text-xs font-bold mb-4" style={{ color: A.text }}>Daily Signups — 30 days</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={A.brand} stopOpacity={0.3} /><stop offset="100%" stopColor={A.brand} stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={A.border} />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: A.text3 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: A.text3 }} tickLine={false} axisLine={false} width={24} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: A.bg3, border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: A.text }} />
                        <Area type="monotone" dataKey="signups" stroke={A.brand} fill="url(#sg)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: A.card, border: `1px solid ${A.border}` }}>
                    <p className="text-xs font-bold mb-4" style={{ color: A.text }}>Daily Yield Paid — 30 days</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="yg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={A.yellow} stopOpacity={0.3} /><stop offset="100%" stopColor={A.yellow} stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={A.border} />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: A.text3 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: A.text3 }} tickLine={false} axisLine={false} width={32} />
                        <Tooltip contentStyle={{ background: A.bg3, border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: A.text }} formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Yield']} />
                        <Area type="monotone" dataKey="yield" stroke={A.yellow} fill="url(#yg)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Deposits vs Withdrawals */}
                <div className="rounded-2xl p-4" style={{ background: A.card, border: `1px solid ${A.border}` }}>
                  <p className="text-xs font-bold mb-4" style={{ color: A.text }}>Deposits vs Withdrawals — 30 days</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke={A.border} />
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: A.text3 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9, fill: A.text3 }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip contentStyle={{ background: A.bg3, border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: A.text }} formatter={(v: number | undefined) => `$${(v ?? 0).toFixed(2)}`} />
                      <Bar dataKey="deposits" fill={A.green} radius={[3, 3, 0, 0]} opacity={0.85} name="Deposits" />
                      <Bar dataKey="withdrawals" fill={A.red} radius={[3, 3, 0, 0]} opacity={0.85} name="Withdrawals" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* VIP Distribution + Retention */}
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl p-4" style={{ background: A.card, border: `1px solid ${A.border}` }}>
                    <p className="text-xs font-bold mb-4" style={{ color: A.text }}>VIP Distribution</p>
                    <div className="space-y-2.5">
                      {health.vipDistribution.map(v => {
                        const total = health.vipDistribution.reduce((s, x) => s + x.count, 0);
                        const w = total > 0 ? (v.count / total) * 100 : 0;
                        return (
                          <div key={v.vip_level}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-semibold" style={{ color: VIP_COLOR[v.vip_level] || A.text2 }}>{v.vip_level}</span>
                              <span className="text-xs mono" style={{ color: A.text2 }}>{v.count} users · {fmt(v.total_balance)}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: A.bg4 }}>
                              <div className="h-full rounded-full" style={{ width: `${w}%`, background: VIP_COLOR[v.vip_level] || A.brand }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: A.card, border: `1px solid ${A.border}` }}>
                    <p className="text-xs font-bold" style={{ color: A.text }}>Retention & Activity</p>
                    {[
                      { label: 'Ran bot ≥1 day',  val: health.retention.day1,  color: A.brand },
                      { label: 'Ran bot ≥7 days',  val: health.retention.day7,  color: A.cyan },
                      { label: 'Ran bot ≥30 days', val: health.retention.day30, color: A.green },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: A.text2 }}>{r.label}</span>
                          <span className="text-xs mono font-bold" style={{ color: r.color }}>{r.val} <span style={{ color: A.text3 }}>({pct(r.val, health.retention.total)})</span></span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: A.bg4 }}>
                          <div className="h-full rounded-full" style={{ width: pct(r.val, health.retention.total), background: r.color }} />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 grid grid-cols-2 gap-2" style={{ borderTop: `1px solid ${A.border}` }}>
                      <div className="rounded-xl px-3 py-2" style={{ background: A.bg4 }}>
                        <p className="text-[10px]" style={{ color: A.text3 }}>Pending W/D</p>
                        <p className="text-sm font-black mono mt-0.5" style={{ color: health.pendingWithdrawals.c > 0 ? A.red : A.text3 }}>{health.pendingWithdrawals.c} <span className="text-[10px] font-normal">({fmt(health.pendingWithdrawals.s)})</span></p>
                      </div>
                      <div className="rounded-xl px-3 py-2" style={{ background: A.bg4 }}>
                        <p className="text-[10px]" style={{ color: A.text3 }}>Net Flow (all time)</p>
                        <p className="text-sm font-black mono mt-0.5" style={{ color: A.green }}>{fmt(health.totals.total_deposited - health.totals.total_withdrawn)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Earners */}
                <div className="rounded-2xl overflow-hidden" style={{ background: A.card, border: `1px solid ${A.border}` }}>
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${A.border}`, background: A.bg3 }}>
                    <p className="text-xs font-bold" style={{ color: A.text }}>Top 10 Earners</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ minWidth: 600 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                          {['#', 'User', 'VIP', 'Balance', 'Total Earned', 'Deposited', 'Days Active'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase" style={{ color: A.text3, background: A.bg3 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {health.topEarners.map((u, i) => (
                          <tr key={u.id} style={{ borderBottom: `1px solid ${A.border}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = A.bg3)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td className="px-3 py-2.5 mono font-black text-sm" style={{ color: i < 3 ? A.yellow : A.text3 }}>#{i + 1}</td>
                            <td className="px-3 py-2.5">
                              <p className="font-semibold" style={{ color: A.text }}>{u.full_name}</p>
                              <p className="text-[10px]" style={{ color: A.text3 }}>{u.email}</p>
                            </td>
                            <td className="px-3 py-2.5"><span className="text-[10px] font-bold" style={{ color: VIP_COLOR[u.vip_level] }}>{u.vip_level}</span></td>
                            <td className="px-3 py-2.5 mono font-bold" style={{ color: A.green }}>{fmt(u.balance)}</td>
                            <td className="px-3 py-2.5 mono font-bold" style={{ color: A.yellow }}>{fmt(u.total_earned)}</td>
                            <td className="px-3 py-2.5 mono" style={{ color: A.text2 }}>{fmt(u.total_deposited)}</td>
                            <td className="px-3 py-2.5 mono" style={{ color: A.cyan }}>{u.active_days}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Hourly bot activity today */}
                {health.hourlyBots.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ background: A.card, border: `1px solid ${A.border}` }}>
                    <p className="text-xs font-bold mb-4" style={{ color: A.text }}>Bot Sessions by Hour — Today</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={health.hourlyBots}>
                        <XAxis dataKey="hour" tick={{ fontSize: 9, fill: A.text3 }} tickLine={false} axisLine={false} tickFormatter={h => `${h}:00`} />
                        <YAxis tick={{ fontSize: 9, fill: A.text3 }} tickLine={false} axisLine={false} width={20} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: A.bg3, border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: A.text }} formatter={(v: number | undefined) => [v ?? 0, 'Sessions']} />
                        <Bar dataKey="count" fill={A.cyan} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>);
            })()}
          </div>
        )}
      </div>

      {/* ── KYC Modal ── */}
      {kycActionTarget && (
        <Modal
          title={`${kycActionTarget.type === 'approve' ? 'Approve' : 'Reject'} KYC #${kycActionTarget.id}`}
          icon={kycActionTarget.type === 'approve' ? CheckCircle : XCircle}
          iconColor={kycActionTarget.type === 'approve' ? A.green : A.red}
          onClose={() => { setKycActionTarget(null); setKycActionNote(''); }}>
          <div className="space-y-4">
            <p className="text-xs leading-relaxed" style={{ color: A.text2 }}>
              {kycActionTarget.type === 'approve'
                ? 'Approve this KYC submission. The user will be marked as verified.'
                : 'Reject this submission. The user will be prompted to re-submit.'}
            </p>
            {kycActionTarget.type === 'reject' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: A.text2 }}>Reason (optional)</label>
                <input type="text" value={kycActionNote} onChange={e => setKycActionNote(e.target.value)}
                  placeholder="e.g. ID expired, image blurry"
                  className="w-full text-xs px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: A.bg, border: `1px solid ${A.border}`, color: A.text }} />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setKycActionTarget(null); setKycActionNote(''); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: A.bg4, border: `1px solid ${A.border}`, color: A.text2 }}>Cancel</button>
              <button onClick={handleKycAction}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold capitalize"
                style={kycActionTarget.type === 'approve' ? { background: A.green, color: '#000' } : { background: A.red, color: '#fff' }}>
                Confirm {kycActionTarget.type}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Withdrawal Modal ── */}
      {actionTarget && (
        <Modal
          title={`${actionTarget.type === 'approve' ? 'Approve' : 'Reject'} Withdrawal #${actionTarget.id}`}
          icon={actionTarget.type === 'approve' ? CheckCircle : XCircle}
          iconColor={actionTarget.type === 'approve' ? A.green : A.red}
          onClose={() => { setActionTarget(null); setActionNote(''); }}>
          <div className="space-y-4">
            <p className="text-xs leading-relaxed" style={{ color: A.text2 }}>
              {actionTarget.type === 'approve'
                ? "Confirm you've sent the USDT to the user's wallet. This marks the request as completed."
                : 'Reject and refund the amount to the user balance.'}
            </p>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: A.text2 }}>Admin note (optional)</label>
              <input type="text" value={actionNote} onChange={e => setActionNote(e.target.value)}
                placeholder={actionTarget.type === 'approve' ? 'e.g. TxID: abc123…' : 'e.g. Suspicious activity'}
                className="w-full text-xs px-3 py-2.5 rounded-xl outline-none"
                style={{ background: A.bg, border: `1px solid ${A.border}`, color: A.text }} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setActionTarget(null); setActionNote(''); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: A.bg4, border: `1px solid ${A.border}`, color: A.text2 }}>Cancel</button>
              <button onClick={handleWithdrawalAction}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold capitalize"
                style={actionTarget.type === 'approve' ? { background: A.green, color: '#000' } : { background: A.red, color: '#fff' }}>
                Confirm {actionTarget.type}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteConfirm !== null && (
        <Modal title="Delete User" icon={Trash2} iconColor={A.red} onClose={() => setDeleteConfirm(null)}>
          <div className="space-y-4">
            <p className="text-xs leading-relaxed" style={{ color: A.text2 }}>
              Permanently delete user <span className="font-bold" style={{ color: A.text }}>#{deleteConfirm}</span> and all their data? This cannot be undone.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: A.bg4, border: `1px solid ${A.border}`, color: A.text2 }}>Cancel</button>
              <button onClick={() => deleteUser(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: A.red, color: '#fff' }}>Delete Permanently</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
