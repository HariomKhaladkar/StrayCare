// src/components/MyAcceptedCases.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './MyAcceptedCases.module.css'; // We'll create this next

const MyAcceptedCases = () => {
    const [acceptedCases, setAcceptedCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMyCases = async () => {
            const token = localStorage.getItem('ngo_token');
            if (!token) {
                setError("You must be logged in.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get('/ngo/me/cases', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filter the results to only show 'Accepted' cases
                const filteredCases = response.data.filter(c => c.status === 'Accepted');
                setAcceptedCases(filteredCases);

            } catch (err) {
                setError('Failed to fetch your cases.');
            } finally {
                setLoading(false);
            }
        };
        fetchMyCases();
    }, []);

    if (loading) return <div className={styles.loading}>Loading your accepted cases...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <h1>My Active Cases</h1>
            <p className={styles.subtitle}>These are the cases you have accepted and are currently handling.</p>
            <div className={styles.caseGrid}>
                {acceptedCases.length > 0 ? (
                    acceptedCases.map(caseItem => (
                        <div key={caseItem.id} className={styles.caseCard}>
                             <img src={`http://127.0.0.1:8000/${caseItem.photo_url}`} alt="Reported Animal"/>
                             <div className={styles.cardContent}>
                                <h3>Case #{caseItem.id}</h3>
                                <p>{caseItem.description.substring(0, 100)}...</p>
                                {/* Link to the detail page to see and post updates */}
                                <Link to={`/cases/${caseItem.id}`} className={styles.detailsButton}>
                                    View & Post Updates
                                </Link>
                             </div>
                        </div>
                    ))
                ) : (
                    <p>You have not accepted any cases yet.</p>
                )}
            </div>
        </div>
    );
};

export default MyAcceptedCases;