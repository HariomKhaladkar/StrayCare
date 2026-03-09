// src/components/MyReports.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './MyReports.module.css'; // <-- 1. IMPORT THE CSS MODULE
import LeaveFeedbackModal from './LeaveFeedbackModal';

const MyReports = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCaseForFeedback, setSelectedCaseForFeedback] = useState(null);

    const fetchMyCases = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            setError("You must be logged in to view your reports.");
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get('/users/me/cases', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCases(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch your reported cases. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyCases();
    }, [fetchMyCases]);

    const handleFeedbackSubmitted = () => {
        setSelectedCaseForFeedback(null);
        alert("Thank you for your feedback!");
        fetchMyCases(); 
    };

    if (loading) return <div className="text-center p-8">Loading your reports...</div>;
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    return (
        // <-- 2. APPLY THE NEW STYLES FROM THE CSS MODULE -->
        <div className={styles.container}>
            {selectedCaseForFeedback && (
                <LeaveFeedbackModal
                    caseData={selectedCaseForFeedback}
                    onClose={() => setSelectedCaseForFeedback(null)}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                />
            )}

            <h1 className={styles.title}>My Reported Cases</h1>
            {cases.length === 0 ? (
                <p className={styles.emptyState}>You have not reported any cases yet.</p>
            ) : (
                <div className={styles.caseList}>
                    {cases.map(caseItem => (
                        <div key={caseItem.id} className={styles.caseItem}>
                            <div className={styles.caseContent}>
                                <img 
                                    src={`http://127.0.0.1:8000/${caseItem.photo_url}`} 
                                    alt="Reported Animal"
                                    className={styles.caseImage}
                                />
                                <div className={styles.caseDetails}>
                                    <p>{caseItem.description.substring(0, 100)}...</p>
                                    <span className={`${styles.status} ${styles[caseItem.status.toLowerCase()]}`}>
                                        {caseItem.status}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <Link to={`/cases/${caseItem.id}`} className={styles.detailsButton}>
                                    View Details
                                </Link>
                                {caseItem.status !== 'Pending' && caseItem.accepted_by_ngo_id && (
                                    <button
                                        onClick={() => setSelectedCaseForFeedback(caseItem)}
                                        className={styles.feedbackButton}
                                    >
                                        Leave Feedback
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReports;

