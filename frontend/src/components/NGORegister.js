// src/components/NGORegister.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css'; // Reuse the same styles as Login/Register

export default function NGORegister() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [document, setDocument] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!document) {
            setError("Please upload a verification document.");
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('document', document);

        try {
            await axios.post('/ngos/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage("Registration successful! Your request has been sent to the admin for verification.");
            // Optional: redirect after a delay
            setTimeout(() => navigate('/ngo-login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.title}>Register Your NGO</h2>
                    <p className={styles.subtitle}>Join our network to help save lives.</p>
                </div>
                {!message ? (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="name" className={styles.label}>NGO Name</label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>Official Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="document" className={styles.label}>Verification Document (PDF)</label>
                            <input id="document" type="file" onChange={(e) => setDocument(e.target.files[0])} required className={styles.input} accept=".pdf"/>
                        </div>
                        <button type="submit" disabled={isLoading} className={styles.submitButton}>
                            {isLoading ? "Submitting..." : "Submit for Verification"}
                        </button>
                    </form>
                ) : (
                    <p className={styles.successMessage}>{message}</p>
                )}
                {error && <p className={styles.errorMessage}>{error}</p>}
                <p className={styles.footerText}>
                    Already registered? <Link to="/ngo-login" className={styles.link}>Log In</Link>
                </p>
            </div>
        </div>
    );
}