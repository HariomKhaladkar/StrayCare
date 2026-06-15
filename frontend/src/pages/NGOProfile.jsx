// frontend/src/pages/NGOProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const StarRating = ({ rating }) => {
  const r = Math.round(rating || 0);
  return (
    <span style={{ color: '#f59e0b', fontSize: '1.1rem', letterSpacing: 2 }}>
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
    </span>
  );
};

const StatBox = ({ icon, value, label, color }) => (
  <div style={{
    flex: 1, minWidth: 110, textAlign: 'center',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '1.1rem',
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

const STAR_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#6366f1'];

const NGOProfile = () => {
  const { id } = useParams();
  const [ngo, setNgo]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    axios.get(`${API}/ngos/${id}/profile`)
      .then(r => setNgo(r.data))
      .catch(() => setError('NGO profile not found or unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.4)' }}>
      Loading NGO profile…
    </div>
  );
  if (error) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#f87171' }}>{error}</div>
  );

  const initials = ngo.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const s = ngo.stats;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* ── NGO Header Card ── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(236,72,153,0.12))',
        border: '1px solid rgba(99,102,241,0.25)', borderRadius: 22,
        padding: '2rem', marginBottom: '1.75rem',
        display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '2rem', fontWeight: 800, flexShrink: 0,
        }}>{initials}</div>

        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: '#fff' }}>
            {ngo.name}
            <span style={{
              marginLeft: 10, background: 'rgba(34,197,94,0.2)', color: '#22c55e',
              borderRadius: 999, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 700,
            }}>✅ Verified NGO</span>
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            📧 {ngo.email}
          </p>
          {ngo.average_rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <StarRating rating={ngo.average_rating} />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                {ngo.average_rating.toFixed(1)} ({ngo.total_reviews} review{ngo.total_reviews !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>

        <Link to="/donate" style={{
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', borderRadius: 12, padding: '0.6rem 1.4rem',
          textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
          whiteSpace: 'nowrap',
        }}>💛 Donate</Link>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        <StatBox icon="📋" value={s.total_cases}    label="Cases Handled"  color="linear-gradient(135deg,#6366f1,#8b5cf6)" />
        <StatBox icon="✅" value={s.resolved_cases}  label="Resolved"       color="linear-gradient(135deg,#22c55e,#14b8a6)" />
        <StatBox icon="🐾" value={s.pets_listed}     label="Pets Listed"    color="linear-gradient(135deg,#ec4899,#f97316)" />
        <StatBox icon="🏠" value={s.pets_adopted}    label="Pets Adopted"   color="linear-gradient(135deg,#f59e0b,#ef4444)" />
      </div>

      {/* ── Available Pets ── */}
      {ngo.available_pets.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '1.5rem', marginBottom: '1.75rem',
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#fff', fontWeight: 700 }}>🐶 Available for Adoption</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {ngo.available_pets.map(pet => (
              <Link to="/adopt" key={pet.id} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'transform 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img
                    src={pet.image_url?.startsWith('http') ? pet.image_url : `${API}/${pet.image_url}`}
                    alt={pet.name}
                    style={{ width: '100%', height: 110, objectFit: 'cover' }}
                  />
                  <div style={{ padding: '0.5rem' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{pet.name}</p>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      {pet.species} · {pet.age}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Rating Distribution ── */}
      {ngo.total_reviews > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '1.5rem', marginBottom: '1.75rem',
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#fff', fontWeight: 700 }}>⭐ Rating Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[...ngo.rating_distribution].reverse().map(({ star, count }) => {
              const pct = ngo.total_reviews > 0 ? (count / ngo.total_reviews) * 100 : 0;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#f59e0b', width: 20, textAlign: 'right', fontWeight: 700 }}>{star}★</span>
                  <div style={{
                    flex: 1, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 999,
                      background: STAR_COLORS[star - 1], transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', width: 28 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Reviews ── */}
      {ngo.recent_reviews.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#fff', fontWeight: 700 }}>💬 Recent Reviews</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {ngo.recent_reviews.map(r => (
              <div key={r.id} style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                padding: '0.9rem', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <StarRating rating={r.rating} />
                  {r.category && (
                    <span style={{
                      background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                      borderRadius: 999, padding: '2px 8px', fontSize: '0.72rem',
                    }}>{r.category}</span>
                  )}
                </div>
                {r.comment && (
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>{r.comment}</p>
                )}
                {r.ngo_response && (
                  <div style={{
                    marginTop: '0.6rem', background: 'rgba(99,102,241,0.1)',
                    borderRadius: 8, padding: '0.5rem 0.75rem',
                    borderLeft: '3px solid #6366f1',
                  }}>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                      NGO replied: "{r.ngo_response}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default NGOProfile;
