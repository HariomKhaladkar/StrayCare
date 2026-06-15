// frontend/src/components/LeaveFeedbackModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

const CATEGORIES = [
    'Response Time',
    'Treatment Quality',
    'Communication',
    'Adoption Process',
    'Overall Experience',
];

const StarRating = ({ rating, setRating }) => (
    <div style={{ display: 'flex', gap: '0.35rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
                key={star}
                onClick={() => setRating(star)}
                style={{
                    width: '2.2rem', height: '2.2rem', cursor: 'pointer',
                    color: rating >= star ? '#f59e0b' : '#4b5563',
                    filter: rating >= star ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : 'none',
                    transition: 'all 0.15s',
                }}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.445a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
            </svg>
        ))}
    </div>
);

const S = {
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '1rem',
    },
    modal: {
        background: 'linear-gradient(135deg, #1e1b4b 0%, #1a1035 100%)',
        border: '1px solid rgba(139,92,246,0.35)',
        borderRadius: '1.25rem', width: '100%', maxWidth: '500px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
    },
    header: {
        padding: '1.5rem 1.75rem 1rem',
        borderBottom: '1px solid rgba(139,92,246,0.2)',
    },
    title: { margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0' },
    sub: { margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' },
    body: { padding: '1.25rem 1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' },
    label: { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' },
    categoryGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.45rem' },
    catChip: (selected) => ({
        padding: '0.35rem 0.8rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.82rem',
        fontWeight: selected ? 700 : 500, transition: 'all 0.15s', border: '1px solid',
        background: selected ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
        borderColor: selected ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
        color: selected ? '#c4b5fd' : '#94a3b8',
    }),
    textarea: {
        width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)',
        borderRadius: '0.625rem', padding: '0.65rem 0.875rem', color: '#e2e8f0',
        fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
        boxSizing: 'border-box',
    },
    error: {
        color: '#f87171', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', padding: '0.55rem 0.8rem',
    },
    footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.25rem' },
    cancelBtn: {
        padding: '0.6rem 1.1rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.625rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem',
    },
    submitBtn: (disabled) => ({
        padding: '0.6rem 1.4rem',
        background: disabled ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        border: 'none', borderRadius: '0.625rem', color: 'white', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.9rem', fontWeight: 600, boxShadow: disabled ? 'none' : '0 4px 12px rgba(99,102,241,0.3)',
    }),
};

const LeaveFeedbackModal = ({ caseData, onClose, onFeedbackSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { setError('Please select a star rating.'); return; }
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            await axios.post(`${API_BASE_URL}/feedback`, {
                rating,
                comment,
                category: category || null,
                ngo_id: caseData.accepted_by_ngo_id,
                case_id: caseData.id,
            }, { headers: { Authorization: `Bearer ${token}` } });
            onFeedbackSubmitted();
        } catch {
            setError('Failed to submit feedback. You may have already reviewed this case.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={S.overlay}>
            <div style={S.modal}>
                <div style={S.header}>
                    <h2 style={S.title}>⭐ Leave Feedback</h2>
                    <p style={S.sub}>Case #{caseData.id} · Share your experience with the NGO</p>
                </div>
                <form onSubmit={handleSubmit} style={S.body}>
                    {/* Star Rating */}
                    <div>
                        <label style={S.label}>Your Rating *</label>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label style={S.label}>Category <span style={{ textTransform: 'none', color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
                        <div style={S.categoryGrid}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat} type="button"
                                    onClick={() => setCategory(category === cat ? '' : cat)}
                                    style={S.catChip(category === cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label style={S.label}>Comments <span style={{ textTransform: 'none', color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={S.textarea}
                            rows={4}
                            placeholder="Share what went well, what could be improved..."
                        />
                    </div>

                    {error && <p style={S.error}>{error}</p>}

                    <div style={S.footer}>
                        <button type="button" onClick={onClose} style={S.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={isLoading} style={S.submitBtn(isLoading)}>
                            {isLoading ? 'Submitting...' : '✅ Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveFeedbackModal;