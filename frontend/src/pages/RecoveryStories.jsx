// frontend/src/pages/RecoveryStories.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
const API = API_BASE_URL || 'http://localhost:8000';

const SEVERITY_COLORS = {
  Critical: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  High:     { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  Moderate: { bg: '#fefce8', text: '#854d0e', border: '#fde047' },
  Low:      { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
};

const storyCardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '18px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const RecoveryStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    axios.get(`${API}/stories`)
      .then(r => setStories(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 800,
          background: 'linear-gradient(135deg,#6366f1,#ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.75rem',
        }}>🐾 Recovery Stories</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto' }}>
          Every rescued animal has a story. Browse real cases handled by our partner NGOs
          and see the impact of your community's compassion.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          marginTop: '1rem', padding: '0.4rem 1rem',
          background: 'rgba(99,102,241,0.15)', borderRadius: '999px',
          border: '1px solid rgba(99,102,241,0.3)', color: 'rgba(255,255,255,0.65)',
          fontSize: '0.85rem',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          {stories.length} animals rescued &amp; recovered
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)' }}>
          Loading stories…
        </div>
      )}

      {!loading && stories.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem',
          background: 'rgba(255,255,255,0.03)', borderRadius: 18,
          border: '1px dashed rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐾</div>
          <p>No recovery stories yet. Cases will appear here once they are resolved by NGOs.</p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {stories.map(story => {
          const sev = SEVERITY_COLORS[story.severity_label] || SEVERITY_COLORS.Low;
          const isOpen = expanded[story.id];
          const coverPhoto = story.updates.find(u => u.photo_url)?.photo_url || story.photo_url;

          return (
            <div key={story.id} style={storyCardStyle}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Cover Image */}
              <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: '#1e1b4b' }}>
                {coverPhoto ? (
                  <img
                    src={coverPhoto.startsWith('http') ? coverPhoto : `${API}/${coverPhoto}`}
                    alt="Rescued animal"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '4rem' }}>🐾</div>
                )}
                {/* Severity badge */}
                <span style={{
                  position: 'absolute', top: 12, left: 12,
                  background: sev.bg, color: sev.text,
                  border: `1px solid ${sev.border}`,
                  borderRadius: 999, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {story.severity_label}
                </span>
                {/* Resolved badge */}
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(34,197,94,0.9)', color: '#fff',
                  borderRadius: 999, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
                }}>
                  ✅ Rescued
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {story.pet_name && (
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    🐶 {story.pet_name}
                  </h2>
                )}

                <p style={{
                  margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem',
                  display: '-webkit-box', WebkitLineClamp: isOpen ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {story.description}
                </p>

                {story.adoption_story && (
                  <div style={{
                    background: 'rgba(99,102,241,0.12)', borderRadius: 10,
                    padding: '0.75rem', borderLeft: '3px solid #6366f1',
                    color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontStyle: 'italic',
                  }}>
                    "{story.adoption_story}"
                  </div>
                )}

                {/* Meta */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                  {story.ngo_name && <span>🏥 {story.ngo_name}</span>}
                  {story.created_at && <span>📅 {new Date(story.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  <span>📋 {story.updates.length} update{story.updates.length !== 1 ? 's' : ''}</span>
                </div>

                {/* NGO Updates */}
                {story.updates.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleExpand(story.id)}
                      style={{
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                        color: '#a5b4fc', borderRadius: 8, padding: '0.4rem 0.9rem',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        transition: 'background 0.2s',
                      }}
                    >
                      {isOpen ? '▲ Hide Updates' : '▼ Show NGO Updates'}
                    </button>

                    {isOpen && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {story.updates.map((upd, i) => (
                          <div key={upd.id} style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: 10, padding: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                              <span style={{
                                minWidth: 22, height: 22, background: '#6366f1',
                                borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                              }}>{i + 1}</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{upd.notes}</p>
                                {upd.photo_url && (
                                  <img
                                    src={upd.photo_url.startsWith('http') ? upd.photo_url : `${API}/${upd.photo_url}`}
                                    alt="Update"
                                    style={{ width: '100%', borderRadius: 8, marginTop: '0.5rem', maxHeight: 180, objectFit: 'cover' }}
                                  />
                                )}
                                {upd.created_at && (
                                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                                    {new Date(upd.created_at).toLocaleDateString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecoveryStories;
