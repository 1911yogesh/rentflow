import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, History, FileText, Settings, LogOut, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/helpers';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/areas',   icon: Map,             label: 'Areas & Houses' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/history', icon: History,  label: 'Payment History' },
      { to: '/slips',   icon: FileText, label: 'Rent Slips' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-50
          flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          <span className="font-heading text-[15px] font-bold text-gray-900">
            Rent<span className="text-indigo-600">Flux</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto" role="navigation">
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label} className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2.5 mb-1.5">
                {label}
              </p>
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} className={isActive ? 'text-indigo-600' : ''} />
                      {itemLabel}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-900">{user?.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
