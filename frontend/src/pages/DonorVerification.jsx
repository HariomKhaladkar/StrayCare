// frontend/src/pages/DonorVerification.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../api';

const BASE = API_BASE_URL;

const token = () => localStorage.getItem('token');

const S = {
    page:    { maxWidth: 640, margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'inherit' },
    back:    { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.5rem' },
    h1:      { fontSize: '1.9rem', fontWeight: 900, margin: '0 0 0.35rem', background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    sub:     { color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 2rem' },
    badge:   (s) => ({
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.4rem 1rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.875rem',
        background: s === 'Verified' ? 'rgba(16,185,129,0.15)' : s === 'Partial' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.1)',
        color:      s === 'Verified' ? '#34d399' : s === 'Partial' ? '#f59e0b' : '#f87171',
        border: `1px solid ${s === 'Verified' ? 'rgba(16,185,129,0.3)' : s === 'Partial' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.2)'}`,
    }),
    card:    { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.25rem' },
    cardH:   { fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    cardSub: { color: '#64748b', fontSize: '0.82rem', margin: '0 0 1rem' },
    input:   { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '0.625rem', padding: '0.65rem 0.9rem', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem', fontFamily: 'inherit' },
    row:     { display: 'flex', gap: '0.5rem' },
    btn:     (c) => ({ flex: 1, padding: '0.6rem 0.9rem', border: 'none', borderRadius: '0.625rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', background: c, color: 'white', transition: 'opacity 0.2s' }),
    outBtn:  { flex: 1, padding: '0.6rem 0.9rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.625rem', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },
    code:    { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.5rem', padding: '0.7rem 1rem', color: '#a5b4fc', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.2em', textAlign: 'center', marginBottom: '0.75rem', fontFamily: 'monospace' },
    ok:      { color: '#34d399', fontSize: '0.82rem', fontWeight: 600 },
    err:     { color: '#f87171', fontSize: '0.82rem' },
};

const BADGE_ICON = { Verified: '✅', Partial: '⚠️', Unverified: '🔴' };

const VerifyBlock = ({ label, isVerified, onRequest, onConfirm, extraInput, setExtra }) => {
    const [code, setCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [step, setStep] = useState('idle'); // idle | sent | done
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    if (isVerified) {
        return (
            <p style={S.ok}>✅ {label} verified!</p>
        );
    }

    const handleRequest = async () => {
        setLoading(true); setErr('');
        try {
            const data = await onRequest();
            setGeneratedCode(data.code);
            setStep('sent');
        } catch (e) {
            setErr(e.response?.data?.detail || 'Failed to generate code');
        } finally { setLoading(false); }
    };

    const handleConfirm = async () => {
        if (!code.trim()) { setErr('Enter the code first.'); return; }
        setLoading(true); setErr('');
        try {
            await onConfirm(code);
            setStep('done');
        } catch (e) {
            setErr(e.response?.data?.detail || 'Invalid code');
        } finally { setLoading(false); }
    };

    return (
        <div>
            {step === 'idle' && (
                <>
                    {extraInput !== undefined && (
                        <input
                            style={S.input}
                            placeholder="Enter phone number (e.g. +91 9876543210)"
                            value={extraInput}
                            onChange={e => setExtra(e.target.value)}
                        />
                    )}
                    <button onClick={handleRequest} disabled={loading} style={S.btn('linear-gradient(135deg,#8b5cf6,#6366f1)')}>
                        {loading ? 'Generating...' : `Send ${label} Code`}
                    </button>
                </>
            )}
            {step === 'sent' && !generatedCode && (
                <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Code sent! Check your {label.toLowerCase()}.</p>
            )}
            {step === 'sent' && generatedCode && (
                <>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                        🧪 Dev mode — your code (in production this would be sent via {label.toLowerCase()}):
                    </p>
                    <div style={S.code}>{generatedCode}</div>
                    <div style={S.row}>
                        <input
                            style={{ ...S.input, marginBottom: 0 }}
                            placeholder="Paste code here"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                        />
                        <button onClick={handleConfirm} disabled={loading} style={S.btn('linear-gradient(135deg,#10b981,#059669)')}>
                            {loading ? '...' : 'Confirm'}
                        </button>
                    </div>
                </>
            )}
            {step === 'done' && <p style={S.ok}>✅ {label} verified successfully!</p>}
            {err && <p style={S.err}>{err}</p>}
        </div>
    );
};

const DonorVerification = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [phone, setPhone] = useState('');

    const fetchStatus = useCallback(async () => {
        try {
            const { data } = await axios.get(`${BASE}/donor/status`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            setStatus(data);
        } catch { /* not logged in */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const requestEmail = async () => {
        const res = await axios.post(`${BASE}/donor/verify/email/request`, {}, {
            headers: { Authorization: `Bearer ${token()}` }
        });
        await fetchStatus();
        return res.data;
    };

    const confirmEmail = async (code) => {
        await axios.post(`${BASE}/donor/verify/email/confirm`, { code }, {
            headers: { Authorization: `Bearer ${token()}` }
        });
        await fetchStatus();
    };

    const requestPhone = async () => {
        const res = await axios.post(`${BASE}/donor/verify/phone/request`, { phone }, {
            headers: { Authorization: `Bearer ${token()}` }
        });
        await fetchStatus();
        return res.data;
    };

    const confirmPhone = async (code) => {
        await axios.post(`${BASE}/donor/verify/phone/confirm`, { code }, {
            headers: { Authorization: `Bearer ${token()}` }
        });
        await fetchStatus();
    };

    if (loading) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading...</div>;

    const vs = status?.verification_status || 'Unverified';

    return (
        <div style={S.page}>
            <Link to="/donor-dashboard" style={S.back}>← Back to Impact Dashboard</Link>

            <h1 style={S.h1}>Donor Verification</h1>
            <p style={S.sub}>Verify your identity to earn a Verified Donor badge and increase credibility.</p>

            {/* Status Badge */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={S.badge(vs)}>{BADGE_ICON[vs]} {vs} Donor</span>
                {status?.verified_at && (
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                        Since {new Date(status.verified_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                )}
            </div>

            {/* Email Verification */}
            <div style={S.card}>
                <h3 style={S.cardH}>📧 Email Verification</h3>
                <p style={S.cardSub}>Verify that you own a valid email address.</p>
                <VerifyBlock
                    label="Email"
                    isVerified={status?.email_verified}
                    onRequest={requestEmail}
                    onConfirm={confirmEmail}
                />
            </div>

            {/* Phone Verification */}
            <div style={S.card}>
                <h3 style={S.cardH}>📱 Phone Verification</h3>
                <p style={S.cardSub}>Verify your phone number for enhanced credibility.</p>
                <VerifyBlock
                    label="Phone"
                    isVerified={status?.phone_verified}
                    onRequest={requestPhone}
                    onConfirm={confirmPhone}
                    extraInput={phone}
                    setExtra={setPhone}
                />
            </div>

            {/* ID Verification Placeholder */}
            <div style={{ ...S.card, opacity: 0.6 }}>
                <h3 style={S.cardH}>🪪 ID Verification <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>(Coming soon for large donors)</span></h3>
                <p style={S.cardSub}>Upload a government-issued ID for donors contributing over ₹10,000.</p>
                <button disabled style={{ ...S.btn('rgba(99,102,241,0.3)'), cursor: 'not-allowed' }}>Upload ID (Coming Soon)</button>
            </div>
        </div>
    );
};

export default DonorVerification;
