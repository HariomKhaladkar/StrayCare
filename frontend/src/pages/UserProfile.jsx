// frontend/src/pages/UserProfile.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePlatform } from '../hooks/usePlatform';
import API_BASE_URL from '../api';

const API = API_BASE_URL;

const STATUS_STYLES = {
  Pending:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', label: '⏳ Pending'  },
  Accepted: { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', label: '✅ Accepted' },
  Resolved: { bg: 'rgba(99,102,241,0.15)',  color: '#a5b4fc', label: '🎉 Resolved' },
  Rejected: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: '❌ Rejected' },
  Approved: { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', label: '✅ Approved' },
};

const Badge = ({ status }) => {
  const s = STATUS_STYLES[status] || { bg: 'rgba(255,255,255,0.1)', color: '#fff', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 999,
      padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
    }}>{s.label}</span>
  );
};

const StatBox = ({ icon, value, label, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '1.1rem', textAlign: 'center', flex: 1, minWidth: 110,
  }}>
    <div style={{ fontSize: '1.5rem' }}>{icon}</div>
    <div style={{
      fontSize: '1.8rem', fontWeight: 800,
      background: color, WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    }}>{value}</div>
    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: 2 }}>{label}</div>
  </div>
);

const SectionCard = ({ title, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem',
  }}>
    <h3 style={{ margin: '0 0 1rem', color: '#fff', fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
    {children}
  </div>
);

const UserProfile = () => {
  const { isMobile } = usePlatform();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/users/me/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setProfile(r.data))
      .catch(() => setError('Could not load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: isMobile ? '2rem' : '5rem', color: 'rgba(255,255,255,0.4)' }}>
      Loading your profile…
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: isMobile ? '2rem' : '5rem', color: '#f87171' }}>{error}</div>
  );

  const cb = profile.case_breakdown;
  const initials = profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '1rem' : '2rem 1.5rem' }}>

      {/* ── Avatar + Name ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.5rem',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: '1.75rem', marginBottom: '1.75rem',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '1.8rem', fontWeight: 800, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            {profile.name}
            {profile.is_admin && (
              <span style={{
                marginLeft: 10, background: 'rgba(245,158,11,0.2)', color: '#f59e0b',
                borderRadius: 999, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700,
              }}>👑 Admin</span>
            )}
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {profile.email}
          </p>
        </div>
        {!isMobile && (
          <Link to="/dashboard" style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc', borderRadius: 10, padding: '0.5rem 1rem',
            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
          }}>← Dashboard</Link>
        )}
        {isMobile && (
          <button onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }} style={{
            background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
            color: '#f87171', borderRadius: 10, padding: '0.5rem 1rem',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          }}>Sign Out</button>
        )}
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        <StatBox icon="📋" value={cb.total}   label="Cases Reported"  color="linear-gradient(135deg,#6366f1,#8b5cf6)" />
        <StatBox icon="✅" value={cb.resolved} label="Cases Resolved"  color="linear-gradient(135deg,#22c55e,#14b8a6)" />
        <StatBox icon="💳" value={`₹${profile.total_donated.toLocaleString('en-IN')}`} label="Total Donated" color="linear-gradient(135deg,#ec4899,#f97316)" />
        <StatBox icon="🐾" value={profile.adoption_history.length} label="Adoption Requests" color="linear-gradient(135deg,#f59e0b,#ef4444)" />
      </div>

      {/* ── Case Breakdown ── */}
      <SectionCard title="📋 My Case Breakdown">
        {cb.total === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '0.9rem' }}>
            You haven't reported any cases yet.{' '}
            <Link to="/report-case" style={{ color: '#a5b4fc' }}>Report one now →</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Pending',  count: cb.pending,  color: '#f59e0b' },
              { label: 'Accepted', count: cb.accepted, color: '#22c55e' },
              { label: 'Resolved', count: cb.resolved, color: '#a5b4fc' },
              { label: 'Rejected', count: cb.rejected, color: '#f87171' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '0.5rem 1rem',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{label}:</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        )}
        {cb.total > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <Link to="/my-reports" style={{
              display: 'inline-block', background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc',
              borderRadius: 10, padding: '0.4rem 1rem', textDecoration: 'none',
              fontSize: '0.82rem', fontWeight: 600,
            }}>View all my cases →</Link>
          </div>
        )}
      </SectionCard>

      {/* ── Donation History ── */}
      <SectionCard title="💳 Donation History">
        {profile.donation_history.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '0.9rem' }}>
            No donations yet.{' '}
            <Link to="/donate" style={{ color: '#a5b4fc' }}>Donate now →</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {profile.donation_history.slice(0, 8).map(d => (
              <div key={d.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                padding: '0.6rem 1rem',
              }}>
                <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.95rem' }}>
                  ₹{d.amount.toLocaleString('en-IN')}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                  {d.timestamp ? new Date(d.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            ))}
            {profile.donation_history.length > 8 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                +{profile.donation_history.length - 8} more donations
              </p>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Adoption Requests ── */}
      <SectionCard title="🐾 My Adoption Requests">
        {profile.adoption_history.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '0.9rem' }}>
            No adoption requests yet.{' '}
            <Link to="/adopt" style={{ color: '#a5b4fc' }}>Browse pets →</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {profile.adoption_history.map(ar => (
              <div key={ar.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                padding: '0.6rem 1rem',
              }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                  🐾 {ar.pet_name || 'Unknown pet'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge status={ar.status} />
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
                    {ar.request_date ? new Date(ar.request_date).toLocaleDateString('en-IN') : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Quick Actions for Mobile */}
      {isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { to: '/report-case', label: '🐾 Report Case',  bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', color: '#a5b4fc' },
            { to: '/adopt',       label: '❤️ Browse Pets',  bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.3)',  color: '#2dd4bf' },
            { to: '/donate',      label: '💳 Donate',       bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  color: '#fbbf24' },
            { to: '/food-shop',   label: '🛒 Food Shop',    bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   color: '#4ade80' },
          ].map(({ to, label, bg, border, color }) => (
            <Link key={to} to={to} style={{
              display: 'block', textAlign: 'center', padding: '0.75rem',
              background: bg, border: `1px solid ${border}`, color,
              borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem',
            }}>{label}</Link>
          ))}
        </div>
      )}

    </div>
  );
};

export default UserProfile;
