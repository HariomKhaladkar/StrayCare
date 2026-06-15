// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import styles from './Auth.module.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await axios.post('/users/register', { name, email, password });
            navigate('/login'); // Redirect to login after successful registration
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('/auth/google', {
                credential: credentialResponse.credential
            });
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (response.data.user.is_admin) {
                navigate('/admin/dashboard');
            } else {
                navigate('/my-reports');
            }
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.detail || 'Google Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.title}>Create a Citizen Account</h2>
                    <p className={styles.subtitle}>Join our community to help animals in need.</p>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>Full Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.input} />
                    </div>
                    <button type="submit" disabled={isLoading} className={styles.submitButton}>
                        {isLoading ? "Registering..." : "Register"}
                    </button>
                </form>
                <div className={styles.divider}>
                    <span>or</span>
                </div>
                <div className={styles.googleContainer}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign In failed')}
                        theme="filled_black"
                    />
                </div>
                {error && <p className={styles.errorMessage}>{error}</p>}
                <p className={styles.footerText}>
                    Already have an account? <Link to="/login" className={styles.link}>Log In</Link>
                </p>
            </div>
        </div>
    );
}