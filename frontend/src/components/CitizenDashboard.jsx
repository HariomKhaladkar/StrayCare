// frontend/src/pages/CitizenDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './CitizenDashboard.module.css';

const CitizenDashboard = () => {
    // Attempt to get the user's name from localStorage for a personalized welcome
    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user ? user.name : 'Citizen';

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Welcome, {userName}!</h1>
            <p className={styles.welcomeMessage}>Thank you for being a part of the StrayCare community. How can we help you today?</p>

            <div className={styles.cardGrid}>
                {/* Card for Viewing Reports */}
                <Link to="/my-reports" className={styles.navCard}>
                    <h2 className={styles.cardTitle}>View My Reported Cases</h2>
                    <p className={styles.cardDescription}>Check the status of cases you've reported and leave feedback on completed ones.</p>
                </Link>

                {/* Card for Reporting a New Case */}
                <Link to="/report-case" className={styles.navCard}>
                    <h2 className={styles.cardTitle}>Report a New Case</h2>
                    <p className={styles.cardDescription}>Found an animal in need? Submit a report to alert nearby NGOs.</p>
                </Link>
            </div>
        </div>
    );
};

export default CitizenDashboard;