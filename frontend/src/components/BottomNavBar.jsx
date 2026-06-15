// src/components/BottomNavBar.jsx
// Android-only bottom navigation. Shows role-specific tabs so no feature
// is duplicated between the header and the bottom bar.
import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './BottomNavBar.module.css';

// ── Tab definitions per role ───────────────────────────────────────────────
// Keep to 5 tabs max for comfortable thumb reach on any phone size.

const CITIZEN_TABS = [
  { to: '/dashboard',   icon: '🏠', label: 'Home'    },
  { to: '/report-case', icon: '🚨', label: 'Report'  },
  { to: '/adopt',       icon: '🐾', label: 'Adopt'   },
  { to: '/food-shop',   icon: '🛒', label: 'Shop'    },
  { to: '/profile',     icon: '👤', label: 'Profile' },
];

const NGO_TABS = [
  { to: '/ngo-dashboard',    icon: '🏥', label: 'Cases'    },
  { to: '/ngo-pet-listings', icon: '🐾', label: 'Pets'     },
  { to: '/ngo-requests',     icon: '📋', label: 'Requests' },
  { to: '/ngo-analytics',    icon: '📊', label: 'Stats'    },
  { to: '/ngo-feedback',     icon: '⭐', label: 'Reviews'  },
];

const ADMIN_TABS = [
  { to: '/admin/dashboard',   icon: '📋', label: 'Panel'    },
  { to: '/admin/analytics',   icon: '🔭', label: 'Stats'    },
  { to: '/admin/dispatch',    icon: '🚑', label: 'Dispatch' },
  { to: '/admin/hotspots',    icon: '🗺️', label: 'Map'      },
  { to: '/admin/food-orders', icon: '📦', label: 'Orders'   },
];

const GUEST_TABS = [
  { to: '/',          icon: '🏠', label: 'Home'    },
  { to: '/adopt',     icon: '🐾', label: 'Adopt'   },
  { to: '/donate',    icon: '💛', label: 'Donate'  },
  { to: '/ngo-login', icon: '🏥', label: 'NGO'     },
  { to: '/login',     icon: '🔐', label: 'Login'   },
];

// Tabs that should use `end` matching (exact root path only)
const EXACT_PATHS = new Set(['/', '/dashboard', '/ngo-dashboard', '/admin/dashboard']);

export default function BottomNavBar({ user, isNgoLoggedIn }) {
  let tabs;
  if (isNgoLoggedIn)      tabs = NGO_TABS;
  else if (user?.is_admin) tabs = ADMIN_TABS;
  else if (user)           tabs = CITIZEN_TABS;
  else                     tabs = GUEST_TABS;

  return (
    <nav className={styles.bottomNav} role="navigation" aria-label="Main navigation">
      {tabs.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={EXACT_PATHS.has(to)}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.activeTab : ''}`
          }
          aria-label={label}
        >
          <span className={styles.tabIcon}>{icon}</span>
          <span className={styles.tabLabel}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
