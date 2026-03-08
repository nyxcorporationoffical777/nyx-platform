import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-56 min-w-0 w-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0" style={{ background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav />
    </div>
  );
}
