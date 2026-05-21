import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, History, FileText } from 'lucide-react';

const MOBILE_NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/areas',   icon: Map,             label: 'Areas' },
  { to: '/history', icon: History,         label: 'History' },
  { to: '/slips',   icon: FileText,        label: 'Slips' },
];

const MobileNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 lg:hidden mobile-safe-bottom">
    <div className="flex">
      {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-400'
            }`
          }
        >
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default MobileNav;
