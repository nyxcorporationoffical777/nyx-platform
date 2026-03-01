import { Github, Linkedin, Twitter } from 'lucide-react';

const TEAM = [
  {
    name: 'Alexander Reid',
    role: 'CEO & Co-Founder',
    bio: 'Former quant trader at Goldman Sachs with 12 years in algorithmic finance. Built QuantifyPro to democratize yield generation.',
    avatar: 'AR',
    gradient: 'from-cyan-400 to-blue-600',
    linkedin: '#', twitter: '#', github: '#',
  },
  {
    name: 'Sofia Marchetti',
    role: 'CTO & Co-Founder',
    bio: 'PhD in Computer Science from MIT. Expert in distributed systems and high-frequency trading infrastructure.',
    avatar: 'SM',
    gradient: 'from-purple-400 to-violet-600',
    linkedin: '#', twitter: '#', github: '#',
  },
  {
    name: 'James Okafor',
    role: 'Head of Quantitative Research',
    bio: 'Former portfolio manager with deep expertise in statistical arbitrage and machine learning-driven strategies.',
    avatar: 'JO',
    gradient: 'from-green-400 to-emerald-600',
    linkedin: '#', twitter: '#', github: '#',
  },
  {
    name: 'Priya Sharma',
    role: 'Chief Risk Officer',
    bio: 'Certified FRM with 10 years of risk management experience across hedge funds and fintech startups.',
    avatar: 'PS',
    gradient: 'from-yellow-400 to-orange-500',
    linkedin: '#', twitter: '#', github: '#',
  },
  {
    name: 'Lucas Fernandez',
    role: 'Lead Backend Engineer',
    bio: 'Full-stack engineer specializing in real-time financial systems, API architecture, and cloud infrastructure.',
    avatar: 'LF',
    gradient: 'from-red-400 to-rose-600',
    linkedin: '#', twitter: '#', github: '#',
  },
  {
    name: 'Mei Lin',
    role: 'Head of Product & UX',
    bio: 'Product designer with a passion for making complex financial tools simple and accessible to everyone.',
    avatar: 'ML',
    gradient: 'from-pink-400 to-fuchsia-600',
    linkedin: '#', twitter: '#', github: '#',
  },
];

export default function Team() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Our Team</h1>
        <p className="text-slate-400 text-sm mt-1">The people behind QuantifyPro</p>
      </div>

      <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-black text-white mb-3">
          Built by <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Experts</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Our team combines decades of experience in quantitative finance, software engineering, and product design
          to deliver a world-class yield generation platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEAM.map((member) => (
          <div
            key={member.name}
            className="bg-[#0d1526] border border-[#1e2d4a] rounded-2xl p-6 hover:border-white/20 transition-all hover:-translate-y-1 group"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg`}>
                {member.avatar}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{member.name}</h3>
                <p className={`text-sm font-medium mt-0.5 bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent`}>
                  {member.role}
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-5">{member.bio}</p>

            <div className="flex items-center gap-3 pt-4 border-t border-[#1e2d4a]">
              <a
                href={member.linkedin}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
              >
                <Linkedin size={15} />
              </a>
              <a
                href={member.twitter}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-all"
              >
                <Twitter size={15} />
              </a>
              <a
                href={member.github}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <Github size={15} />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-8 text-center">
        <h3 className="text-white font-bold text-xl mb-2">Join Our Team</h3>
        <p className="text-slate-400 text-sm mb-4">
          We're always looking for talented individuals passionate about fintech and quantitative finance.
        </p>
        <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
          View Open Positions
        </button>
      </div>
    </div>
  );
}
