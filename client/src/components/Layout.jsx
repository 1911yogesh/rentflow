import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0ede8]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile only) */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-ghost p-2"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-heading font-bold text-base">
            Rent<span className="text-blue-600">Flow</span>
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="max-w-6xl mx-auto px-4 py-5 lg:px-8 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
};

export default Layout;
