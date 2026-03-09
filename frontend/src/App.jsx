// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import styles from './App.module.css';

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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import ContactUs from "./pages/ContactUs";

const UserProtectedRoute = () => localStorage.getItem('token') ? <Outlet /> : <Navigate to="/login" replace />;
const NgoProtectedRoute = () => localStorage.getItem('ngo_token') ? <Outlet /> : <Navigate to="/ngo-login" replace />;

function App() {
  const [user, setUser] = useState(null);
  const [isNgoLoggedIn, setIsNgoLoggedIn] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

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

  return (
    <Router>
      <div className={styles.appContainer}>
        <header className={styles.header}>
          <nav className={styles.nav}>
            <Link to="/" className={styles.logo}>StrayCare</Link>
            <div className={styles.navLinks}>
              {!isNgoLoggedIn && <Link to="/adopt" className={styles.navLink}>Adopt</Link>}
              
              {/* --- DONATE LINK --- */}
              <Link to="/donate" className={styles.navLink}>Donate</Link>

              <Link to="/first-aid" className={styles.navLink}>First Aid</Link>
              
              {/* --- CITIZEN LINKS --- */}
              {user && !user.is_admin && (
                <>
                  <Link to="/dashboard" className={styles.navLink}>My Dashboard</Link>
                  <Link to="/my-reports" className={styles.navLink}>My Reports</Link>
                </>
              )}
              
              {/* --- ADMIN LINKS --- */}
              {user && user.is_admin && (
                <Link to="/admin/dashboard" className={styles.navLink}>Admin Panel</Link>
              )}
              
              {/* --- NGO LINKS --- */}
              {isNgoLoggedIn && (
                <>
                  <Link to="/ngo-dashboard" className={styles.navLink}>Case Dashboard</Link>
                  <Link to="/ngo-requests" className={styles.navLink}>Pending Requests</Link>
                  <Link to="/ngo-adopted-pets" className={styles.navLink}>Adopted Pets</Link>
                  <Link to="/ngo-feedback" className={styles.navLink}>My Feedback</Link>
                </>
              )}
            </div>
            <div className={styles.navLinks}>
              {!isLoggedIn && <Link to="/ngo-login" className={styles.navLink}>NGO Portal</Link>}
              {isLoggedIn ? (
                <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
              ) : (
                <Link to="/login" className={styles.loginLink}>Login</Link>
              )}
            </div>
          </nav>
        </header>
        
        <main className={styles.mainContent}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/adopt" element={<AdoptionPage />} />
            
            {/* --- DONATE ROUTE --- */}
            <Route path="/donate" element={<DonatePage />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/ngo-login" element={<NGOLogin />} />
            <Route path="/ngo-register" element={<NGORegister />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/first-aid" element={<FirstAidList />} />
            <Route path="/first-aid/:id" element={<FirstAidDetail />} />
            
            <Route element={<UserProtectedRoute />}>
              <Route path="/dashboard" element={<CitizenDashboard />} />
              <Route path="/report-case" element={<ReportCase />} />
              <Route path="/my-reports" element={<MyReports />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/feedback" element={<AdminFeedbackView />} />
              <Route path="/admin/donations" element={<AdminDonations />} />
            </Route>
            
            <Route element={<NgoProtectedRoute />}>
              <Route path="/ngo-dashboard" element={<NGODashboard />} />
              <Route path="/my-cases" element={<MyAcceptedCases />} />
              <Route path="/ngo-requests" element={<AdoptionRequests />} />
              <Route path="/ngo-adopted-pets" element={<AdoptedPetsList />} />
              <Route path="/ngo-feedback" element={<NGOFeedback />} />
            </Route>

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/refunds" element={<RefundPolicy />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/contact" element={<ContactUs />} />

          </Routes>
        </main>

        <button 
          onClick={() => setIsChatbotOpen(!isChatbotOpen)} 
          className={styles.chatbotToggleButton}
          aria-label="Toggle AI Assistant"
        >
          AI Help
        </button>
        {isChatbotOpen && <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />}
      </div>
    </Router>
  );
}

export default App;