import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Assets from './pages/Assets';
import QuantBot from './pages/QuantBot';
import Referrals from './pages/Referrals';
import Profile from './pages/Profile';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Help from './pages/Help';
import Leaderboard from './pages/Leaderboard';
import Markets from './pages/Markets';
import TopUp from './pages/TopUp';
import Wallet from './pages/Wallet';
import Dashboard from './pages/Dashboard';
import Staking from './pages/Staking';
import Analytics from './pages/Analytics';
import KYC from './pages/KYC';
import Legal from './pages/Legal';
import VerifyEmail from './pages/VerifyEmail';
import OnboardingTour from './components/OnboardingTour';
import { ToastProvider } from './components/Toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function TourWrapper() {
  const navigate = useNavigate();
  const { token } = useAuth();
  if (!token) return null;
  return <OnboardingTour onNavigate={(path) => navigate(path)} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/bot" element={<QuantBot />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help" element={<Help />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/topup" element={<TopUp />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/staking" element={<Staking />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/kyc" element={<KYC />} />
        <Route path="/legal" element={<Legal />} />
      </Route>
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
          <TourWrapper />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
