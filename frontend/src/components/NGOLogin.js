// src/components/NGOLogin.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';

export default function NGOLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        try {
            const response = await axios.post('/ngo/token', params);
            localStorage.setItem('ngo_token', response.data.access_token);
            localStorage.setItem('ngo_id', response.data.ngo.id);
            navigate('/ngo-dashboard');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.title}>NGO Portal Login</h2>
                    <p className={styles.subtitle}>Log in to manage rescue cases.</p>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>NGO Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} placeholder="e.g., testngo@example.com"/>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.input} placeholder="e.g., password"/>
                    </div>
                    <button type="submit" disabled={isLoading} className={styles.submitButton}>
                        {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                </form>
                {error && <p className={styles.errorMessage}>{error}</p>}
                <p className={styles.footerText}>
                    New NGO? <Link to="/ngo-register" className={styles.link}>Register for verification</Link>
                </p>
            </div>
        </div>
    );
}