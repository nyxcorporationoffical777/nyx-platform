import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  Gift, Trophy, Target, CheckCircle, Lock, RefreshCw,
  Users, DollarSign, Bot, BarChart2, Star, Zap, ChevronRight, Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

const CAT_LABELS: Record<string, string> = { daily: '📅 Daily', weekly: '📆 Weekly', onetime: '🏅 One-Time' };
const CAT_DESCS: Record<string, string> = {
  daily: 'Resets every day at midnight UTC',
  weekly: 'Resets every Monday at midnight UTC',
  onetime: 'Complete once, claim forever',
};

export default function Rewards() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'missions' | 'bonuses'>('missions');

  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [bonusesLoading, setBonusesLoading] = useState(false);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimMsg, setClaimMsg] = useState('');

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

  useEffect(() => {
    loadMissions();
    loadBonuses();
    api.post('/bonuses/missions/mark-visit').catch(() => {});
  }, [loadMissions, loadBonuses]);

  const claimMission = async (id: string) => {
    setClaimingId(id);
    try {
      const r = await api.post(`/bonuses/missions/${id}/claim`);
      setClaimMsg(r.data.message);
      toast('success', 'Reward Claimed!', r.data.message);
      await loadMissions();
      await refreshUser();
      setTimeout(() => setClaimMsg(''), 4000);
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Claim failed';
      setClaimMsg(msg);
      toast('error', 'Claim Failed', msg);
      setTimeout(() => setClaimMsg(''), 3000);
    } finally { setClaimingId(null); }
  };

  const totalAvailable = missions.filter(m => m.completed && !m.claimed).length;
  const totalPotential = missions.filter(m => !m.claimed).reduce((s, m) => s + m.reward, 0);

  return (
    <div className="p-3 sm:p-4 space-y-4 fade-in min-w-0 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-black text-white flex items-center gap-2">
            <Gift size={16} style={{ color: 'var(--yellow)' }} /> Rewards Center
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
            Complete missions · Earn bonus USDT · Collect VIP bonuses
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg self-start sm:self-auto"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          {([
            { key: 'missions', label: '🎯 Missions' },
            { key: 'bonuses',  label: '🎁 Bonuses' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-1.5 rounded text-xs font-bold transition-all"
              style={tab === t.key
                ? { background: 'var(--brand-1)', color: '#fff' }
                : { color: 'var(--text2)', background: 'transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="section-label mb-1">Claimable Now</p>
          <p className="text-xl font-black mono" style={{ color: totalAvailable > 0 ? 'var(--green)' : 'var(--text3)' }}>
            {totalAvailable}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>missions ready</p>
        </div>
        <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="section-label mb-1">Still Earnable</p>
          <p className="text-xl font-black mono" style={{ color: 'var(--yellow)' }}>
            ${totalPotential.toFixed(2)}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>across all missions</p>
        </div>
        <div className="hidden sm:block rounded-xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="section-label mb-1">Referral Rate</p>
          <p className="text-xl font-black mono" style={{ color: 'var(--brand-1)' }}>5%</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>per referral · forever</p>
        </div>
      </div>

      {/* Claim message */}
      {claimMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{
            background: claimMsg.includes('$') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.08)',
            border: `1px solid ${claimMsg.includes('$') ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.2)'}`,
            color: claimMsg.includes('$') ? 'var(--green)' : 'var(--red)',
          }}>
          {claimMsg.includes('$') ? <CheckCircle size={14} /> : <Target size={14} />}
          {claimMsg}
        </div>
      )}

      {/* ── MISSIONS TAB ── */}
      {tab === 'missions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white">Complete missions to earn bonus USDT</p>
            <button onClick={loadMissions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs btn-outline">
              <RefreshCw size={11} className={missionsLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {(['daily', 'weekly', 'onetime'] as const).map(cat => {
            const catMissions = missions.filter(m => m.category === cat);
            if (catMissions.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{CAT_LABELS[cat]}</span>
                  <span className="text-xs" style={{ color: 'var(--text3)' }}>— {CAT_DESCS[cat]}</span>
                  <span className="ml-auto text-xs mono font-bold" style={{ color: 'var(--yellow)' }}>
                    {catMissions.filter(m => m.claimed).length}/{catMissions.length} done
                  </span>
                </div>
                <div className="space-y-2">
                  {catMissions.map(m => {
                    const MIcon = MISSION_ICON[m.icon] || Target;
                    const pct = Math.min(100, (m.progress / m.target) * 100);
                    return (
                      <div key={m.id} className="rounded-xl p-4"
                        style={{
                          background: m.claimed ? 'var(--bg3)' : 'var(--bg-card)',
                          border: `1px solid ${m.completed && !m.claimed ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                          opacity: m.claimed ? 0.6 : 1,
                        }}>
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: m.claimed ? 'var(--bg4)' : m.completed ? 'rgba(16,185,129,0.12)' : 'var(--bg4)',
                              border: `1px solid ${m.completed && !m.claimed ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                            }}>
                            {m.claimed
                              ? <CheckCircle size={15} style={{ color: 'var(--green)' }} />
                              : <MIcon size={15} style={{ color: m.completed ? 'var(--green)' : 'var(--brand-1)' }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[13px] font-bold text-white">{m.title}</p>
                                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>{m.desc}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-[13px] font-black mono" style={{ color: 'var(--green)' }}>
                                  +${m.reward.toFixed(2)}
                                </p>
                                {!m.claimed && (
                                  <p className="text-[10px] mono" style={{ color: 'var(--text3)' }}>
                                    {m.progress}/{m.target}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Progress bar */}
                            {!m.claimed && (
                              <div className="mt-2.5">
                                <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg4)' }}>
                                  <div className="h-1.5 rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: m.completed ? 'var(--green)' : 'var(--brand-1)' }} />
                                </div>
                              </div>
                            )}
                          </div>
                          {m.completed && !m.claimed && (
                            <button
                              onClick={() => claimMission(m.id)}
                              disabled={claimingId === m.id}
                              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                              style={{ background: 'var(--green)', color: '#000' }}>
                              {claimingId === m.id
                                ? <RefreshCw size={11} className="animate-spin" />
                                : 'Claim'}
                            </button>
                          )}
                          {m.claimed && (
                            <div className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: 'var(--bg4)', color: 'var(--text3)' }}>
                              Done ✓
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BONUSES TAB ── */}
      {tab === 'bonuses' && (
        <div className="space-y-4">
          <div className="relative rounded-xl p-5 overflow-hidden flex items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(240,185,11,0.1) 0%, rgba(14,203,129,0.05) 100%)', border: '1px solid rgba(240,185,11,0.2)' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Gift size={14} style={{ color: 'var(--yellow)' }} />
                <span className="text-sm font-black text-white">Auto-Credited Bonuses</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-black" style={{ background: 'var(--green)' }}>LIVE</span>
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
            <div className="grid md:grid-cols-2 gap-3">
              {bonuses.map(b => {
                const meta = BONUS_META[b.id] ?? { color: '#f0b90b', badge: 'BONUS', badgeColor: '#f0b90b', icon: Gift };
                const BIcon = meta.icon;
                return (
                  <div key={b.id} className="rounded-xl p-4"
                    style={{ background: 'var(--bg-card)', border: `1px solid ${b.claimed ? 'rgba(14,203,129,0.2)' : meta.color + '25'}`, opacity: b.claimed ? 0.8 : 1 }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center relative flex-shrink-0"
                          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                          <BIcon size={16} style={{ color: b.claimed ? 'var(--green)' : meta.color }} />
                          {b.claimed && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--green)' }}>
                              <CheckCircle size={9} color="#000" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-white">{b.title}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: b.claimed ? 'var(--green)' : meta.color }}>
                            {b.claimed ? `✓ Claimed $${b.claimed_amount?.toFixed(2)}` : `+$${b.amount.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black flex-shrink-0"
                        style={b.claimed
                          ? { background: 'rgba(14,203,129,0.12)', color: 'var(--green)', border: '1px solid rgba(14,203,129,0.25)' }
                          : { background: `${meta.badgeColor}18`, color: meta.badgeColor, border: `1px solid ${meta.badgeColor}35` }}>
                        {b.claimed ? 'CREDITED' : meta.badge}
                      </span>
                    </div>
                    <p className="text-[11px] mb-2" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{b.desc}</p>
                    {b.claimed && b.claimed_at && (
                      <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
                        Credited {new Date(b.claimed_at).toLocaleDateString()}
                      </p>
                    )}
                    {!b.claimed && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]"
                        style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}18`, color: 'var(--text3)' }}>
                        <Lock size={10} style={{ color: meta.color }} />
                        Auto-credited when you qualify. No claim needed.
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Referral bonus card */}
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid rgba(14,203,129,0.25)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.25)' }}>
                      <Users size={16} style={{ color: 'var(--green)' }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-white">Referral Commission</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--green)' }}>5% per referral · forever</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                    style={{ background: 'rgba(14,203,129,0.12)', color: 'var(--green)', border: '1px solid rgba(14,203,129,0.25)' }}>
                    FOREVER
                  </span>
                </div>
                <p className="text-[11px] mb-3" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                  Earn 5% of every yield session completed by your referrals — paid automatically, forever, with no cap.
                </p>
                <Link to="/referrals"
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(14,203,129,0.08)', border: '1px solid rgba(14,203,129,0.2)', color: 'var(--green)' }}>
                  View Referrals <ChevronRight size={12} />
                </Link>
              </div>

              {/* VIP bonuses promo */}
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid rgba(240,185,11,0.18)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={14} style={{ color: 'var(--yellow)' }} />
                  <p className="text-[13px] font-black text-white">VIP Tier Bonuses</p>
                </div>
                <p className="text-[11px] mb-3" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
                  Reach Gold, Platinum, or Diamond tier to unlock exclusive one-time bonus credits.
                </p>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Gold', color: '#f59e0b' },
                    { label: 'Platinum', color: '#06b6d4' },
                    { label: 'Diamond', color: '#8b5cf6' },
                  ].map(v => (
                    <span key={v.label} className="px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: `${v.color}12`, color: v.color, border: `1px solid ${v.color}25` }}>
                      {v.label}
                    </span>
                  ))}
                  <Zap size={11} style={{ color: 'var(--yellow)', marginLeft: 'auto' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
