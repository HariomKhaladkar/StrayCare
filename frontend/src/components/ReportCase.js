// src/components/ReportCase.js
import React, { useState } from 'react';
import axios from 'axios';
import styles from './ReportCase.module.css';

export default function ReportCase() {
    const [description, setDescription] = useState("");
    const [photo, setPhoto] = useState(null);
    
    // --- NEW: State for location data and status ---
    const [location, setLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // --- NEW: Function to get location from the browser ---
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setIsLocating(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setIsLocating(false);
            },
            () => {
                setError("Unable to retrieve location. Please enable location permissions for this site in your browser settings.");
                setIsLocating(false);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (!token) {
            setError("You must be logged in to report a case.");
            return;
        }
        // --- NEW: Check if location has been captured ---
        if (!photo || !description || !location) {
            setError("Please provide a photo, description, and location.");
            return;
        }

        setIsLoading(true);
        setMessage("");
        setError("");

        const formData = new FormData();
        formData.append("description", description);
        formData.append("photo", photo);
        // --- NEW: Append the captured coordinates ---
        formData.append("latitude", location.lat);
        formData.append("longitude", location.lng);

        try {
            await axios.post("/report", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setMessage("✅ Case reported successfully! Thank you for your help.");
            // Reset form
            setDescription("");
            setPhoto(null);
            setLocation(null);
            e.target.reset();
        } catch (err) {
            setError("❌ Failed to report case. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className={styles.card}>
            <h2 className={styles.title}>Report an Animal in Need</h2>
            <p className={styles.subtitle}>Your report will be sent to verified local NGOs.</p>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.label}>Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className={styles.textarea} rows={4} placeholder="Describe the animal's condition and situation..."/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="photo" className={styles.label}>Photo</label>
                    <input id="photo" type="file" onChange={(e) => setPhoto(e.target.files[0])} required className={styles.input} accept="image/*" />
                </div>
                
                {/* --- NEW: Location Button and Display --- */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Location</label>
                    <button type="button" onClick={handleGetLocation} disabled={isLocating} className={styles.locationButton}>
                        {isLocating ? 'Fetching Location...' : '📍 Get Current Location'}
                    </button>
                    {location && (
                        <p className={styles.locationSuccess}>
                            Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                    )}
                </div>

                <button type="submit" disabled={isLoading} className={styles.submitButton}>
                    {isLoading ? 'Submitting...' : 'Send Alert'}
                </button>
            </form>
            {message && <p className={styles.successMessage}>{message}</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
    );
}