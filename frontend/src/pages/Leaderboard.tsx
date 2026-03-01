import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Trophy, TrendingUp, Users, DollarSign, Zap, Activity, Crown, Gift, Star, ChevronRight, CheckCircle, Lock, BarChart2, Bot, Target, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VIP_COLOR: Record<string, string> = {
  Starter: '#848e9c', Silver: '#b7bdc8', Gold: '#f0b90b', Platinum: '#00b8d9', Diamond: '#a855f7',
};
const VIP_ICON: Record<string, string> = {
  Starter: '⚡', Silver: '🔷', Gold: '🔶', Platinum: '🌐', Diamond: '🚀',
};

// Seeded fake top performers — always shown to make leaderboard look active
const SEED_USERS: Omit<LeaderEntry, 'rank'>[] = [
  { display_name: 'A***x',  vip_level: 'Diamond',  total_earned: 48320.00, total_deposited: 50000, active_days: 142, is_me: false },
  { display_name: 'M***a',  vip_level: 'Diamond',  total_earned: 41750.80, total_deposited: 45000, active_days: 138, is_me: false },
  { display_name: 'Z***n',  vip_level: 'Diamond',  total_earned: 38940.50, total_deposited: 40000, active_days: 130, is_me: false },
  { display_name: 'J***s',  vip_level: 'Diamond',  total_earned: 35210.20, total_deposited: 38000, active_days: 125, is_me: false },
  { display_name: 'L***i',  vip_level: 'Platinum', total_earned: 28650.00, total_deposited: 30000, active_days: 118, is_me: false },
  { display_name: 'R***o',  vip_level: 'Platinum', total_earned: 24180.60, total_deposited: 25000, active_days: 112, is_me: false },
  { display_name: 'K***h',  vip_level: 'Platinum', total_earned: 21340.90, total_deposited: 22000, active_days: 107, is_me: false },
  { display_name: 'S***e',  vip_level: 'Platinum', total_earned: 19820.40, total_deposited: 20000, active_days: 103, is_me: false },
  { display_name: 'D***v',  vip_level: 'Gold',     total_earned: 16540.00, total_deposited: 18000, active_days: 98,  is_me: false },
  { display_name: 'N***a',  vip_level: 'Gold',     total_earned: 14210.75, total_deposited: 15000, active_days: 94,  is_me: false },
  { display_name: 'T***r',  vip_level: 'Gold',     total_earned: 12870.30, total_deposited: 13500, active_days: 90,  is_me: false },
  { display_name: 'Y***i',  vip_level: 'Gold',     total_earned: 11320.80, total_deposited: 12000, active_days: 87,  is_me: false },
  { display_name: 'C***l',  vip_level: 'Gold',     total_earned: 9840.60,  total_deposited: 10500, active_days: 82,  is_me: false },
  { display_name: 'P***s',  vip_level: 'Silver',   total_earned: 7650.20,  total_deposited: 8000,  active_days: 76,  is_me: false },
  { display_name: 'F***n',  vip_level: 'Silver',   total_earned: 6430.90,  total_deposited: 7000,  active_days: 71,  is_me: false },
];

interface LeaderEntry {
  rank: number;
  display_name: string;
  vip_level: string;
  total_earned: number;
  total_deposited: number;
  active_days: number;
  is_me: boolean;
}

interface Stats {
  total_users: number;
  total_yield: number;
  total_deposited: number;
  avg_earned: number;
  active_bots: number;
}
interface MyInfo {
  vip_level: string;
  total_earned: number;
  active_days: number;
}

interface Bonus {
  id: string; title: string; desc: string; type: string;
  amount: number; claimed: boolean; claimed_at: string | null; claimed_amount: number | null;
}
interface Mission {
  id: string; title: string; desc: string; category: string; type: string;
  target: number; reward: number; icon: string;
  progress: number; completed: boolean; claimed: boolean; period: string;
}

const MISSION_ICON: Record<string, React.ElementType> = {
  bot: Bot, dollar: DollarSign, users: Users, chart: BarChart2,
};
const BONUS_META: Record<string, { color: string; badge: string; badgeColor: string; icon: React.ElementType }> = {
  first_deposit: { color: '#f0b90b', badge: 'HOT',     badgeColor: '#f6465d', icon: Gift },
  vip_gold:      { color: '#f0b90b', badge: 'VIP',     badgeColor: '#f0b90b', icon: Star },
  vip_platinum:  { color: '#00b8d9', badge: 'VIP',     badgeColor: '#00b8d9', icon: Star },
  vip_diamond:   { color: '#a855f7', badge: 'VIP',     badgeColor: '#a855f7', icon: Star },
  loyalty_7:     { color: '#0ecb81', badge: 'STREAK',  badgeColor: '#0ecb81', icon: Trophy },
  referral:      { color: '#0ecb81', badge: 'FOREVER', badgeColor: '#0ecb81', icon: Users },
};

export default function Leaderboard() {
  const { refreshUser } = useAuth();
  const [realBoard, setRealBoard] = useState<LeaderEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [myRank, setMyRank] = useState<number>(0);
  const [me, setMe] = useState<MyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'leaderboard' | 'bonuses' | 'missions'>('leaderboard');

  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [bonusesLoading, setBonusesLoading] = useState(false);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState<string>('');

  const loadBonuses = useCallback(async () => {
    setBonusesLoading(true);
    try { const r = await api.get('/bonuses'); setBonuses(r.data.bonuses); } catch {}
    finally { setBonusesLoading(false); }
  }, []);

  const loadMissions = useCallback(async () => {
    setMissionsLoading(true);
    try { const r = await api.get('/bonuses/missions'); setMissions(r.data.missions); } catch {}
    finally { setMissionsLoading(false); }
  }, []);

  const claimMission = async (id: string) => {
    setClaimingId(id);
    try {
      const r = await api.post(`/bonuses/missions/${id}/claim`);
      setClaimMsg(r.data.message);
      await loadMissions();
      await refreshUser();
      setTimeout(() => setClaimMsg(''), 4000);
    } catch (e: any) {
      setClaimMsg(e.response?.data?.error || 'Claim failed');
      setTimeout(() => setClaimMsg(''), 3000);
    } finally { setClaimingId(null); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [lb, st] = await Promise.all([
          api.get('/leaderboard'),
          api.get('/leaderboard/stats'),
        ]);
        setRealBoard(lb.data.leaderboard);
        setMyRank(lb.data.my_rank);
        setMe(lb.data.me);
        setStats(st.data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (tab === 'bonuses') loadBonuses(); }, [tab, loadBonuses]);
  useEffect(() => {
    if (tab === 'missions') {
      loadMissions();
      // Mark markets visit mission
      api.post('/bonuses/missions/mark-visit').catch(() => {});
    }
  }, [tab, loadMissions]);

  // Merge seed users + real DB users, sort by total_earned, re-rank
  const merged: LeaderEntry[] = [...SEED_USERS, ...realBoard]
    .sort((a, b) => b.total_earned - a.total_earned)
    .slice(0, 20)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  // Adjust my rank to account for seed users above me
  const seedAboveMe = SEED_USERS.filter(s => s.total_earned > (me?.total_earned ?? 0)).length;
  const adjustedMyRank = myRank + seedAboveMe;

  const rankMedal = (r: number) => {
    if (r === 1) return <Crown size={14} style={{ color: '#f0b90b' }} />;
    if (r === 2) return <Crown size={14} style={{ color: '#b7bdc8' }} />;
    if (r === 3) return <Crown size={14} style={{ color: '#cd7f32' }} />;
    return <span className="mono font-bold text-xs" style={{ color: 'var(--text3)' }}>#{r}</span>;
  };

  // Augmented stats to include seeded users
  const augStats = stats ? {
    ...stats,
    total_users: stats.total_users + SEED_USERS.length,
    total_yield: (stats.total_yield || 0) + SEED_USERS.reduce((s, u) => s + u.total_earned, 0),
    total_deposited: (stats.total_deposited || 0) + SEED_USERS.reduce((s, u) => s + u.total_deposited, 0),
  } : null;

  return (
    <div className="min-w-0 w-full p-5 space-y-5">

      {/* Header + tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-black text-white flex items-center gap-2">
            <Trophy size={16} style={{ color: 'var(--yellow)' }} />
            Leaderboard & Bonuses
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Top earners · Active promotions · Rewards</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg self-start sm:self-auto" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          {([
            { key: 'leaderboard', label: '🏆', full: 'Leaderboard' },
            { key: 'bonuses',     label: '🎁', full: 'Bonuses' },
            { key: 'missions',    label: '🎯', full: 'Missions' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3 py-1.5 rounded text-xs font-bold transition-all"
              style={tab === t.key
                ? { background: 'var(--yellow)', color: '#000' }
                : { color: 'var(--text2)', background: 'transparent' }}>
              <span className="sm:hidden">{t.label} {t.full}</span>
              <span className="hidden sm:inline">{t.label} {t.full}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── LEADERBOARD TAB ── */}
      {tab === 'leaderboard' && <>

        {/* Platform stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Users,      label: 'Total Users',    value: (augStats?.total_users ?? 124800).toLocaleString(), color: '#f0b90b' },
            { icon: DollarSign, label: 'Total Yield',    value: `$${((augStats?.total_yield ?? 0) / 1000).toFixed(1)}K`, color: '#0ecb81' },
            { icon: TrendingUp, label: 'Deposited',      value: `$${((augStats?.total_deposited ?? 0) / 1000).toFixed(1)}K`, color: '#00b8d9' },
            { icon: Activity,   label: 'Avg Earned',     value: `$${(augStats?.avg_earned ?? 0).toFixed(0)}`, color: '#a855f7' },
            { icon: Zap,        label: 'Active Engines', value: (augStats?.active_bots ?? 0).toLocaleString(), color: '#f0b90b' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--bg2)', border: `1px solid ${s.color}22` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}18` }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-sm font-black text-white mono">{s.value}</p>
                <p style={{ color: 'var(--text3)', fontSize: 10 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My rank */}
        {me && (
          <div className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.25)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-sm"
              style={{ background: 'var(--yellow)' }}>#{adjustedMyRank}</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Your Global Rank</p>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                <span style={{ color: VIP_COLOR[me.vip_level] }}>{VIP_ICON[me.vip_level]} {me.vip_level}</span>
                {' · '}Earned: <span className="font-bold mono" style={{ color: 'var(--green)' }}>${me.total_earned.toFixed(2)}</span>
                {' · '}{me.active_days} active days
              </p>
            </div>
            <TrendingUp size={20} style={{ color: 'var(--yellow)' }} />
          </div>
        )}

        {/* Podium top 3 */}
        {!loading && merged.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {[merged[1], merged[0], merged[2]].map((entry, i) => {
              const pos = i === 0 ? 2 : i === 1 ? 1 : 3;
              const heights = ['pt-6', 'pt-0', 'pt-10'];
              const vc = VIP_COLOR[entry.vip_level];
              return (
                <div key={i} className={`rounded-xl p-4 flex flex-col items-center card-hover ${heights[i]}`}
                  style={{
                    background: entry.is_me ? 'rgba(240,185,11,0.08)' : 'var(--bg2)',
                    border: `1px solid ${pos === 1 ? 'rgba(240,185,11,0.4)' : pos === 2 ? 'rgba(183,189,200,0.3)' : 'rgba(205,127,50,0.3)'}`,
                    minHeight: 120,
                  }}>
                  <div className="mb-2">{rankMedal(pos)}</div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black mb-1"
                    style={{ background: `${vc}22`, color: vc }}>{entry.display_name[0]}</div>
                  <p className="text-xs font-bold text-white">{entry.display_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: vc }}>{VIP_ICON[entry.vip_level]} {entry.vip_level}</p>
                  <p className="text-xs font-black mono mt-1" style={{ color: 'var(--green)' }}>${entry.total_earned.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        <div className="ex-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
            <span className="text-xs font-bold text-white">Top 20 Earners</span>
            <span className="text-xs" style={{ color: 'var(--text3)' }}>Anonymized · Refreshes every 30s</span>
          </div>
          {loading ? (
            <div className="py-10 text-center text-xs" style={{ color: 'var(--text3)' }}>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 560 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Rank', 'User', 'VIP Tier', 'Total Earned', 'Deposited', 'Active Days'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--text3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {merged.map(e => (
                    <tr key={`${e.rank}-${e.display_name}`} className="ex-row"
                      style={e.is_me ? { background: 'rgba(240,185,11,0.06)' } : {}}>
                      <td className="px-4 py-3">{rankMedal(e.rank)}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {e.display_name}
                        {e.is_me && <span className="ml-2 px-1.5 py-0.5 rounded text-black font-black"
                          style={{ background: 'var(--yellow)', fontSize: 9 }}>YOU</span>}
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ color: VIP_COLOR[e.vip_level] }}>
                        {VIP_ICON[e.vip_level]} {e.vip_level}
                      </td>
                      <td className="px-4 py-3 font-black mono" style={{ color: 'var(--green)' }}>
                        ${e.total_earned.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 mono" style={{ color: 'var(--text2)' }}>
                        ${e.total_deposited.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 mono" style={{ color: 'var(--text2)' }}>{e.active_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>}

      {/* ── BONUSES TAB ── */}
      {tab === 'bonuses' && (
        <div className="space-y-4">
          {/* Banner */}
          <div className="relative rounded-xl p-5 overflow-hidden flex items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(240,185,11,0.12) 0%, rgba(14,203,129,0.06) 100%)', border: '1px solid rgba(240,185,11,0.25)' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gift size={16} style={{ color: 'var(--yellow)' }} />
                <span className="text-sm font-black text-white">Auto-Credited Bonuses</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-black" style={{ background: 'var(--green)' }}>LIVE</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                Bonuses are automatically credited when you qualify — no action needed.
              </p>
            </div>
            <button onClick={loadBonuses} className="p-2 rounded-lg flex-shrink-0"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <RefreshCw size={13} className={bonusesLoading ? 'animate-spin' : ''} style={{ color: 'var(--text2)' }} />
            </button>
          </div>

          {bonusesLoading && bonuses.length === 0 ? (
            <div className="py-10 text-center text-xs" style={{ color: 'var(--text3)' }}>Loading bonuses...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {bonuses.map(b => {
                const meta = BONUS_META[b.id] ?? { color: '#f0b90b', badge: 'BONUS', badgeColor: '#f0b90b', icon: Gift };
                const BIcon = meta.icon;
                return (
                  <div key={b.id} className="rounded-xl p-5"
                    style={{ background: 'var(--bg2)', border: `1px solid ${b.claimed ? 'rgba(14,203,129,0.3)' : meta.color + '33'}`,
                      opacity: b.claimed ? 0.8 : 1 }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                          style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}33` }}>
                          <BIcon size={18} style={{ color: b.claimed ? 'var(--green)' : meta.color }} />
                          {b.claimed && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--green)' }}>
                              <CheckCircle size={9} color="#000" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{b.title}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: b.claimed ? 'var(--green)' : meta.color }}>
                            {b.claimed ? `✓ Claimed $${b.claimed_amount?.toFixed(2)}` : `+$${b.amount.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black flex-shrink-0"
                        style={b.claimed
                          ? { background: 'rgba(14,203,129,0.15)', color: 'var(--green)', border: '1px solid rgba(14,203,129,0.3)' }
                          : { background: `${meta.badgeColor}22`, color: meta.badgeColor, border: `1px solid ${meta.badgeColor}44` }}>
                        {b.claimed ? 'CREDITED' : meta.badge}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{b.desc}</p>
                    {b.claimed && b.claimed_at && (
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>
                        Credited on {new Date(b.claimed_at).toLocaleDateString()}
                      </p>
                    )}
                    {!b.claimed && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                        style={{ background: `${meta.color}0d`, border: `1px solid ${meta.color}22`, color: 'var(--text3)' }}>
                        <Lock size={10} style={{ color: meta.color, flexShrink: 0 }} />
                        Auto-credited when you qualify. No claim needed.
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Referral bonus — always shown as active */}
              <div className="rounded-xl p-5" style={{ background: 'var(--bg2)', border: '1px solid rgba(14,203,129,0.33)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(14,203,129,0.12)', border: '1px solid rgba(14,203,129,0.3)' }}>
                      <Users size={18} style={{ color: 'var(--green)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Referral Commission</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--green)' }}>5% per referral session</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black"
                    style={{ background: 'rgba(14,203,129,0.15)', color: 'var(--green)', border: '1px solid rgba(14,203,129,0.3)' }}>FOREVER</span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                  Earn 5% of every yield session completed by your referrals — paid automatically, forever, with no cap.
                </p>
                <Link to="/referrals" className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.25)', color: 'var(--green)' }}>
                  View Referrals <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-xl p-4 flex items-center justify-between gap-4"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(240,185,11,0.2)' }}>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <Star size={12} style={{ color: 'var(--yellow)' }} /> Need to grow your balance?
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Deposit more to unlock VIP bonuses.</p>
            </div>
            <Link to="/assets" className="btn-yellow px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 flex-shrink-0">
              Deposit <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      )}

      {/* ── MISSIONS TAB ── */}
      {tab === 'missions' && (
        <div className="space-y-4">
          {/* Claim message */}
          {claimMsg && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{ background: claimMsg.includes('$') ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.1)',
                border: `1px solid ${claimMsg.includes('$') ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)'}`,
                color: claimMsg.includes('$') ? 'var(--green)' : 'var(--red)' }}>
              {claimMsg.includes('$') ? <CheckCircle size={14} /> : <Target size={14} />}
              {claimMsg}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white">
              Complete missions to earn bonus USDT rewards
            </p>
            <button onClick={loadMissions} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs btn-outline">
              <RefreshCw size={11} className={missionsLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {(['daily', 'weekly', 'onetime'] as const).map(cat => {
            const catMissions = missions.filter(m => m.category === cat);
            if (catMissions.length === 0) return null;
            const catLabels = { daily: '📅 Daily', weekly: '📆 Weekly', onetime: '🏅 One-Time' };
            const catDescs = {
              daily: 'Resets every day at midnight UTC',
              weekly: 'Resets every Monday at midnight UTC',
              onetime: 'Complete once, earn forever',
            };
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{catLabels[cat]}</span>
                  <span className="text-xs" style={{ color: 'var(--text3)' }}>— {catDescs[cat]}</span>
                  <span className="ml-auto text-xs mono font-bold" style={{ color: 'var(--yellow)' }}>
                    {catMissions.filter(m => m.claimed).length}/{catMissions.length} done
                  </span>
                </div>
                <div className="space-y-2">
                  {catMissions.map(m => {
                    const MIcon = MISSION_ICON[m.icon] ?? Target;
                    const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
                    const isNum = typeof m.progress === 'number' && m.target > 1;
                    return (
                      <div key={m.id} className="rounded-xl p-4 flex items-center gap-4"
                        style={{
                          background: m.claimed ? 'rgba(14,203,129,0.05)' : 'var(--bg2)',
                          border: `1px solid ${m.claimed ? 'rgba(14,203,129,0.2)' : m.completed ? 'rgba(240,185,11,0.3)' : 'var(--border)'}`,
                        }}>
                        {/* Icon */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: m.claimed ? 'rgba(14,203,129,0.12)' : m.completed ? 'rgba(240,185,11,0.12)' : 'var(--bg3)',
                            border: `1px solid ${m.claimed ? 'rgba(14,203,129,0.25)' : m.completed ? 'rgba(240,185,11,0.25)' : 'var(--border)'}`,
                          }}>
                          {m.claimed
                            ? <CheckCircle size={15} style={{ color: 'var(--green)' }} />
                            : <MIcon size={15} style={{ color: m.completed ? 'var(--yellow)' : 'var(--text3)' }} />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-bold text-white truncate pr-2">{m.title}</p>
                            <p className="text-xs font-black flex-shrink-0"
                              style={{ color: m.claimed ? 'var(--green)' : 'var(--yellow)' }}>
                              +${m.reward.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs mb-2" style={{ color: 'var(--text3)', lineHeight: 1.4 }}>{m.desc}</p>
                          {/* Progress bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: m.claimed ? 'var(--green)' : m.completed ? 'var(--yellow)' : 'var(--text3)',
                                }} />
                            </div>
                            <span className="text-xs mono flex-shrink-0" style={{ color: 'var(--text3)', fontSize: 10 }}>
                              {isNum ? `${m.progress >= 1000 ? m.progress.toFixed(0) : m.progress.toFixed(m.progress % 1 === 0 ? 0 : 1)}/${m.target}` : `${pct}%`}
                            </span>
                          </div>
                        </div>

                        {/* Claim button */}
                        <div className="flex-shrink-0 ml-2">
                          {m.claimed ? (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                              style={{ background: 'rgba(14,203,129,0.1)', color: 'var(--green)', border: '1px solid rgba(14,203,129,0.2)' }}>
                              Claimed
                            </span>
                          ) : m.completed ? (
                            <button onClick={() => claimMission(m.id)}
                              disabled={claimingId === m.id}
                              className="text-xs font-black px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
                              style={{ background: 'var(--yellow)', color: '#000' }}>
                              {claimingId === m.id ? '...' : 'Claim'}
                            </button>
                          ) : (
                            <Lock size={13} style={{ color: 'var(--text3)' }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {missionsLoading && missions.length === 0 && (
            <div className="py-10 text-center text-xs" style={{ color: 'var(--text3)' }}>Loading missions...</div>
          )}
        </div>
      )}

    </div>
  );
}
