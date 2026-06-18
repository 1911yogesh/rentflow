import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Building2 } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f8]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 lg:hidden shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 size={13} className="text-white" />
            </div>
            <span className="font-heading font-bold text-base text-gray-900">
              Rent<span className="text-indigo-600">Flux</span>
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="max-w-6xl mx-auto px-4 py-5 lg:px-8 lg:py-7 page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
};

export default Layout;
