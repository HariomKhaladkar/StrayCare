// frontend/src/components/NGOFeedback.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

const BASE_URL = API_BASE_URL;


const CATEGORY_COLORS = {
    'Response Time': '#6366f1',
    'Treatment Quality': '#10b981',
    'Communication': '#f59e0b',
    'Adoption Process': '#ec4899',
    'Overall Experience': '#8b5cf6',
};

// --- Sub-components ---

const StarDisplay = ({ rating, size = 18 }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {stars.map(s => (
                <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill={s <= Math.round(rating) ? '#f59e0b' : '#374151'}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.445a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                </svg>
            ))}
        </div>
    );
};

const RatingBar = ({ star, count, maxCount }) => {
    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ width: '16px', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, textAlign: 'right' }}>{star}★</span>
            <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                    borderRadius: '999px',
                    transition: 'width 0.6s ease',
                }} />
            </div>
            <span style={{ width: '20px', color: '#64748b', fontSize: '0.8rem', textAlign: 'right' }}>{count}</span>
        </div>
    );
};

const NGOResponseSection = ({ review, ngoToken, onResponded }) => {
    const [showInput, setShowInput] = useState(false);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            await axios.put(
                `${BASE_URL}/feedback/${review.id}/respond`,
                { response: text },
                { headers: { Authorization: `Bearer ${ngoToken}` } }
            );
            onResponded(review.id, text);
            setShowInput(false);
        } catch {
            alert('Failed to submit response.');
        } finally {
            setLoading(false);
        }
    };

    if (review.ngo_response) {
        return (
            <div style={{
                marginTop: '0.75rem', padding: '0.75rem 1rem',
                background: 'rgba(99,102,241,0.1)', borderLeft: '3px solid #6366f1',
                borderRadius: '0 0.5rem 0.5rem 0',
            }}>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '0.25rem' }}>Your Response:</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#c4b5fd' }}>{review.ngo_response}</p>
            </div>
        );
    }

    return showInput ? (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                placeholder="Write a professional response..."
                style={{
                    width: '100%', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(99,102,241,0.3)', borderRadius: '0.5rem',
                    padding: '0.6rem 0.8rem', color: '#e2e8f0', fontSize: '0.85rem',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowInput(false)} style={{ padding: '0.35rem 0.8rem', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                <button onClick={handleSubmit} disabled={loading} style={{ padding: '0.35rem 0.9rem', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', borderRadius: '0.4rem', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    {loading ? '...' : 'Post Response'}
                </button>
            </div>
        </div>
    ) : (
        <button onClick={() => setShowInput(true)} style={{
            marginTop: '0.6rem', padding: '0.3rem 0.75rem', background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)', borderRadius: '0.4rem',
            color: '#a5b4fc', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
        }}>
            💬 Reply
        </button>
    );
};

// --- Main Component ---

const NGOFeedback = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const ngoToken = localStorage.getItem('ngo_token');

    const fetchFeedback = useCallback(async () => {
        const ngoId = localStorage.getItem('ngo_id');
        if (!ngoId) { setError('Could not identify the NGO. Please log in again.'); setLoading(false); return; }
        try {
            const { data } = await axios.get(`${BASE_URL}/feedback/summary/${ngoId}`);
            setSummary(data);
        } catch {
            setError('Failed to fetch feedback data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

    const handleResponded = (reviewId, responseText) => {
        setSummary(prev => ({
            ...prev,
            reviews: prev.reviews.map(r => r.id === reviewId ? { ...r, ngo_response: responseText } : r),
        }));
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading Feedback...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>{error}</div>;

    const maxCount = summary?.rating_distribution
        ? Math.max(...summary.rating_distribution.map(d => d.count), 1)
        : 1;

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '1.5rem', background: 'linear-gradient(135deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ⭐ Your NGO Feedback
            </h1>

            {/* Summary Card */}
            <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '1.1rem', padding: '1.5rem', marginBottom: '1.5rem',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem',
            }}>
                {/* Average Rating */}
                <div>
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Average Rating</p>
                    {summary?.average_rating ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{summary.average_rating}</span>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>/ 5</span>
                        </div>
                    ) : (
                        <p style={{ color: '#64748b', margin: 0 }}>No reviews yet</p>
                    )}
                    {summary?.average_rating && <StarDisplay rating={summary.average_rating} size={22} />}
                    <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>{summary?.total_reviews || 0} total reviews</p>
                </div>

                {/* Rating Distribution */}
                <div>
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rating Distribution</p>
                    {summary?.rating_distribution?.slice().reverse().map(d => (
                        <RatingBar key={d.star} star={d.star} count={d.count} maxCount={maxCount} />
                    ))}
                </div>
            </div>

            {/* Individual Reviews */}
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>All Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {summary?.reviews?.length > 0 ? (
                    summary.reviews.map(review => (
                        <div key={review.id} style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(139,92,246,0.15)',
                            borderRadius: '0.875rem', padding: '1.1rem 1.25rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <StarDisplay rating={review.rating} />
                                <div style={{ display: 'flex', gap: '0.5rem', alginItems: 'center', flexWrap: 'wrap' }}>
                                    {review.category && (
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem',
                                            borderRadius: '999px', background: `${CATEGORY_COLORS[review.category] || '#8b5cf6'}22`,
                                            color: CATEGORY_COLORS[review.category] || '#8b5cf6',
                                            border: `1px solid ${CATEGORY_COLORS[review.category] || '#8b5cf6'}44`,
                                        }}>
                                            {review.category}
                                        </span>
                                    )}
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <p style={{ margin: '0.25rem 0', color: review.comment ? '#cbd5e1' : '#64748b', fontSize: '0.9rem', fontStyle: review.comment ? 'normal' : 'italic' }}>
                                {review.comment || 'No comment provided.'}
                            </p>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#475569' }}>Case ID: #{review.case_id}</p>
                            <NGOResponseSection review={review} ngoToken={ngoToken} onResponded={handleResponded} />
                        </div>
                    ))
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '3rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px dashed rgba(139,92,246,0.2)', borderRadius: '1rem',
                        color: '#64748b',
                    }}>
                        No reviews have been submitted yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NGOFeedback;