import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './Admin.module.css'; // Reusing Admin styles

const AdminDonations = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Admin token not found.");
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get('http://127.0.0.1:8000/admin/transactions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(response.data);
        } catch (err) {
            setError('Failed to fetch transaction history.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    if (loading) return <div className="text-center p-8">Loading Transactions...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Donation History</h1>
            
            <section className={styles.section}>
                <h2>All Transactions ({transactions.length})</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Donor</th>
                                <th>Amount (INR)</th>
                                <th>Status</th>
                                <th>Payment ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.timestamp).toLocaleDateString()}</td>
                                    <td>
                                        {tx.donor_name}
                                        <br/>
                                        <span style={{fontSize: '0.8em', color: '#666'}}>{tx.donor_email}</span>
                                    </td>
                                    <td style={{fontWeight: 'bold', color: '#059669'}}>
                                        ₹{tx.amount}
                                    </td>
                                    <td>
                                        <span className={tx.status === 'Success' ? styles.verified : styles.pending}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td style={{fontFamily: 'monospace'}}>{tx.payment_id || '-'}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No donations recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminDonations;