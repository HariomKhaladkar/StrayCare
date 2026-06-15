// frontend/src/pages/CitizenAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
    BarChart, Bar,
    AreaChart, Area,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import API_BASE_URL from '../api';

const BASE = API_BASE_URL;

// ── Shared chart style tokens ──────────────────────────────
const PANEL = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: '1.1rem',
    padding: '1.4rem 1.4rem 1rem',
};
const PANEL_TITLE = {
    fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1.1rem',
};
const AXIS  = { fontSize: 11, fill: '#64748b' };
const TIP   = { background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' };
const PIE_C = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#14b8a6', '#ec4899'];

// ── KPI card ──────────────────────────────────────────────
const KpiCard = ({ icon, value, label, accent }) => (
    <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${accent}44`,
        borderRadius: '1rem', padding: '1.2rem 1rem', textAlign: 'center',
    }}>
        <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>{icon}</div>
        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
);

// ── Empty state ────────────────────────────────────────────
const Empty = ({ msg = 'No data yet — start using StrayCare to see charts here!' }) => (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#475569', fontSize: '0.85rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
        {msg}
    </div>
);

// ── Main Component ─────────────────────────────────────────
const CitizenAnalytics = () => {
    const [myCases,        setMyCases]        = useState([]);
    const [platformCases,  setPlatformCases]  = useState(null);
    const [adoptionStats,  setAdoptionStats]  = useState(null);
    const [donationsMonth, setDonationsMonth] = useState([]);
    const [donationsYear,  setDonationsYear]  = useState([]);
    const [loading,        setLoading]        = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const h     = { Authorization: `Bearer ${token}` };
        Promise.all([
            axios.get(`${BASE}/users/me/cases`, { headers: h }),
            axios.get(`${BASE}/donor/dashboard/cases-supported`),
            axios.get(`${BASE}/donor/dashboard/adoptions`),
            axios.get(`${BASE}/donor/dashboard/donations/monthwise`),
            axios.get(`${BASE}/donor/dashboard/donations/yearwise`),
        ]).then(([mc, pc, ad, dm, dy]) => {
            setMyCases(mc.data);
            setPlatformCases(pc.data);
            setAdoptionStats(ad.data);
            setDonationsMonth(dm.data);
            setDonationsYear(dy.data);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    // ── Derived data ───────────────────────────────────────

    // My Cases — status pie
    const myPending  = myCases.filter(c => c.status === 'Pending').length;
    const myAccepted = myCases.filter(c => c.status === 'Accepted').length;
    const myResolved = myCases.filter(c => c.status === 'Resolved').length;
    const myRejected = myCases.filter(c => c.status === 'Rejected').length;
    const caseStatusPie = [
        { name: 'Pending',  value: myPending  },
        { name: 'Active',   value: myAccepted },
        { name: 'Resolved', value: myResolved },
        { name: 'Rejected', value: myRejected },
    ].filter(d => d.value > 0);

    // My Cases — severity pie
    const sevCount = (label) => myCases.filter(c => c.severity_label === label).length;
    const caseSevPie = [
        { name: 'Critical', value: sevCount('Critical') },
        { name: 'High',     value: sevCount('High')     },
        { name: 'Moderate', value: sevCount('Moderate') },
        { name: 'Low',      value: sevCount('Low')      },
    ].filter(d => d.value > 0);
    const SEV_C = { Critical: '#ef4444', High: '#f97316', Moderate: '#eab308', Low: '#22c55e' };

    // Platform rescue trend (bar from case stats)
    const rescueTrend = platformCases ? [
        { name: 'Pending',  count: platformCases.active_cases  },
        { name: 'Resolved', count: platformCases.resolved_cases },
    ] : [];

    // Total donated (sum yearwise)
    const totalDonated = donationsYear.reduce((s, r) => s + (r.amount || 0), 0);
    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    if (loading) return (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '1rem 0.75rem' }}>

            {/* ── Header ─────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <Link to="/dashboard" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                    ← Dashboard
                </Link>
            </div>
            <h1 style={{
                fontSize: '2rem', fontWeight: 900, margin: '0 0 0.35rem',
                background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd,#f9a8d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
                📊 My Analytics
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 2rem' }}>
                Visual breakdown of your rescue activity and platform-wide impact.
            </p>

            {/* ── KPI Row ────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <KpiCard icon="📋" value={myCases.length}                    label="My Reports"       accent="#a5b4fc" />
                <KpiCard icon="✅" value={myResolved}                         label="Resolved"          accent="#34d399" />
                <KpiCard icon="🐾" value={adoptionStats?.total_adoptions ?? 0} label="Platform Adoptions" accent="#f9a8d4" />
                <KpiCard icon="🏥" value={adoptionStats?.ngo_count ?? 0}      label="Partner NGOs"      accent="#fbbf24" />
                <KpiCard icon="💰" value={fmt(totalDonated)}                  label="Platform Donated"  accent="#60a5fa" />
            </div>

            {/* ── Row 1: My Cases by Status (Pie) + by Severity (Pie) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem', marginBottom: '1rem' }}>

                <div style={PANEL}>
                    <p style={PANEL_TITLE}>My Cases — Status Breakdown</p>
                    {caseStatusPie.length === 0 ? <Empty msg="No cases reported yet." /> :
                        <ResponsiveContainer width="100%" height={230}>
                            <PieChart>
                                <Pie data={caseStatusPie} dataKey="value" nameKey="name"
                                    cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                                    label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                    labelLine={false}
                                >
                                    {caseStatusPie.map((_, i) => <Cell key={i} fill={PIE_C[i % PIE_C.length]} />)}
                                </Pie>
                                <PieTooltip contentStyle={TIP} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    }
                </div>

                <div style={PANEL}>
                    <p style={PANEL_TITLE}>My Cases — Severity Distribution</p>
                    {caseSevPie.length === 0 ? <Empty msg="No cases reported yet." /> :
                        <ResponsiveContainer width="100%" height={230}>
                            <PieChart>
                                <Pie data={caseSevPie} dataKey="value" nameKey="name"
                                    cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                                    label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                    labelLine={false}
                                >
                                    {caseSevPie.map((d, i) => <Cell key={i} fill={SEV_C[d.name] || PIE_C[i]} />)}
                                </Pie>
                                <PieTooltip contentStyle={TIP} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    }
                </div>
            </div>

            {/* ── Row 2: Platform Rescue Status (Bar) + Adoption count (Bar) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem', marginBottom: '1rem' }}>

                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Platform — Case Status Overview</p>
                    {rescueTrend.length === 0 ? <Empty /> :
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={rescueTrend} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" tick={AXIS} />
                                <YAxis tick={AXIS} allowDecimals={false} />
                                <Tooltip contentStyle={TIP} />
                                <Bar dataKey="count" name="Cases" radius={[6, 6, 0, 0]}>
                                    {rescueTrend.map((d, i) => (
                                        <Cell key={i} fill={d.name === 'Resolved' ? '#22c55e' : '#f59e0b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    }
                </div>

                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Platform — Pets Available vs Adopted</p>
                    {!adoptionStats ? <Empty /> : (() => {
                        const data = [
                            { name: 'Available', count: adoptionStats.available_pets || 0 },
                            { name: 'Adopted',   count: adoptionStats.total_adoptions || 0 },
                        ];
                        return (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" tick={AXIS} />
                                    <YAxis tick={AXIS} allowDecimals={false} />
                                    <Tooltip contentStyle={TIP} />
                                    <Bar dataKey="count" name="Pets" radius={[6, 6, 0, 0]}>
                                        <Cell fill="#6366f1" />
                                        <Cell fill="#10b981" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        );
                    })()}
                </div>
            </div>

            {/* ── Row 3: Monthly Donations (Area) — full width ── */}
            <div style={{ ...PANEL, marginBottom: '1.25rem' }}>
                <p style={PANEL_TITLE}>Platform — Monthly Donation Trend (₹)</p>
                {donationsMonth.length === 0 ? <Empty msg="No donation data available yet." /> :
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={donationsMonth.map(d => ({ ...d, name: d.month }))} margin={{ top: 4, right: 16, bottom: 0, left: -4 }}>
                            <defs>
                                <linearGradient id="donGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="name" tick={AXIS} />
                            <YAxis tick={AXIS} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={TIP} formatter={v => [fmt(v), 'Donated']} />
                            <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#donGrad)" name="Donations (₹)" />
                        </AreaChart>
                    </ResponsiveContainer>
                }
            </div>

            {/* ── Row 4: Year-wise Donations (Line) — full width ── */}
            <div style={PANEL}>
                <p style={PANEL_TITLE}>Platform — Year-wise Donation Growth (₹)</p>
                {donationsYear.length === 0 ? <Empty msg="No yearly donation data yet." /> :
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={donationsYear.map(d => ({ ...d, name: d.year }))} margin={{ top: 4, right: 16, bottom: 0, left: -4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="name" tick={AXIS} />
                            <YAxis tick={AXIS} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={TIP} formatter={v => [fmt(v), 'Total Donated']} />
                            <Line type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={2.5}
                                dot={{ fill: '#ec4899', r: 5 }} activeDot={{ r: 7 }} name="Donated (₹)" />
                        </LineChart>
                    </ResponsiveContainer>
                }
            </div>

        </div>
    );
};

export default CitizenAnalytics;
