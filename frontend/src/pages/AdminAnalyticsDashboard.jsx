// frontend/src/pages/AdminAnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
import {
    ResponsiveContainer,
    LineChart, Line,
    BarChart, Bar,
    AreaChart, Area,
    PieChart, Pie, Cell,
    Tooltip as PieTooltip, Legend,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const BASE = API_BASE_URL;

const userToken = () => localStorage.getItem('token');
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const PIE_COLORS = ['#34d399', '#f87171', '#fbbf24', '#60a5fa'];

// ── Shared Styles ─────────────────────────────────────
const PANEL = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: '1rem',
    padding: '1.25rem 1.25rem 0.75rem',
};
const PANEL_TITLE = {
    fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 1rem',
};
const AXIS_STYLE = { fontSize: 11, fill: '#64748b' };
const TOOLTIP_STYLE = {
    background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(139,92,246,0.35)',
    borderRadius: 8, fontSize: 12, color: '#e2e8f0',
};

// ── Summary Card ──────────────────────────────────────
const SummaryCard = ({ icon, value, label, accent }) => (
    <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${accent}55`,
        borderRadius: '1rem', padding: '1.2rem 1rem', textAlign: 'center',
    }}>
        <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>{icon}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
);

// ── Main Component ────────────────────────────────────
const AdminAnalyticsDashboard = () => {
    const [cases,     setCases]     = useState(null);
    const [donations, setDonations] = useState(null);
    const [adoptions, setAdoptions] = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState('');

    useEffect(() => {
        const h = { Authorization: `Bearer ${userToken()}` };
        Promise.all([
            axios.get(`${BASE}/admin/dashboard/cases`,     { headers: h }),
            axios.get(`${BASE}/admin/dashboard/donations`, { headers: h }),
            axios.get(`${BASE}/admin/dashboard/adoptions`, { headers: h }),
        ]).then(([c, d, a]) => {
            // Normalize data for Recharts (add `name` key)
            setCases({
                ...c.data,
                monthwise: c.data.monthwise.map(r => ({ ...r, name: r.label })),
            });
            setDonations({
                ...d.data,
                monthwise: d.data.monthwise.map(r => ({ ...r, name: r.label })),
            });
            setAdoptions({
                ...a.data,
                monthwise: a.data.monthwise.map(r => ({ ...r, name: r.label })),
            });
        }).catch(e => {
            setError(e.response?.data?.detail || 'Failed to load — admin access required.');
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    if (error) return (
        <div style={{ maxWidth: 520, margin: '4rem auto', padding: '2rem', textAlign: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '1rem', color: '#f87171' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
            <p style={{ margin: 0 }}>{error}</p>
        </div>
    );

    // Case status breakdown for pie
    const casePieData = [
        { name: 'Resolved', value: cases?.resolved || 0 },
        { name: 'Pending',  value: cases?.pending  || 0 },
        { name: 'Accepted', value: cases?.accepted || 0 },
    ].filter(d => d.value > 0);

    return (
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '1rem 0.75rem' }}>
            {/* Header */}
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.35rem', background: 'linear-gradient(135deg,#f9a8d4,#c4b5fd,#a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                🔭 Platform Analytics
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 2rem' }}>Admin-only platform-wide insights and trends.</p>

            {/* ── Summary Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <SummaryCard icon="📋" value={cases?.total}               label="Total Cases"      accent="#a5b4fc" />
                <SummaryCard icon="✅" value={cases?.resolved}            label="Cases Resolved"   accent="#34d399" />
                <SummaryCard icon="💰" value={fmt(donations?.total_amount||0)} label="Total Donations" accent="#fbbf24" />
                <SummaryCard icon="🐾" value={adoptions?.total_adopted}   label="Pets Adopted"     accent="#f9a8d4" />
                <SummaryCard icon="🔴" value={cases?.pending}             label="Pending Cases"    accent="#f87171" />
                <SummaryCard icon="🐶" value={adoptions?.available}       label="Available Pets"   accent="#60a5fa" />
            </div>

            {/* ── Row 1: Cases per Year (Line) + Species/Status Pie ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Line Chart: Cases monthwise trend */}
                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Cases per Month</p>
                    {!cases?.monthwise?.length
                        ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No case data yet.</p>
                        : <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={cases.monthwise} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} name="Cases" />
                            </LineChart>
                          </ResponsiveContainer>
                    }
                </div>

                {/* Pie Chart: Case Status Breakdown */}
                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Cases by Species / Status</p>
                    {casePieData.length === 0
                        ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No case data yet.</p>
                        : <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={casePieData} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius={82} label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                                    {casePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <PieTooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                            </PieChart>
                          </ResponsiveContainer>
                    }
                </div>
            </div>

            {/* ── Row 2: Donations trend (Area) + Adoptions (Bar) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
                {/* Area Chart: Donations trend */}
                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Donations Trend (₹)</p>
                    {!donations?.monthwise?.length
                        ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No donation data yet.</p>
                        : <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={donations.monthwise} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
                                <defs>
                                    <linearGradient id="adminDonGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [fmt(v), 'Donations']} />
                                <Area type="monotone" dataKey="amount" stroke="#fbbf24" strokeWidth={2.5} fill="url(#adminDonGrad)" name="Donations (₹)" />
                            </AreaChart>
                          </ResponsiveContainer>
                    }
                </div>

                {/* Bar Chart: Adoptions per Month */}
                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Adoption Numbers</p>
                    {!adoptions?.monthwise?.length
                        ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No adoption data yet.</p>
                        : <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={adoptions.monthwise} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="count" name="Adoptions" fill="#f9a8d4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                    }
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsDashboard;
