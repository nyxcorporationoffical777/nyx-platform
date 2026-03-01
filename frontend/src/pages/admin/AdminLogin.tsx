import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const A = {
  bg:    '#09090f',
  bg2:   '#0f0f17',
  bg3:   '#14141e',
  bg4:   '#1a1a25',
  card:  '#111119',
  border:'rgba(255,255,255,0.07)',
  text:  '#f1f1f5',
  text2: '#9191a8',
  text3: '#52525e',
  red:   '#f43f5e',
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/login`, form);
      localStorage.setItem('admin_token', r.data.token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: A.bg }}>
      <div className="w-full max-w-[360px]">

        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${A.red}18`, border: `1px solid ${A.red}30` }}>
            <Shield size={22} style={{ color: A.red }} />
          </div>
          <div className="text-center">
            <p className="text-base font-black" style={{ color: A.text }}>NYX Admin</p>
            <p className="text-xs mt-0.5" style={{ color: A.text3 }}>Restricted Control Panel</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: A.card, border: `1px solid ${A.border}` }}>
          {/* Header bar */}
          <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: A.bg3, borderBottom: `1px solid ${A.border}` }}>
            <Lock size={12} style={{ color: A.red }} />
            <span className="text-xs font-semibold" style={{ color: A.text2 }}>Administrator Access Only</span>
          </div>

          <div className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
                style={{ background: `${A.red}12`, border: `1px solid ${A.red}25`, color: A.red }}>
                <AlertTriangle size={12} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: A.text2 }}>Username</label>
                <input
                  type="text" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="admin"
                  required
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none transition-all"
                  style={{ background: A.bg, border: `1px solid ${A.border}`, color: A.text }}
                  onFocus={e => (e.target.style.borderColor = A.red)}
                  onBlur={e => (e.target.style.borderColor = A.border)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: A.text2 }}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full text-sm px-3 py-2.5 pr-10 rounded-xl outline-none transition-all"
                    style={{ background: A.bg, border: `1px solid ${A.border}`, color: A.text }}
                    onFocus={e => (e.target.style.borderColor = A.red)}
                    onBlur={e => (e.target.style.borderColor = A.border)}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: A.text3 }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-bold mt-1 transition-all"
                style={{ background: A.red, color: '#fff', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Authenticating…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] mt-4" style={{ color: A.text3 }}>
          Unauthorized access is prohibited and monitored.
        </p>
      </div>
    </div>
  );
}
