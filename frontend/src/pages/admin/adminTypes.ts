import axios from 'axios';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/admin';

export function adminApi() {
  const token = localStorage.getItem('admin_token');
  return axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } });
}

export const VIP_COLOR: Record<string, string> = {
  Starter: '#848e9c', Silver: '#b7bdc8', Gold: '#f0b90b', Platinum: '#00b8d9', Diamond: '#a855f7',
};

export const TX_COLOR: Record<string, string> = {
  deposit: '#0ecb81', withdraw: '#f6465d', yield: '#f0b90b', referral: '#a855f7',
};

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  balance: number;
  vip_level: string;
  bot_running: number;
  total_deposited: number;
  total_withdrawn: number;
  total_earned: number;
  referral_earnings: number;
  referral_code: string;
  referred_by: number | null;
  crypto_address: string | null;
  crypto_network: string | null;
  created_at: string;
  last_bot_date: string | null;
  active_days: number;
  referral_count?: number;
}

export interface AdminTransaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  status: string;
  note: string;
  created_at: string;
  full_name?: string;
  email?: string;
}

export interface AdminSession {
  id: number;
  user_id: number;
  started_at: string;
  ended_at: string | null;
  earned: number;
  vip_level: string;
  full_name?: string;
  email?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalEarned: number;
  totalBalance: number;
  activeBot: number;
  totalSessions: number;
  totalTx: number;
  newToday: number;
  vipCounts: { vip_level: string; count: number }[];
}
