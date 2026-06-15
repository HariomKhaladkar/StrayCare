// frontend/src/pages/NGOAnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
import {
    ResponsiveContainer,
    LineChart, Line,
    BarChart, Bar,
    AreaChart, Area,
    PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const BASE = API_BASE_URL;

const ngoToken = () => localStorage.getItem('ngo_token');
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const PIE_COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

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
        border: `1px solid ${accent}44`,
        borderRadius: '1rem', padding: '1.2rem 1rem', textAlign: 'center',
    }}>
        <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>{icon}</div>
        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
);

// ── Custom Pie Label ──────────────────────────────────
const renderPieLabel = ({ name, percent }) =>
    percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : '';

// ── Main Component ────────────────────────────────────
const NGOAnalyticsDashboard = () => {
    const [yearwise,  setYearwise]  = useState([]);
    const [monthwise, setMonthwise] = useState([]);
    const [species,   setSpecies]   = useState([]);
    const [adoptions, setAdoptions] = useState([]);
    const [donations, setDonations] = useState([]);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        const h = { Authorization: `Bearer ${ngoToken()}` };
        Promise.all([
            axios.get(`${BASE}/ngo/dashboard/cases/yearwise`,  { headers: h }),
            axios.get(`${BASE}/ngo/dashboard/cases/monthwise`, { headers: h }),
            axios.get(`${BASE}/ngo/dashboard/species`,         { headers: h }),
            axios.get(`${BASE}/ngo/dashboard/adoptions`,       { headers: h }),
            axios.get(`${BASE}/ngo/dashboard/donations`,       { headers: h }),
        ]).then(([yr, mo, sp, ad, dn]) => {
            setYearwise(yr.data.map(d => ({ ...d, name: d.label })));
            setMonthwise(mo.data.map(d => ({ ...d, name: d.label })));
            setSpecies(sp.data.map(d => ({ name: d.species, value: d.count })));
            setAdoptions(ad.data.map(d => ({ ...d, name: d.label })));
            setDonations(dn.data.map(d => ({ ...d, name: d.label })));
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    // Derived summary stats
    const totalCases    = yearwise.reduce((s, d) => s + (d.count || 0), 0);
    const totalAdopted  = adoptions.reduce((s, d) => s + (d.count || 0), 0);
    const totalDonated  = donations.reduce((s, d) => s + (d.amount || 0), 0);
    const topSpecies    = species.length ? species[0].name : '—';

    if (loading) return (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '1rem 0.75rem' }}>
            {/* Header */}
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.35rem', background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                📊 NGO Analytics
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 2rem' }}>Visual insights into your NGO's rescue and adoption performance.</p>

            {/* ── Summary Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <SummaryCard icon="📋" value={totalCases}      label="Total Cases"     accent="#a5b4fc" />
                <SummaryCard icon="✅" value={yearwise.filter(d=>d.count>0).length} label="Active Years" accent="#34d399" />
                <SummaryCard icon="💰" value={fmt(totalDonated)} label="Total Donations" accent="#fbbf24" />
                <SummaryCard icon="🐾" value={totalAdopted}    label="Pets Adopted"    accent="#f9a8d4" />
                <SummaryCard icon="🦴" value={topSpecies}      label="Top Species"     accent="#60a5fa" />
            </div>

            {/* ── Row 1: Cases per Year (Line) + Species (Pie) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Line Chart: Cases per Year */}
                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Cases per Year</p>
                    {yearwise.length === 0
                        ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No case data yet.</p>
                        : <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={yearwise} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} name="Cases" />
                            </LineChart>
                          </ResponsiveContainer>
                    }
                </div>

                {/* Pie Chart: Species Distribution */}
                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Cases by Species</p>
                    {species.length === 0
                        ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No species data yet.</p>
                        : <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={species} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={renderPieLabel} labelLine={false}>
                                    {species.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
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
                    {donations.length === 0
                        ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No donations yet.</p>
                        : <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={donations} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
                                <defs>
                                    <linearGradient id="ngoDonGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [fmt(v), 'Donations']} />
                                <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2.5} fill="url(#ngoDonGrad)" name="Donations (₹)" />
                            </AreaChart>
                          </ResponsiveContainer>
                    }
                </div>

                {/* Bar Chart: Adoptions per Month */}
                <div style={PANEL}>
                    <p style={PANEL_TITLE}>Adoptions per Month</p>
                    {adoptions.length === 0
                        ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No adoption data yet.</p>
                        : <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={adoptions} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" tick={AXIS_STYLE} />
                                <YAxis tick={AXIS_STYLE} allowDecimals={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="count" name="Adoptions" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                    }
                </div>
            </div>

            {/* ── Cases per Month (Bar) — full width ── */}
            <div style={{ ...PANEL, marginTop: '1.25rem' }}>
                <p style={PANEL_TITLE}>Cases per Month</p>
                {monthwise.length === 0
                    ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No monthly case data yet.</p>
                    : <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={monthwise} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="name" tick={AXIS_STYLE} />
                            <YAxis tick={AXIS_STYLE} allowDecimals={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Bar dataKey="count" name="Cases" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                }
            </div>
        </div>
    );
};

export default NGOAnalyticsDashboard;
