import { Link } from 'react-router-dom';
import {
  TrendingUp, Shield, Zap, Users, ChevronRight, ArrowRight,
  BarChart2, Lock, Globe, Target, Cpu, Award, CheckCircle, Star,
  DollarSign, Activity, Eye, Layers, Rocket, Clock, Coins,
} from 'lucide-react';

const TIERS = [
  { name: 'Starter',  min: '$100',    rate: '1.80', color: '#6b7280' },
  { name: 'Silver',   min: '$500',    rate: '2.20', color: '#94a3b8' },
  { name: 'Gold',     min: '$2,000',  rate: '2.80', color: '#f59e0b' },
  { name: 'Platinum', min: '$5,000',  rate: '3.50', color: '#06b6d4' },
  { name: 'Diamond',  min: '$10,000', rate: '5.00', color: '#8b5cf6' },
];

const STATS = [
  { label: 'Active Users',      value: '124,800+', icon: Users,      color: 'var(--yellow)'  },
  { label: 'Yield Distributed', value: '$4.2M+',   icon: DollarSign, color: 'var(--green)'   },
  { label: 'System Uptime',     value: '99.97%',   icon: Activity,   color: 'var(--cyan)'    },
  { label: 'Avg Daily Return',  value: '3.06%',    icon: TrendingUp, color: 'var(--purple2)' },
];

const MARKETS = [
  { sym: 'BTC/USDT', price: '67,234.50', chg: '+2.41%', vol: '1.24B', up: true },
  { sym: 'ETH/USDT', price: '3,521.80',  chg: '+1.87%', vol: '842M',  up: true },
  { sym: 'BNB/USDT', price: '412.30',    chg: '-0.54%', vol: '312M',  up: false },
  { sym: 'SOL/USDT', price: '178.90',    chg: '+4.12%', vol: '521M',  up: true },
  { sym: 'XRP/USDT', price: '0.6234',    chg: '-1.20%', vol: '198M',  up: false },
  { sym: 'ADA/USDT', price: '0.4521',    chg: '+0.88%', vol: '145M',  up: true },
];

const FEATURES = [
  { icon: Zap,    color: 'var(--yellow)',  title: 'One-Click Activation',   desc: 'Press START and the yield engine begins accumulating returns immediately. No manual trading required.' },
  { icon: Shield, color: 'var(--green)',   title: 'Secure & Transparent',   desc: 'Every transaction logged. Full history, real-time tracking, dual-password protection.' },
  { icon: Users,  color: 'var(--cyan)',    title: '5% Referral Commission', desc: 'Earn 5% of every yield session your referrals complete. Passive income layered on passive income.' },
  { icon: Cpu,    color: 'var(--purple2)', title: 'Algorithmic Engine',     desc: 'Quantitative strategies running 24/7, capturing yield opportunities across all market conditions.' },
  { icon: Award,  color: 'var(--brand-1)', title: 'VIP Tier Rewards',       desc: 'Advance through 5 tiers from Starter to Diamond. Each level unlocks higher daily yield rates.' },
  { icon: Globe,  color: 'var(--green)',   title: 'Global Accessibility',   desc: 'Available 24/7 worldwide. Deposit and withdraw in USDT, BTC, or ETH from anywhere.' },
];

const MISSION = [
  { icon: Target, color: 'var(--yellow)',  title: 'Our Mission',  desc: 'To democratize quantitative yield generation — making algorithmic finance accessible to everyone, not just institutions.' },
  { icon: Eye,    color: 'var(--green)',   title: 'Transparency', desc: 'Every cent is traceable. Full transaction logs, real-time balance updates, and clear fee structures with no hidden costs.' },
  { icon: Layers, color: 'var(--cyan)',    title: 'Technology',   desc: 'Powered by a proprietary quant engine that analyses market micro-structure to generate consistent daily yields.' },
  { icon: Rocket, color: 'var(--purple2)', title: 'Growth Focus', desc: 'Our tiered system rewards long-term commitment — the more you deposit, the higher your daily yield multiplier.' },
];

const TRUST = [
  { icon: Lock,        label: 'Funds Protected',   sub: 'Dual-auth security' },
  { icon: CheckCircle, label: 'Verified Platform', sub: 'Regulated structure' },
  { icon: Clock,       label: '24/7 Operations',   sub: 'Always online' },
  { icon: Coins,       label: 'Multi-Crypto',       sub: 'USDT · BTC · ETH' },
  { icon: Star,        label: 'Top Rated',          sub: '4.9 / 5.0 score' },
];

export default function Home() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 h-[60px] sticky top-0 z-50"
        style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand-1)' }}>
            <TrendingUp size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-black text-[13px] text-white tracking-[0.12em]">NYX</p>
            <p className="text-[9px] tracking-[0.08em] uppercase" style={{ color: 'var(--text3)' }}>Wealth Platform</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {[['Features','#features'],['VIP Tiers','#vip'],['Mission','#mission'],['Help','/help']].map(([l,h]) => (
            l === 'Help'
              ? <Link key={l} to={h} className="text-xs font-medium transition-colors hover:text-white" style={{ color: 'var(--text2)' }}>{l}</Link>
              : <a key={l} href={h} className="text-xs font-medium transition-colors hover:text-white" style={{ color: 'var(--text2)' }}>{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all hover:bg-white/5"
            style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>Sign In</Link>
          <Link to="/register" className="btn-yellow px-4 py-1.5 text-xs rounded-lg flex items-center gap-1.5">
            Get Started <ChevronRight size={12} />
          </Link>
        </div>
      </nav>

      {/* ── Market strip ── */}
      <div className="overflow-hidden" style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)', height: 36 }}>
        <div className="flex items-center h-full ticker-track" style={{ width: 'max-content' }}>
          {[...MARKETS, ...MARKETS].map((m, i) => (
            <div key={i} className="flex items-center gap-2 px-5 h-full" style={{ borderRight: '1px solid var(--border)' }}>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text2)' }}>{m.sym}</span>
              <span className="text-[11px] mono font-medium text-white">{m.price}</span>
              <span className="text-[11px] font-semibold" style={{ color: m.up ? 'var(--green)' : 'var(--red)' }}>{m.chg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" id="features" style={{ background: 'var(--bg)' }}>

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div className="fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
                style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.3)', color: 'var(--green)' }}>
                <div className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--green)' }} />
                Live Yield Engine Active — 124,800+ Users Earning Now
              </div>
              <h1 className="text-5xl lg:text-6xl font-black leading-none mb-6" style={{ letterSpacing: '-0.02em' }}>
                <span className="text-white">Algorithmic</span><br />
                <span className="grad-text">Yield Engine</span><br />
                <span className="text-white text-4xl lg:text-5xl font-bold">for Everyone</span>
              </h1>
              <p className="text-sm leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--text2)', lineHeight: '1.8' }}>
                Nyx runs a proprietary quantitative yield engine that generates daily returns on your balance.
                Choose your VIP tier, activate the engine, and collect yield — automatically, every day.
                Up to <strong style={{ color: 'var(--green)' }}>5.00% daily</strong> for Diamond members.
              </p>
              <div className="flex items-center gap-6 mb-8">
                {[{ v: 'Up to 5%', l: 'Daily yield' }, { v: '$100', l: 'Min deposit' }, { v: '24/7', l: 'Always running' }].map(m => (
                  <div key={m.l}>
                    <p className="text-xl font-black mono text-white">{m.v}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>{m.l}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Link to="/register" className="btn-yellow px-7 py-3 text-sm rounded-lg flex items-center gap-2 glow-yellow">
                  Start Earning <ChevronRight size={15} />
                </Link>
                <Link to="/login" className="btn-outline px-7 py-3 text-sm rounded-lg flex items-center gap-2">
                  Sign In <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right: Interactive yield cards with effects */}
            <div className="fade-in-up-2 space-y-4">
              {/* Live yield animation card */}
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500 hover:scale-[1.02]"
                style={{ 
                  background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 0 40px rgba(99,102,241,0.1)'
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)',
                  }} />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--green)', boxShadow: '0 0 20px var(--green)' }} />
                      <span className="text-xs font-bold text-white">Live Yield Engine</span>
                    </div>
                    <div className="text-xs font-medium" style={{ color: 'var(--green)' }}>Active Now</div>
                  </div>
                  
                  {/* Animated yield counter */}
                  <div className="text-center mb-6">
                    <div className="text-3xl font-black mono text-white mb-2">
                      <span className="inline-block animate-pulse" style={{ color: 'var(--green)' }}>$</span>
                      <span className="inline-block">124,800</span>
                      <span className="text-sm font-normal ml-1" style={{ color: 'var(--text3)' }}>users earning</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <TrendingUp size={12} style={{ color: 'var(--green)' }} />
                        <span style={{ color: 'var(--green)' }}>3.06% avg daily</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity size={12} style={{ color: 'var(--cyan)' }} />
                        <span style={{ color: 'var(--cyan)' }}>24/7 running</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive tier cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { tier: 'Gold', rate: '2.80%', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
                      { tier: 'Platinum', rate: '3.50%', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
                      { tier: 'Diamond', rate: '5.00%', color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
                    ].map((t, i) => (
                      <div key={t.tier} 
                        className="relative rounded-xl p-3 text-center transition-all duration-300 hover:scale-105 cursor-pointer group"
                        style={{ 
                          background: `linear-gradient(135deg, ${t.color}15 0%, ${t.color}08 100%)`,
                          border: `1px solid ${t.color}30`,
                          animation: `fadeInUp ${0.3 + i * 0.1}s ease-out`
                        }}>
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ 
                            background: `radial-gradient(circle at center, ${t.glow} 0%, transparent 70%)`,
                            filter: 'blur(8px)'
                          }} />
                        <div className="relative">
                          <p className="text-xs font-bold mb-1" style={{ color: t.color }}>{t.tier}</p>
                          <p className="text-lg font-black mono" style={{ color: t.color }}>{t.rate}</p>
                          <p className="text-[9px]" style={{ color: 'var(--text3)' }}>daily</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick stats cards with hover effects */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Yield', value: '$4.2M+', icon: DollarSign, color: 'var(--green)', trend: '+12.4%' },
                  { label: 'Uptime', value: '99.97%', icon: Activity, color: 'var(--cyan)', trend: 'Stable' },
                ].map((stat, i) => (
                  <div key={stat.label}
                    className="relative rounded-xl p-4 transition-all duration-300 hover:scale-[1.03] cursor-pointer group"
                    style={{ 
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      animation: `fadeInUp ${0.4 + i * 0.1}s ease-out`
                    }}>
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ 
                        background: `radial-gradient(circle at top right, ${stat.color}10 0%, transparent 60%)`,
                      }} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon size={16} style={{ color: stat.color }} />
                        <span className="text-xs font-medium" style={{ color: stat.color === 'var(--green)' ? 'var(--green)' : 'var(--cyan)' }}>
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-lg font-black mono text-white">{stat.value}</p>
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}33` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-black text-white mono">{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust badges ── */}
      <div style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {TRUST.map(t => (
            <div key={t.label} className="flex items-center gap-2">
              <t.icon size={13} style={{ color: 'var(--yellow)' }} />
              <span className="text-xs font-semibold text-white">{t.label}</span>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>· {t.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIP Tiers ── */}
      <section className="max-w-6xl mx-auto px-6 py-16" id="vip">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'var(--brand-dim)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--purple2)' }}>
            <Award size={11} /> VIP Tier System
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Higher Tier, Higher Yield</h2>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Deposit more, earn more — automatically every day</p>
        </div>
        <div className="grid md:grid-cols-5 gap-3 mb-6">
          {TIERS.map(t => (
            <div key={t.name} className="rounded-xl p-5 flex flex-col items-center text-center"
              style={{ background: 'var(--bg-card)', border: `1px solid var(--border)` }}>
              <div className="w-2 h-2 rounded-full mb-3" style={{ background: t.color }} />
              <p className="font-bold text-[13px] mb-1" style={{ color: t.color }}>{t.name}</p>
              <p className="text-[11px] mono mb-3" style={{ color: 'var(--text3)' }}>{t.min}+</p>
              <div className="w-full rounded-lg py-2 mb-2" style={{ background: 'var(--bg3)' }}>
                <p className="text-[17px] font-bold mono" style={{ color: 'var(--text)' }}>{t.rate}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text3)' }}>daily</p>
              </div>
              <p className="text-[11px] font-semibold" style={{ color: 'var(--green)' }}>
                ~{(parseFloat(t.rate) * 30).toFixed(0)}% / month
              </p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link to="/register" className="btn-yellow px-8 py-3 text-sm rounded-lg inline-flex items-center gap-2">
            Unlock Your Tier <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--brand-1)' }}>
              <Zap size={11} /> Core Features
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Why Choose Nyx</h2>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Built for performance, security, and simplicity</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} 
                className="group relative rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02] cursor-pointer overflow-hidden"
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)',
                  animation: `fadeInUp ${0.3 + i * 0.1}s ease-out`
                }}>
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    background: `radial-gradient(circle at top right, ${f.color}08 0%, transparent 60%)`,
                    filter: 'blur(20px)'
                  }} />
                
                {/* Border glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    background: `linear-gradient(135deg, ${f.color}15 0%, transparent 50%)`,
                    border: `1px solid ${f.color}30`
                  }} />
                
                <div className="relative">
                  {/* Animated icon container */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ 
                      background: `${f.color}12`, 
                      border: `1px solid ${f.color}25`,
                      boxShadow: `0 4px 20px ${f.color}20`
                    }}>
                    <f.icon size={20} style={{ color: f.color }} />
                  </div>
                  
                  <h3 className="font-bold text-white text-sm mb-2 group-hover:text-white transition-colors">{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)', lineHeight: '1.7' }}>{f.desc}</p>
                  
                  {/* Hover indicator */}
                  <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-medium" style={{ color: f.color }}>Learn more</span>
                    <ChevronRight size={12} style={{ color: f.color }} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-2">Get Started in 4 Steps</h2>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>From zero to earning in under 5 minutes</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { n: '01', icon: Users,     title: 'Register',  desc: 'Create your account in 60 seconds — no KYC required', color: '#4f6ef7' },
            { n: '02', icon: BarChart2, title: 'Deposit',   desc: 'Fund your account from $100 to unlock VIP tiers',      color: '#22c55e' },
            { n: '03', icon: Zap,       title: 'Activate',  desc: 'Press START — the quant engine begins running 24/7',   color: '#06b6d4' },
            { n: '04', icon: Globe,     title: 'Earn',      desc: 'Collect daily yield and withdraw to your crypto wallet', color: '#a855f7' },
          ].map((s, i) => (
            <div key={s.n} className="relative">
              <div className="rounded-xl p-5 card-hover h-full"
                style={{ background: 'var(--bg2)', border: `1px solid ${s.color}22` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}33` }}>
                    <s.icon size={17} style={{ color: s.color }} />
                  </div>
                  <span className="text-3xl font-black mono" style={{ color: `${s.color}30` }}>{s.n}</span>
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text3)', lineHeight: '1.7' }}>{s.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden md:flex absolute top-8 -right-2.5 z-10">
                  <ChevronRight size={16} style={{ color: 'var(--border2)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission Center ── */}
      <section style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} id="mission">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(14,203,129,0.1)', border: '1px solid rgba(14,203,129,0.25)', color: 'var(--green)' }}>
              <Target size={11} /> Mission Center
            </div>
            <h2 className="text-3xl font-black text-white mb-2">What Drives Nyx</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text3)', lineHeight: '1.8' }}>
              We believe sophisticated quantitative finance should be open to everyone — not just hedge funds and banks.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MISSION.map(m => (
              <div key={m.title} className="rounded-xl p-5 card-hover text-center"
                style={{ background: 'var(--bg3)', border: `1px solid ${m.color}22` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${m.color}18`, border: `1px solid ${m.color}33` }}>
                  <m.icon size={20} style={{ color: m.color }} />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{m.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)', lineHeight: '1.7' }}>{m.desc}</p>
              </div>
            ))}
          </div>

          {/* Mission statement quote */}
          <div className="mt-10 rounded-xl p-8 text-center relative overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="relative text-base font-semibold text-white mb-2" style={{ lineHeight: '1.8' }}>
              "Algorithmic yield, once reserved for institutional players, is now available to{' '}
              <span className="grad-text font-black">every Nyx user</span> — automatically, transparently, daily."
            </p>
            <p className="relative text-xs" style={{ color: 'var(--text3)' }}>— The Nyx Team</p>
          </div>
        </div>
      </section>

      {/* ── Accepted Crypto ── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl font-black text-white mb-1">Accepted Crypto Assets</h2>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>Deposit and withdraw with major cryptocurrencies</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { sym: 'USDT', name: 'Tether', nets: 'TRC-20 · ERC-20', color: '#26a17b', logo: '₮' },
            { sym: 'BTC',  name: 'Bitcoin',  nets: 'Bitcoin Network',  color: '#f7931a', logo: '₿' },
            { sym: 'ETH',  name: 'Ethereum', nets: 'ERC-20',           color: '#627eea', logo: 'Ξ' },
            { sym: 'BNB',  name: 'BNB',      nets: 'BEP-20',          color: '#f59e0b', logo: 'B' },
          ].map(c => (
            <div key={c.sym} className="rounded-xl p-4 flex items-center gap-3 card-hover"
              style={{ background: 'var(--bg2)', border: `1px solid ${c.color}33` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0"
                style={{ background: `${c.color}22`, color: c.color }}>{c.logo}</div>
              <div>
                <p className="font-bold text-white text-sm">{c.sym}</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>{c.name}</p>
                <p className="text-xs font-medium" style={{ color: c.color }}>{c.nets}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'var(--brand-dim)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--purple2)' }}>
            <div className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--green)' }} />
            Engine Online — Accepting New Members
          </div>
          <h2 className="text-4xl font-black text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            Ready to Start <span className="grad-text">Earning Daily?</span>
          </h2>
          <p className="text-sm mb-8 max-w-lg mx-auto" style={{ color: 'var(--text2)', lineHeight: '1.8' }}>
            Join 124,800+ users who are generating automated daily yield with the Nyx Quant Engine.
            No trading experience needed. Just deposit, activate, and earn.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="btn-yellow px-8 py-3.5 text-sm rounded-xl flex items-center gap-2">
              Create Free Account <Rocket size={15} />
            </Link>
            <Link to="/help" className="btn-outline px-8 py-3.5 text-sm rounded-xl flex items-center gap-2">
              Read the Guide <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-xs mt-6" style={{ color: 'var(--text3)' }}>
            Min. deposit $100 · No hidden fees · Withdraw anytime
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--brand-1)' }}>
                <TrendingUp size={13} color="#fff" strokeWidth={2.5} />
              </div>
              <span className="font-black text-white" style={{ letterSpacing: '0.1em' }}>NYX</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {[['Help & FAQ', '/help'], ['Sign In', '/login'], ['Register', '/register']].map(([l, h]) => (
                <Link key={l} to={h} className="text-xs transition-colors hover:text-white"
                  style={{ color: 'var(--text3)' }}>{l}</Link>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              © 2025 Nyx. Demonstrative yield platform. Trading involves risk.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full blink" style={{ background: 'var(--green)' }} />
                <span className="text-xs" style={{ color: 'var(--green)' }}>All systems operational</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>v2.4.1</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
