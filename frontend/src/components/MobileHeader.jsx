// src/components/MobileHeader.jsx
// Compact sticky header shown ONLY on Android/native.
// Shows logo, notification bells, and logout/login button.
import React from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import styles from './MobileHeader.module.css';

export default function MobileHeader({ user, isNgoLoggedIn, onLogout }) {
  const isLoggedIn = !!(user || isNgoLoggedIn);

  return (
    <header className={styles.header}>
      <Link to={user ? '/dashboard' : isNgoLoggedIn ? '/ngo-dashboard' : '/'} className={styles.logo}>
        <span className={styles.logoPaw}>🐾</span>
        <span className={styles.logoText}>StrayCare</span>
      </Link>

      <div className={styles.actions}>
        {user && !user.is_admin && <NotificationBell role="user" />}
        {isNgoLoggedIn && <NotificationBell role="ngo" />}

        {isLoggedIn ? (
          <button
            onClick={onLogout}
            className={styles.iconBtn}
            title="Logout"
            aria-label="Logout"
          >
            <span className={styles.logoutIcon}>⏻</span>
          </button>
        ) : (
          <Link to="/login" className={styles.loginPill}>Login</Link>
        )}
      </div>
    </header>
  );
}
