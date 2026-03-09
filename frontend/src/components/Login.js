// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';

export default function Login() {
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
            const response = await axios.post('/token', params);
            
            // 1. Store token AND user data in localStorage
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // 2. Conditionally navigate based on admin status
            if (response.data.user.is_admin) {
                navigate('/admin/dashboard');
            } else {
                navigate('/my-reports');
            }

            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.title}>Citizen & Admin Login</h2>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.input} />
                    </div>
                    <button type="submit" disabled={isLoading} className={styles.submitButton}>
                        {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                </form>
                {error && <p className={styles.errorMessage}>{error}</p>}
                <p className={styles.footerText}>
                    Don't have an account? <Link to="/register" className={styles.link}>Register</Link>
                </p>
            </div>
        </div>
    );
}