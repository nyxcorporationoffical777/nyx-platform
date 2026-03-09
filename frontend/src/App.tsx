import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import OnboardingTour from './components/OnboardingTour';
import { ToastProvider } from './components/Toast';

const Home          = lazy(() => import('./pages/Home'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const QuantBot      = lazy(() => import('./pages/QuantBot'));
const Referrals     = lazy(() => import('./pages/Referrals'));
const Profile       = lazy(() => import('./pages/Profile'));
const AdminLogin    = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard= lazy(() => import('./pages/admin/AdminDashboard'));
const Help          = lazy(() => import('./pages/Help'));
const Leaderboard   = lazy(() => import('./pages/Leaderboard'));
const Markets       = lazy(() => import('./pages/Markets'));
const TopUp         = lazy(() => import('./pages/TopUp'));
const Wallet        = lazy(() => import('./pages/Wallet'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const Staking       = lazy(() => import('./pages/Staking'));
const Analytics     = lazy(() => import('./pages/Analytics'));
const KYC           = lazy(() => import('./pages/KYC'));
const Legal         = lazy(() => import('./pages/Legal'));
const VerifyEmail   = lazy(() => import('./pages/VerifyEmail'));
const RefLanding    = lazy(() => import('./pages/RefLanding'));
const Rewards       = lazy(() => import('./pages/Rewards'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: 'var(--brand-1)' }} />
    </div>
  );
}

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
      <Route path="/ref/:code" element={<RefLanding />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/bot" element={<QuantBot />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/rewards" element={<Rewards />} />
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
          <Suspense fallback={<PageLoader />}>
            <AppRoutes />
            <TourWrapper />
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
