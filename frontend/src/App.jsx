// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { App as CapacitorApp } from '@capacitor/app';
import styles from './App.module.css';

// Platform detection (Capacitor)
import { usePlatform } from './hooks/usePlatform';

// Mobile-only layout components
import MobileHeader from './components/MobileHeader';
import BottomNavBar from './components/BottomNavBar';

// --- Import ALL page components ---
import LandingPage from './pages/LandingPage';
import AdoptionPage from './pages/AdoptionPage';
import CitizenDashboard from './components/CitizenDashboard';
import Login from './components/Login';
import Register from './components/Register';
import NGOLogin from './components/NGOLogin';
import NGORegister from './components/NGORegister';
import ReportCase from './components/ReportCase';
import NGODashboard from './components/NGODashboard';
import MyReports from './components/MyReports';
import CaseDetail from './components/CaseDetail';
import FirstAidList from './components/FirstAidList';
import FirstAidDetail from './components/FirstAidDetail';
import AdminDashboard from './components/AdminDashboard';
import Chatbot from './components/Chatbot';
import MyAcceptedCases from './components/MyAcceptedCases';
import AdoptionRequests from './components/AdoptionRequests';
import AdoptedPetsList from './components/AdoptedPetsList';
import NGOFeedback from './components/NGOFeedback';
import AdminFeedbackView from './components/AdminFeedbackView';
import DonatePage from './components/DonatePage';
import AdminDonations from './components/AdminDonations';
import MyPetListings from './components/MyPetListings';
import NGOPetListings from './components/NGOPetListings';
import DonorDashboard from './pages/DonorDashboard';
import DonorVerification from './pages/DonorVerification';
import NGOAnalyticsDashboard from './pages/NGOAnalyticsDashboard';
import AdminAnalyticsDashboard from './pages/AdminAnalyticsDashboard';
import CitizenAnalytics from './pages/CitizenAnalytics';
import SmartDispatch from './pages/SmartDispatch';
import HotspotMap from './pages/HotspotMap';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import ContactUs from './pages/ContactUs';
import RecoveryStories from './pages/RecoveryStories';
import UserProfile from './pages/UserProfile';
import NGOProfile from './pages/NGOProfile';
import NotificationBell from './components/NotificationBell';
import FoodMarketplace from './pages/FoodMarketplace';
import MyFoodOrders from './pages/MyFoodOrders';
import AdminFoodOrders from './components/AdminFoodOrders';

// ── Route guards ──────────────────────────────────────────────────────────────
const UserProtectedRoute = () =>
  localStorage.getItem('token') ? <Outlet /> : <Navigate to="/login" replace />;

const NgoProtectedRoute = () =>
  localStorage.getItem('ngo_token') ? <Outlet /> : <Navigate to="/ngo-login" replace />;

const AdminProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const user  = localStorage.getItem('user');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const parsed = JSON.parse(user);
    if (!parsed?.is_admin) return <Navigate to="/dashboard" replace />;
  } catch { return <Navigate to="/login" replace />; }
  return <Outlet />;
};

// ── Hardware Back Button Handler for Capacitor ────────────────────────────────
function HardwareBackButtonHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleBackButton = () => {
      const path = window.location.pathname;
      // List of root paths where pressing back should exit the app
      const rootPaths = ['/', '/dashboard', '/ngo-dashboard', '/login', '/ngo-login'];
      
      if (rootPaths.includes(path)) {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    };
    
    CapacitorApp.addListener('backButton', handleBackButton);
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);
  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser]                 = useState(null);
  const [isNgoLoggedIn, setIsNgoLoggedIn] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Detect whether we are running inside a Capacitor native container (Android)
  const { isMobile } = usePlatform();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (localStorage.getItem('ngo_token')) setIsNgoLoggedIn(true);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setIsNgoLoggedIn(false);
    window.location.href = '/';
  };

  const isLoggedIn = user || isNgoLoggedIn;

  // ── All routes (shared between web and mobile) ─────────────────────────────
  const allRoutes = (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/stories" element={<RecoveryStories />} />
      <Route path="/ngo/:id" element={<NGOProfile />} />
      <Route path="/food-shop" element={<FoodMarketplace />} />
      <Route path="/adopt"   element={<AdoptionPage />} />

      {/* Donate / Donor */}
      <Route path="/donate"          element={<DonatePage />} />
      <Route path="/donor-dashboard" element={<DonorDashboard />} />
      <Route path="/donor/verify"    element={<DonorVerification />} />

      {/* Auth */}
      <Route path="/login"        element={<Login />} />
      <Route path="/register"     element={<Register />} />
      <Route path="/ngo-login"    element={<NGOLogin />} />
      <Route path="/ngo-register" element={<NGORegister />} />

      {/* Public content */}
      <Route path="/cases/:id"     element={<CaseDetail />} />
      <Route path="/first-aid"     element={<FirstAidList />} />
      <Route path="/first-aid/:id" element={<FirstAidDetail />} />

      {/* Citizen protected */}
      <Route element={<UserProtectedRoute />}>
        <Route path="/dashboard"       element={<CitizenDashboard />} />
        <Route path="/profile"         element={<UserProfile />} />
        <Route path="/my-analytics"    element={<CitizenAnalytics />} />
        <Route path="/report-case"     element={<ReportCase />} />
        <Route path="/my-reports"      element={<MyReports />} />
        <Route path="/my-pet-listings" element={<MyPetListings />} />
        <Route path="/my-food-orders"  element={<MyFoodOrders />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/feedback"  element={<AdminFeedbackView />} />
        <Route path="/admin/donations" element={<AdminDonations />} />
      </Route>

      {/* Admin-only protected */}
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin/analytics"   element={<AdminAnalyticsDashboard />} />
        <Route path="/admin/dispatch"    element={<SmartDispatch />} />
        <Route path="/admin/hotspots"    element={<HotspotMap />} />
        <Route path="/admin/food-orders" element={<AdminFoodOrders />} />
      </Route>

      {/* NGO protected */}
      <Route element={<NgoProtectedRoute />}>
        <Route path="/ngo-dashboard"    element={<NGODashboard />} />
        <Route path="/my-cases"         element={<MyAcceptedCases />} />
        <Route path="/ngo-requests"     element={<AdoptionRequests />} />
        <Route path="/ngo-adopted-pets" element={<AdoptedPetsList />} />
        <Route path="/ngo-pet-listings" element={<NGOPetListings />} />
        <Route path="/ngo-feedback"     element={<NGOFeedback />} />
        <Route path="/ngo-analytics"    element={<NGOAnalyticsDashboard />} />
      </Route>

      {/* Legal pages */}
      <Route path="/privacy"  element={<PrivacyPolicy />} />
      <Route path="/terms"    element={<TermsAndConditions />} />
      <Route path="/refunds"  element={<RefundPolicy />} />
      <Route path="/shipping" element={<ShippingPolicy />} />
      <Route path="/contact"  element={<ContactUs />} />
    </Routes>
  );

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'}>
      <Router>
        <HardwareBackButtonHandler />
        <div className={`${styles.appContainer} ${isMobile ? styles.mobileContainer : ''}`}>

          {/* ══ MOBILE LAYOUT: compact header + bottom nav ══════════════════ */}
          {isMobile ? (
            <>
              <MobileHeader
                user={user}
                isNgoLoggedIn={isNgoLoggedIn}
                onLogout={handleLogout}
              />

              <main className={`${styles.mainContent} ${styles.mobileMainContent}`}>
                {allRoutes}
              </main>

              {/* Bottom nav replaces ALL top-bar navigation on Android */}
              <BottomNavBar user={user} isNgoLoggedIn={isNgoLoggedIn} />
            </>
          ) : (
            /* ══ DESKTOP LAYOUT: full top navbar + footer ══════════════════ */
            <>
              <header className={styles.header}>
                <nav className={styles.nav}>
                  <Link to="/" className={styles.logo}>StrayCare</Link>
                  <div className={styles.navLinks}>
                    {/* Always-visible public links */}
                    <Link to="/first-aid"  className={styles.navLink}>First Aid</Link>
                    <Link to="/stories"    className={styles.navLink}>Stories</Link>
                    <Link to="/food-shop"  className={styles.navLink}>🛒 Food Shop</Link>

                    {/* Guest-only links */}
                    {!isLoggedIn && (
                      <>
                        <Link to="/adopt"          className={styles.navLink}>Adopt</Link>
                        <Link to="/donate"         className={styles.navLink}>Donate</Link>
                        <Link to="/donor-dashboard" className={styles.navLink}>Impact</Link>
                      </>
                    )}

                    {/* Citizen (non-admin) links */}
                    {user && !user.is_admin && (
                      <>
                        <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
                        <Link to="/profile"   className={styles.navLink}>Profile</Link>
                      </>
                    )}

                    {/* Admin links */}
                    {user && user.is_admin && (
                      <>
                        <Link to="/admin/dashboard" className={styles.navLink}>Admin Panel</Link>
                        <Link to="/admin/analytics" className={styles.navLink}>🔭 Analytics</Link>
                        <Link to="/admin/dispatch"  className={styles.navLink}>🚑 Dispatch</Link>
                        <Link to="/admin/hotspots"  className={styles.navLink}>🗺️ Hotspots</Link>
                      </>
                    )}

                    {/* NGO portal link */}
                    {isNgoLoggedIn && (
                      <Link to="/ngo-dashboard" className={styles.navLink}>NGO Portal</Link>
                    )}
                  </div>

                  <div className={styles.navLinks}>
                    {!isLoggedIn && (
                      <Link to="/ngo-login" className={styles.navLink}>NGO Portal</Link>
                    )}
                    {user && !user.is_admin && <NotificationBell role="user" />}
                    {isNgoLoggedIn && <NotificationBell role="ngo" />}
                    {isLoggedIn ? (
                      <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                    ) : (
                      <Link to="/login" className={styles.loginLink}>Login</Link>
                    )}
                  </div>
                </nav>
              </header>

              <main className={styles.mainContent}>
                {allRoutes}
              </main>

              {/* Footer — desktop only */}
              <footer style={{
                background: 'rgba(255,255,255,0.03)',
                borderTop: '1px solid rgba(99,102,241,0.2)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.82rem',
              }}>
                <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/privacy"  style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy Policy</Link>
                  <Link to="/terms"    style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terms</Link>
                  <Link to="/contact"  style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Contact Us</Link>
                  <Link to="/donate"   style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Donate</Link>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text', fontWeight: 700, fontSize: '0.9rem',
                  marginBottom: '0.35rem',
                }}>StrayCare ♥ Every life matters</div>
                <div>© {new Date().getFullYear()} StrayCare. Made with love for stray animals.</div>
              </footer>
            </>
          )}

          {/* ── AI Chatbot FAB — position adjusts for mobile bottom nav ── */}
          <button
            onClick={() => setIsChatbotOpen(!isChatbotOpen)}
            className={`${styles.chatbotToggleButton} ${isMobile ? styles.chatbotMobile : ''}`}
            aria-label="Toggle AI Assistant"
            title="AI Help"
          >
            🤖
          </button>
          {isChatbotOpen && <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />}

        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;