import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { TrendingUp, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(r => { setStatus('success'); setMessage(r.data.message); })
      .catch(e => { setStatus('error'); setMessage(e.response?.data?.error || 'Verification failed.'); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[380px] text-center space-y-6 fade-in">

        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-1)' }}>
            <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <p className="font-black text-[14px] text-white tracking-[0.1em]">NYX</p>
        </div>

        <div className="rounded-2xl p-8 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {status === 'loading' && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Loader size={24} className="animate-spin" style={{ color: 'var(--brand-1)' }} />
              </div>
              <p className="text-[15px] font-semibold text-white">Verifying your email…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={24} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p className="text-[17px] font-bold text-white mb-2">Email Verified!</p>
                <p className="text-[13px]" style={{ color: 'var(--text2)' }}>{message}</p>
              </div>
              <Link to="/login"
                className="btn-yellow w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold">
                Sign In →
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <XCircle size={24} style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <p className="text-[17px] font-bold text-white mb-2">Verification Failed</p>
                <p className="text-[13px]" style={{ color: 'var(--text2)' }}>{message}</p>
              </div>
              <Link to="/register"
                className="w-full py-3 rounded-xl flex items-center justify-center text-[13px] font-medium transition-all"
                style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                Back to Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
