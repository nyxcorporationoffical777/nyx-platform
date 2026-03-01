import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-56 min-w-0 w-0">
        <Header onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: 'var(--bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
