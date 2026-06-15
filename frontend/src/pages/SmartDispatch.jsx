// frontend/src/pages/SmartDispatch.jsx
// Feature 1: Smart NGO Dispatch – Admin page
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

const SEVERITY_CONFIG = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', emoji: '🔴' },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', emoji: '🟠' },
  Moderate: { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.35)',  emoji: '🟡' },
  Low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  emoji: '🟢' },
};

const adminToken = () => localStorage.getItem('token');
const BASE = API_BASE_URL;

// ─── NGO Score Bar ─────────────────────────────────────────────────────────────
const ScoreBar = ({ label, value, max, color }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.2rem' }}>
      <span>{label}</span><span>{value.toFixed(1)} / {max}</span>
    </div>
    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  </div>
);

// ─── Recommendation Card ────────────────────────────────────────────────────────
const NGORecommendationCard = ({ rec, rank, caseId, onAssigned }) => {
  const [assigning, setAssigning] = useState(false);
  const [done, setDone] = useState(false);

  const handleAssign = async () => {
    if (!window.confirm(`Assign Case #${caseId} to "${rec.ngo_name}"?`)) return;
    setAssigning(true);
    try {
      await axios.put(`${BASE}/admin/cases/${caseId}/assign/${rec.ngo_id}`, {}, {
        headers: { Authorization: `Bearer ${adminToken()}` }
      });
      setDone(true);
      onAssigned();
    } catch (e) {
      alert('Assignment failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setAssigning(false);
    }
  };

  const rankColors = ['#fbbf24', '#94a3b8', '#a16207'];
  const rankEmoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <div style={{
      background: done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${done ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: '0.8rem', padding: '1rem', transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
        <div>
          <span style={{ fontSize: '1.1rem', marginRight: '0.4rem' }}>{rankEmoji[rank] || (rank + 1) + '.'}</span>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9' }}>{rec.ngo_name}</span>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', fontWeight: 900, fontSize: '1rem',
          padding: '0.2rem 0.7rem', borderRadius: '99px',
          boxShadow: '0 3px 12px rgba(99,102,241,0.4)',
        }}>
          {rec.total_score.toFixed(0)} pts
        </div>
      </div>

      <div style={{ marginBottom: '0.9rem' }}>
        <ScoreBar label="📍 Proximity" value={rec.proximity_score} max={50} color="#6366f1" />
        <ScoreBar label="📋 Availability" value={rec.caseload_score} max={30} color="#22c55e" />
      </div>

      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.8rem' }}>
        <span>📏 {rec.distance_km} km away</span>
        <span>📂 {rec.active_cases} active cases</span>
      </div>

      {done ? (
        <div style={{ textAlign: 'center', color: '#22c55e', fontWeight: 700, fontSize: '0.9rem' }}>✅ Assigned!</div>
      ) : (
        <button
          onClick={handleAssign}
          disabled={assigning}
          style={{
            width: '100%', padding: '0.55rem', border: 'none', borderRadius: '0.5rem',
            fontWeight: 700, cursor: assigning ? 'wait' : 'pointer',
            background: assigning ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: '0.85rem', transition: 'all 0.2s',
          }}
        >
          {assigning ? 'Assigning…' : '🚑 Dispatch to this NGO'}
        </button>
      )}
    </div>
  );
};

// ─── Case Card ─────────────────────────────────────────────────────────────────
const CaseCard = ({ caseData, selectedCaseId, onSelect, recommendations, loadingRec, onAssigned }) => {
  const sev = SEVERITY_CONFIG[caseData.severity_label] || SEVERITY_CONFIG.Low;
  const isSelected = selectedCaseId === caseData.id;

  return (
    <div style={{
      background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isSelected ? 'rgba(99,102,241,0.5)' : sev.border}`,
      borderRadius: '1rem', padding: '1rem', marginBottom: '1rem',
      cursor: 'pointer', transition: 'all 0.25s',
    }}
      onClick={() => onSelect(caseData.id)}
    >
      {/* Severity Badge + ID */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{
          background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
          fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.7rem', borderRadius: '99px', letterSpacing: '0.04em',
        }}>
          {sev.emoji} {caseData.severity_label} · Score {caseData.severity_score}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Case #{caseData.id}</span>
      </div>

      <p style={{ color: '#e2e8f0', fontSize: '0.88rem', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
        {caseData.description?.slice(0, 100)}{caseData.description?.length > 100 ? '…' : ''}
      </p>

      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
        📍 {caseData.latitude?.toFixed(4)}, {caseData.longitude?.toFixed(4)} &nbsp;·&nbsp;
        🕐 {caseData.created_at ? new Date(caseData.created_at).toLocaleString() : 'Unknown'}
      </div>

      {/* Expanded Recommendations */}
      {isSelected && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.75rem' }}>
            🏥 Top NGO Recommendations
          </p>
          {loadingRec ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.4)' }}>
              Computing best matches…
            </div>
          ) : recommendations?.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {recommendations.map((rec, i) => (
                <NGORecommendationCard
                  key={rec.ngo_id} rec={rec} rank={i}
                  caseId={caseData.id} onAssigned={onAssigned}
                />
              ))}
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center' }}>No verified NGOs available.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SmartDispatch() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [recommendations, setRecommendations] = useState({});
  const [loadingRec, setLoadingRec] = useState(false);

  const h = { Authorization: `Bearer ${adminToken()}` };

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/admin/cases/pending-unassigned`, { headers: h });
      setCases(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Admin access required.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const handleSelectCase = async (caseId) => {
    if (selectedCaseId === caseId) {
      setSelectedCaseId(null);
      return;
    }
    setSelectedCaseId(caseId);
    if (recommendations[caseId]) return;  // cached

    setLoadingRec(true);
    try {
      const res = await axios.get(`${BASE}/admin/cases/${caseId}/dispatch`, { headers: h });
      setRecommendations(prev => ({ ...prev, [caseId]: res.data.recommendations }));
    } catch (e) {
      setRecommendations(prev => ({ ...prev, [caseId]: [] }));
    } finally {
      setLoadingRec(false);
    }
  };

  // Group by severity
  const grouped = { Critical: [], High: [], Moderate: [], Low: [] };
  cases.forEach(c => { (grouped[c.severity_label] || grouped.Low).push(c); });

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1rem 0.75rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.3rem',
          background: 'linear-gradient(135deg, #f97316, #ef4444, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          🚑 Smart Dispatch Center
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          AI-ranked NGO recommendations using Haversine distance + caseload scoring. Click a case to see the best NGO for the job.
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '0.65rem', marginBottom: '1.5rem' }}>
          {Object.entries(grouped).map(([label, arr]) => {
            const sev = SEVERITY_CONFIG[label];
            return (
              <div key={label} style={{
                background: sev.bg, border: `1px solid ${sev.border}`,
                borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: sev.color }}>{arr.length}</div>
                <div style={{ fontSize: '0.68rem', color: sev.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {sev.emoji} {label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)' }}>Loading cases…</div>
      )}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1.5rem', color: '#f87171', textAlign: 'center' }}>
          🔒 {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {cases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.35)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
              <p>No pending cases! All cases have been assigned.</p>
            </div>
          ) : (
            cases.map(c => (
              <CaseCard
                key={c.id}
                caseData={c}
                selectedCaseId={selectedCaseId}
                onSelect={handleSelectCase}
                recommendations={recommendations[c.id]}
                loadingRec={loadingRec && selectedCaseId === c.id}
                onAssigned={fetchCases}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
