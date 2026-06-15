// frontend/src/components/MyPetListings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UserPetListingForm from './UserPetListingForm';
import styles from './MyPetListings.module.css';
import API_BASE_URL from '../api';

const BASE_URL = API_BASE_URL;


const STATUS_CONFIG = {
    Pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '⏳', label: 'Pending Review' },
    Approved: { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: '✅', label: 'Approved' },
    Rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '❌', label: 'Rejected' },
};

const MyPetListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const { data } = await axios.get(`${BASE_URL}/users/pets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setListings(data);
        } catch {
            // silent fail — empty state is shown
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    const handleSuccess = () => {
        setShowForm(false);
        fetchListings();
    };

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div>
                    <h1>🐾 My Pet Listings</h1>
                    <p>Track the adoption listings you've submitted.</p>
                </div>
                <button onClick={() => setShowForm(true)} className={styles.listBtn}>
                    + List a Pet
                </button>
            </div>

            {showForm && (
                <UserPetListingForm
                    onClose={() => setShowForm(false)}
                    onSuccess={handleSuccess}
                />
            )}

            {loading ? (
                <div className={styles.center}><div className={styles.spinner} /></div>
            ) : listings.length === 0 ? (
                <div className={styles.empty}>
                    <span>🐾</span>
                    <p>You haven't listed any pets yet.</p>
                    <button onClick={() => setShowForm(true)} className={styles.listBtn}>
                        List your first pet
                    </button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {listings.map(listing => {
                        const cfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.Pending;
                        return (
                            <div key={listing.id} className={styles.card}>
                                <div className={styles.imageWrap}>
                                    <img
                                        src={`${BASE_URL}/${listing.image_url}`}
                                        alt={listing.name}
                                        className={styles.petImage}
                                        onError={(e) => { e.target.src = 'https://placehold.co/400x220/1e1b4b/a5b4fc?text=' + listing.name; }}
                                    />
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.nameRow}>
                                        <h3>{listing.name}</h3>
                                        <span
                                            className={styles.statusChip}
                                            style={{ color: cfg.color, background: cfg.bg }}
                                        >
                                            {cfg.icon} {cfg.label}
                                        </span>
                                    </div>
                                    <div className={styles.tags}>
                                        <span className={styles.tag}>🐶 {listing.species}</span>
                                        <span className={styles.tag}>📅 {listing.age}</span>
                                        <span className={styles.tag}>📍 {listing.location}</span>
                                    </div>
                                    {listing.description && (
                                        <p className={styles.desc}>{listing.description}</p>
                                    )}
                                    <p className={styles.date}>
                                        Listed on {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyPetListings;
