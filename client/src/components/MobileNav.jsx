import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, History, FileText, Settings } from 'lucide-react';

const TABS = [
  { to: '/',        icon: LayoutDashboard, label: 'Home'    },
  { to: '/areas',   icon: Map,             label: 'Areas'   },
  { to: '/history', icon: History,         label: 'History' },
  { to: '/slips',   icon: FileText,        label: 'Slips'   },
  { to: '/settings',icon: Settings,        label: 'Settings'},
];

const MobileNav = () => (
  <nav
    className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 lg:hidden mobile-safe-bottom"
    role="navigation"
    aria-label="Mobile navigation"
  >
    <div className="flex">
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors min-h-[56px] justify-center ${
              isActive ? 'text-indigo-600' : 'text-gray-400'
            }`
          }
          aria-label={label}
        >
          {({ isActive }) => (
            <>
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default MobileNav;
