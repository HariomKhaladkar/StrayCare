// frontend/src/components/NGOPetListings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './NGOPetListings.module.css';
import API_BASE_URL from '../api';

const BASE_URL = API_BASE_URL;


const NGOPetListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState({});

    const fetchListings = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('ngo_token');
        try {
            const { data } = await axios.get(`${BASE_URL}/ngo/pets/listings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setListings(data);
        } catch {
            setError('Failed to fetch pet listings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    const handleAction = async (listingId, action) => {
        setActionLoading(p => ({ ...p, [listingId]: action }));
        const token = localStorage.getItem('ngo_token');
        try {
            await axios.put(`${BASE_URL}/ngo/pets/listings/${listingId}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setListings(prev => prev.filter(l => l.id !== listingId));
        } catch {
            alert(`Failed to ${action} listing.`);
        } finally {
            setActionLoading(p => ({ ...p, [listingId]: null }));
        }
    };

    if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>;
    if (error) return <p className={styles.errorMsg}>{error}</p>;

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1>🐾 User Pet Submissions</h1>
                <p>Review and approve or reject pets listed by citizens for adoption.</p>
            </div>

            {listings.length === 0 ? (
                <div className={styles.empty}>
                    <span>✅</span>
                    <p>No pending submissions to review.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {listings.map(listing => (
                        <div key={listing.id} className={styles.card}>
                            <div className={styles.imageWrap}>
                                <img
                                    src={`${BASE_URL}/${listing.image_url}`}
                                    alt={listing.name}
                                    className={styles.petImage}
                                    onError={(e) => { e.target.src = 'https://placehold.co/400x260/1e1b4b/a5b4fc?text=Pet+Photo'; }}
                                />
                                <span className={styles.statusBadge}>Pending Review</span>
                            </div>

                            <div className={styles.cardBody}>
                                <h3 className={styles.petName}>{listing.name}</h3>
                                <div className={styles.tags}>
                                    <span className={styles.tag}>🐶 {listing.species}</span>
                                    <span className={styles.tag}>📅 {listing.age}</span>
                                    <span className={styles.tag}>📍 {listing.location}</span>
                                </div>
                                {listing.description && (
                                    <p className={styles.description}>{listing.description}</p>
                                )}
                                <p className={styles.submittedDate}>
                                    Submitted: {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>

                            <div className={styles.actions}>
                                <button
                                    onClick={() => handleAction(listing.id, 'approve')}
                                    disabled={!!actionLoading[listing.id]}
                                    className={styles.approveBtn}
                                >
                                    {actionLoading[listing.id] === 'approve' ? '...' : '✅ Approve'}
                                </button>
                                <button
                                    onClick={() => handleAction(listing.id, 'reject')}
                                    disabled={!!actionLoading[listing.id]}
                                    className={styles.rejectBtn}
                                >
                                    {actionLoading[listing.id] === 'reject' ? '...' : '❌ Reject'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NGOPetListings;
