// frontend/src/pages/DonorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';

const BASE_URL = API_BASE_URL;


// ── Helpers ──────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const S = {
    page:   { maxWidth: 1060, margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'inherit' },
    hero:   { textAlign: 'center', marginBottom: '2.5rem' },
    h1:     { fontSize: '2.2rem', fontWeight: 900, margin: '0 0 0.5rem', background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    sub:    { color: '#94a3b8', fontSize: '1rem', margin: 0 },
    grid4:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '1.1rem', marginBottom: '2rem' },
    card:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '1rem', padding: '1.4rem 1.2rem', textAlign: 'center' },
    icon:   { fontSize: '2rem', marginBottom: '0.5rem' },
    val:    { fontSize: '1.9rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1 },
    lbl:    { fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.35rem' },
    section:{ marginBottom: '2.5rem' },
    sh2:    { fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' },
    chart:  { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '1rem', padding: '1.5rem' },
    barRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' },
    barLbl: { width: '72px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right', flexShrink: 0 },
    barBg:  { flex: 1, height: '22px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' },
    barFill:(pct, color) => ({ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.6s ease' }),
    barAmt: { width: '80px', fontSize: '0.78rem', color: '#64748b', textAlign: 'right', flexShrink: 0 },
    twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' },
    donateBtn: {
        display: 'inline-block', padding: '0.8rem 2rem', marginTop: '0.5rem',
        background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', borderRadius: '0.75rem',
        color: 'white', fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
        boxShadow: '0 6px 20px rgba(99,102,241,0.35)', transition: 'transform 0.2s',
    },
    spinner: { width: 36, height: 36, border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '3rem auto' },
};

// ── Bar Chart ─────────────────────────────────────────
const BarChart = ({ data, labelKey, amountKey, color }) => {
    const max = Math.max(...data.map(d => d[amountKey] || 0), 1);
    return (
        <div style={S.chart}>
            {data.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>No donation data yet.</p>}
            {data.map((d, i) => (
                <div key={i} style={S.barRow}>
                    <span style={S.barLbl}>{d[labelKey]}</span>
                    <div style={S.barBg}>
                        <div style={S.barFill(((d[amountKey] || 0) / max) * 100, color)} />
                    </div>
                    <span style={S.barAmt}>{fmt(d[amountKey] || 0)}</span>
                </div>
            ))}
        </div>
    );
};

// ── Main Component ────────────────────────────────────
const DonorDashboard = () => {
    const [monthwise, setMonthwise] = useState([]);
    const [yearwise,  setYearwise]  = useState([]);
    const [cases,     setCases]     = useState(null);
    const [adoptions, setAdoptions] = useState(null);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get(`${BASE_URL}/donor/dashboard/donations/monthwise`),
            axios.get(`${BASE_URL}/donor/dashboard/donations/yearwise`),
            axios.get(`${BASE_URL}/donor/dashboard/cases-supported`),
            axios.get(`${BASE_URL}/donor/dashboard/adoptions`),
        ]).then(([m, y, c, a]) => {
            setMonthwise(m.data);
            setYearwise(y.data);
            setCases(c.data);
            setAdoptions(a.data);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={S.spinner} /></div>;

    const totalDonated = yearwise.reduce((s, r) => s + (r.amount || 0), 0);

    return (
        <div style={S.page}>
            {/* Hero */}
            <div style={S.hero}>
                <h1 style={S.h1}>💛 Impact Dashboard</h1>
                <p style={S.sub}>See exactly how your donations are saving lives. Every rupee counts.</p>
            </div>

            {/* Stats Cards */}
            <div style={S.grid4}>
                <div style={{ ...S.card, borderColor: 'rgba(99,102,241,0.35)' }}>
                    <div style={S.icon}>💰</div>
                    <div style={{ ...S.val, color: '#a5b4fc' }}>{fmt(totalDonated)}</div>
                    <div style={S.lbl}>Total Donated</div>
                </div>
                <div style={{ ...S.card, borderColor: 'rgba(16,185,129,0.3)' }}>
                    <div style={S.icon}>🐾</div>
                    <div style={{ ...S.val, color: '#34d399' }}>{adoptions?.total_adoptions ?? '—'}</div>
                    <div style={S.lbl}>Pets Adopted</div>
                </div>
                <div style={{ ...S.card, borderColor: 'rgba(245,158,11,0.3)' }}>
                    <div style={S.icon}>🏥</div>
                    <div style={{ ...S.val, color: '#fbbf24' }}>{cases?.resolved_cases ?? '—'}</div>
                    <div style={S.lbl}>Cases Resolved</div>
                </div>
                <div style={{ ...S.card, borderColor: 'rgba(236,72,153,0.3)' }}>
                    <div style={S.icon}>🏢</div>
                    <div style={{ ...S.val, color: '#f472b6' }}>{adoptions?.ngo_count ?? '—'}</div>
                    <div style={S.lbl}>Partner NGOs</div>
                </div>
            </div>

            {/* Additional stats row */}
            <div style={{ ...S.grid4, gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', marginBottom: '2.5rem' }}>
                <div style={S.card}>
                    <div style={S.icon}>📋</div>
                    <div style={S.val}>{cases?.total_cases ?? '—'}</div>
                    <div style={S.lbl}>Total Cases Reported</div>
                </div>
                <div style={S.card}>
                    <div style={S.icon}>🔴</div>
                    <div style={{ ...S.val, color: '#f87171' }}>{cases?.active_cases ?? '—'}</div>
                    <div style={S.lbl}>Active Cases</div>
                </div>
                <div style={S.card}>
                    <div style={S.icon}>🐶</div>
                    <div style={{ ...S.val, color: '#60a5fa' }}>{adoptions?.available_pets ?? '—'}</div>
                    <div style={S.lbl}>Pets Available</div>
                </div>
            </div>

            {/* Charts */}
            <div style={S.twoCol}>
                <div style={S.section}>
                    <h2 style={S.sh2}>📅 Month-wise Donations</h2>
                    <BarChart
                        data={monthwise}
                        labelKey="month"
                        amountKey="amount"
                        color="linear-gradient(90deg,#8b5cf6,#6366f1)"
                    />
                </div>
                <div style={S.section}>
                    <h2 style={S.sh2}>📆 Year-wise Donations</h2>
                    <BarChart
                        data={yearwise}
                        labelKey="year"
                        amountKey="amount"
                        color="linear-gradient(90deg,#ec4899,#f59e0b)"
                    />
                </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Moved by the impact? Help us reach more animals in need.</p>
                <Link to="/donate" style={S.donateBtn}>❤️ Donate Now</Link>
            </div>
        </div>
    );
};

export default DonorDashboard;
