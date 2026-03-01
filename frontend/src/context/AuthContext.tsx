import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';

interface User {
  id: number;
  full_name: string;
  email: string;
  avatar: string | null;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_earned: number;
  referral_earnings: number;
  vip_level: string;
  bot_running: number;
  bot_started_at: string | null;
  active_days: number;
  created_at: string;
  referral_code: string | null;
  referred_by: number | null;
  crypto_address: string | null;
  crypto_network: string | null;
  transaction_password: string | null;
  referral_count: number;
  active_referral_count: number;
  referral_commission_rate: number;
  vip_info: { name: string; minBalance: number; dailyRate: number };
  next_vip: { name: string; minBalance: number; dailyRate: number } | null;
  vip_levels: { name: string; minBalance: number; dailyRate: number }[];
  totp_enabled: number;
  kyc_status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, totpCode?: string) => Promise<{ needs2FA?: boolean; user_id?: number }>;
  register: (full_name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.get('/user/me');
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string, totpCode?: string): Promise<{ needs2FA?: boolean; user_id?: number }> => {
    const res = await api.post('/auth/login', { email, password, totp_code: totpCode });
    if (res.data.needs_2fa) {
      return { needs2FA: true, user_id: res.data.user_id };
    }
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    await refreshUser();
    return {};
  };

  const register = async (full_name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { full_name, email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, loading } as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
