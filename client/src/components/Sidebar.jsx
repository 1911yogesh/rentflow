import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, History, FileText, Settings, LogOut, Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/helpers';

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/areas',   icon: Map,             label: 'Areas' },
  { to: '/history', icon: History,         label: 'Payment History' },
  { to: '/slips',   icon: FileText,        label: 'Rent Slips' },
  { to: '/settings',icon: Settings,        label: 'Settings' },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-white border-r border-black/[0.07] z-50
          flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <span className="font-heading text-base font-bold">
            Rent<span className="text-blue-600">Flux</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 mb-2">
            Main
          </p>
          {NAV.slice(0, 2).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 mt-5 mb-2">
            Reports
          </p>
          {NAV.slice(2, 4).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 mt-5 mb-2">
            Account
          </p>
          {NAV.slice(4).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost p-1.5 text-gray-400 hover:text-red-500"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
