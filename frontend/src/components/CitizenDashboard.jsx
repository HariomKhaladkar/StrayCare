// frontend/src/components/CitizenDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './CitizenDashboard.module.css';
import { usePlatform } from '../hooks/usePlatform';

/* ─── Animated counter hook ──────────────────────────────── */
function useCounter(target, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── Single KPI stat card ───────────────────────────────── */
const KpiCard = ({ icon, value, label, color, sub }) => {
  const count = useCounter(value);
  return (
    <div className={styles.kpiCard} style={{ '--kpi-color': color }}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiValue} style={{
        background: color,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {count.toLocaleString()}
      </div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  );
};

/* ─── My Cases mini-breakdown ────────────────────────────── */
const BreakdownDot = ({ color, label, count }) => (
  <span className={styles.dot}>
    <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 5 }} />
    {label}: <strong>{count}</strong>
  </span>
);

/* ─── Main Dashboard ─────────────────────────────────────── */
const CitizenDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const userName = user ? user.name : 'Citizen';
  const { isMobile } = usePlatform();

  const [myCases, setMyCases]           = useState([]);
  const [platform, setPlatform]         = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Fetch personal cases
    const fetchMy = axios.get('/users/me/cases', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setMyCases(r.data)).catch(() => {});

    // Fetch platform summary (public)
    const fetchPlatform = axios.get('/stats/summary')
      .then(r => setPlatform(r.data)).catch(() => {});

    Promise.all([fetchMy, fetchPlatform]).finally(() => setLoadingStats(false));
  }, []);

  // My case breakdown
  const myTotal    = myCases.length;
  const myPending  = myCases.filter(c => c.status === 'Pending').length;
  const myAccepted = myCases.filter(c => c.status === 'Accepted').length;
  const myResolved = myCases.filter(c => c.status === 'Resolved').length;

  return (
    <div className={styles.container}>

      {/* ── Hero Welcome Banner ────────────────────────── */}
      <div className={styles.heroBanner}>
        <h1 className={styles.title}>Hey, {userName}! 👋</h1>
        <p className={styles.welcomeMessage}>
          Thank you for being part of the StrayCare community. Every action saves a life.
        </p>
        <div className={styles.quickActions}>
          {/* On mobile, Report is in the bottom nav — only show First Aid here */}
          {!isMobile && (
            <Link to="/report-case" className={`${styles.quickActionBtn} ${styles.primary}`}>
              🚨 Report a Case
            </Link>
          )}
          <Link to="/first-aid" className={`${styles.quickActionBtn} ${styles.secondary}`}>
            🩺 First Aid Guide
          </Link>
          {isMobile && (
            <Link to="/report-case" className={`${styles.quickActionBtn} ${styles.primary}`}>
              🚨 Report a Case
            </Link>
          )}
        </div>
      </div>

      {/* ── Live Impact Stats Row ──────────────────────── */}
      <div className={styles.statsSection}>
        <h2 className={styles.statsHeading}>📊 Live Platform Stats</h2>
        {loadingStats ? (
          <div className={styles.statsLoading}>Loading stats…</div>
        ) : (
          <div className={styles.kpiGrid}>

            {/* My Cases — personal with breakdown */}
            <div className={styles.kpiCard} style={{ '--kpi-color': 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <div className={styles.kpiIcon}>📋</div>
              <div className={styles.kpiValue} style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{myTotal}</div>
              <div className={styles.kpiLabel}>My Reported Cases</div>
              {myTotal > 0 && (
                <div className={styles.kpiBreakdown}>
                  <BreakdownDot color="#f59e0b" label="Pending"  count={myPending} />
                  <BreakdownDot color="#22c55e" label="Active"   count={myAccepted} />
                  <BreakdownDot color="#6366f1" label="Resolved" count={myResolved} />
                </div>
              )}
            </div>

            <KpiCard
              icon="🐾" value={platform?.resolved_cases ?? 0}
              label="Animals Rescued" color="linear-gradient(135deg,#14b8a6,#6366f1)"
              sub="Platform-wide resolved cases"
            />
            <KpiCard
              icon="🏠" value={platform?.total_adoptions ?? 0}
              label="Pets Adopted" color="linear-gradient(135deg,#ec4899,#f97316)"
              sub="Successful forever homes"
            />
            <KpiCard
              icon="🏥" value={platform?.ngo_count ?? 0}
              label="Partner NGOs" color="linear-gradient(135deg,#f59e0b,#ef4444)"
              sub="Verified rescue organisations"
            />
          </div>
        )}
      </div>

      {/* ── Quick Action Cards ─────────────────────────── */}
      {/*
        On Android: bottom nav already covers Home/Report/Adopt/Shop/Profile.
        We only show SECONDARY features here to eliminate redundancy.
        On desktop: show every card as usual.
      */}
      <h2 className={styles.sectionHeading}>
        {isMobile ? 'More Actions' : 'What would you like to do?'}
      </h2>
      <div className={styles.cardGrid}>

        {/* My Reports — always shown (not in bottom nav) */}
        <Link to="/my-reports" className={`${styles.navCard} ${styles.cardBlue}`}>
          <span className={styles.cardIcon}>📋</span>
          <h2 className={styles.cardTitle}>My Reported Cases</h2>
          <p className={styles.cardDescription}>
            Track cases you've reported. Leave feedback on resolved ones.
          </p>
          <span className={styles.cardArrow}>→</span>
        </Link>

        {/* Report — shown on desktop only; bottom nav has it on mobile */}
        {!isMobile && (
          <Link to="/report-case" className={`${styles.navCard} ${styles.cardRed}`}>
            <span className={styles.cardIcon}>🚨</span>
            <h2 className={styles.cardTitle}>Report a New Case</h2>
            <p className={styles.cardDescription}>
              Found an animal in need? Alert nearby NGOs instantly.
            </p>
            <span className={styles.cardArrow}>→</span>
          </Link>
        )}

        {/* Adopt — shown on desktop only; bottom nav has it on mobile */}
        {!isMobile && (
          <Link to="/adopt" className={`${styles.navCard} ${styles.cardGreen}`}>
            <span className={styles.cardIcon}>🐾</span>
            <h2 className={styles.cardTitle}>Adopt a Pet</h2>
            <p className={styles.cardDescription}>
              Browse rescued animals or use the AI Matchmaker to find your perfect companion.
            </p>
            <span className={styles.cardArrow}>→</span>
          </Link>
        )}

        {/* Donate — always shown */}
        <Link to="/donate" className={`${styles.navCard} ${styles.cardGold}`}>
          <span className={styles.cardIcon}>💛</span>
          <h2 className={styles.cardTitle}>Donate to an NGO</h2>
          <p className={styles.cardDescription}>
            Support verified rescue organisations financially. Every rupee counts.
          </p>
          <span className={styles.cardArrow}>→</span>
        </Link>

        {/* List a Pet — always shown */}
        <Link to="/my-pet-listings" className={`${styles.navCard} ${styles.cardPurple}`}>
          <span className={styles.cardIcon}>🏠</span>
          <h2 className={styles.cardTitle}>List a Pet for Adoption</h2>
          <p className={styles.cardDescription}>
            Submit a personal pet for NGO review and community rehoming.
          </p>
          <span className={styles.cardArrow}>→</span>
        </Link>

        {/* Analytics — always shown */}
        <Link to="/my-analytics" className={`${styles.navCard} ${styles.cardTeal}`}>
          <span className={styles.cardIcon}>📊</span>
          <h2 className={styles.cardTitle}>Analytics &amp; Charts</h2>
          <p className={styles.cardDescription}>
            View graphs of your rescue activity, case severity, donations, and adoption trends.
          </p>
          <span className={styles.cardArrow}>→</span>
        </Link>

        {/* Recovery Stories — always shown */}
        <Link to="/stories" className={`${styles.navCard} ${styles.cardBlue}`}>
          <span className={styles.cardIcon}>🌟</span>
          <h2 className={styles.cardTitle}>Recovery Stories</h2>
          <p className={styles.cardDescription}>
            Real success stories of animals rescued and rehabilitated by our partner NGOs.
          </p>
          <span className={styles.cardArrow}>→</span>
        </Link>

        {/* Profile — shown on desktop only; bottom nav has it on mobile */}
        {!isMobile && (
          <Link to="/profile" className={`${styles.navCard} ${styles.cardPurple}`}>
            <span className={styles.cardIcon}>👤</span>
            <h2 className={styles.cardTitle}>My Profile</h2>
            <p className={styles.cardDescription}>
              View your rescue activity, donations, and adoption requests all in one place.
            </p>
            <span className={styles.cardArrow}>→</span>
          </Link>
        )}

        {/* Food Shop — shown on desktop only; bottom nav (Shop) covers it on mobile */}
        {!isMobile && (
          <Link to="/food-shop" className={`${styles.navCard} ${styles.cardGreen}`}>
            <span className={styles.cardIcon}>🛒</span>
            <h2 className={styles.cardTitle}>Animal Food Shop</h2>
            <p className={styles.cardDescription}>
              Browse affordable, quality food for stray dogs and cats.
            </p>
            <span className={styles.cardArrow}>→</span>
          </Link>
        )}

        {/* My Food Orders — always shown (distinct from the shop page) */}
        <Link to="/my-food-orders" className={`${styles.navCard} ${styles.cardOrange}`}>
          <span className={styles.cardIcon}>📦</span>
          <h2 className={styles.cardTitle}>My Food Orders</h2>
          <p className={styles.cardDescription}>
            Track the delivery status of your food orders for stray animals.
          </p>
          <span className={styles.cardArrow}>→</span>
        </Link>

      </div>
    </div>
  );
};

export default CitizenDashboard;