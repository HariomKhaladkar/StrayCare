import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './Admin.module.css';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [pendingNgos, setPendingNgos] = useState([]);
    const [allNgos, setAllNgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Admin token not found. Please log in.");
            setLoading(false);
            return;
        }
        try {
            const [pendingRes, allRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/admin/ngos/pending', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/admin/ngos', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setPendingNgos(pendingRes.data);
            setAllNgos(allRes.data);
        } catch (err) {
            setError('Failed to fetch data. You may not have admin privileges.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleVerify = async (ngoId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://127.0.0.1:8000/admin/ngos/${ngoId}/verify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert('Failed to verify NGO.');
        }
    };
    
    const handleDeregister = async (ngoId) => {
        const reason = prompt("Please provide a reason for de-registering this NGO:");
        if (reason && reason.trim() !== "") {
            const token = localStorage.getItem('token');
            try {
                await axios.delete(`http://127.0.0.1:8000/admin/ngos/${ngoId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { reason: reason }
                });
                fetchData();
            } catch (err) {
                alert('Failed to de-register NGO.');
            }
        }
    };

    if (loading) return <div className="text-center p-8">Loading Admin Dashboard...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Admin Dashboard</h1>

            {/* --- NAVIGATION CARDS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* NGO Management Card */}
                <div className={styles.section} style={{ marginBottom: 0 }}>
                    <h2 className="text-2xl font-semibold mb-2">NGO Management</h2>
                    <p style={{ color: '#4b5563', marginBottom: '1rem' }}>Review, approve, and manage NGO partners.</p>
                </div>
                
                {/* Feedback Oversight Card */}
                <div className={styles.section} style={{ marginBottom: 0 }}>
                    <h2 className="text-2xl font-semibold mb-2">Feedback Oversight</h2>
                    <p style={{ color: '#4b5563', marginBottom: '1rem' }}>Monitor NGO performance and user reviews.</p>
                    <Link 
                        to="/admin/feedback"
                        className={styles.verifyButton}
                        style={{ display: 'inline-block', textAlign: 'center', marginTop: '1rem' }}
                    >
                        View Feedback
                    </Link>
                </div>

                {/* Donation Management Card (NEW) */}
                <div className={styles.section} style={{ marginBottom: 0 }}>
                    <h2 className="text-2xl font-semibold mb-2">Donation Records</h2>
                    <p style={{ color: '#4b5563', marginBottom: '1rem' }}>Track financial contributions and history.</p>
                    <Link 
                        to="/admin/donations"
                        className={styles.verifyButton}
                        style={{ display: 'inline-block', textAlign: 'center', backgroundColor: '#3b82f6', marginTop: '1rem' }}
                    >
                        View Transactions
                    </Link>
                </div>
            </div>

            {/* --- PENDING VERIFICATIONS SECTION --- */}
            <section className={styles.section}>
                <h2>Pending NGO Verifications ({pendingNgos.length})</h2>
                {pendingNgos.length > 0 ? (
                    <ul className={styles.list}>
                        {pendingNgos.map(ngo => (
                            <li key={ngo.id} className={styles.listItem}>
                                <div>
                                    <strong>{ngo.name}</strong>
                                    <p>{ngo.email}</p>
                                </div>
                                <div className={styles.actions}>
                                    <a href={`http://127.0.0.1:8000/${ngo.verification_document_url}`} target="_blank" rel="noopener noreferrer" className={styles.docButton}>
                                        View Document
                                    </a>
                                    <button onClick={() => handleVerify(ngo.id)} className={styles.verifyButton}>Verify</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No NGOs are currently waiting for verification.</p>
                )}
            </section>
            
            {/* --- REGISTERED NGOS TABLE --- */}
            <section className={styles.section}>
                <h2>Registered NGOs ({allNgos.length})</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allNgos.map(ngo => (
                            <tr key={ngo.id}>
                                <td>{ngo.name}</td>
                                <td>{ngo.email}</td>
                                <td>
                                    <span className={ngo.is_verified ? styles.verified : styles.pending}>
                                        {ngo.is_verified ? 'Verified' : 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => handleDeregister(ngo.id)} className={styles.deregisterButton}>
                                        De-register
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default AdminDashboard;