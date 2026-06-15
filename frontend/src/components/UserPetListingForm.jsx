// frontend/src/components/UserPetListingForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

import styles from './UserPetListingForm.module.css';

const UserPetListingForm = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: '', species: '', age: '', location: '', description: '',
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) { setError('Please upload a photo of the pet.'); return; }
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => formData.append(k, v));
        formData.append('image', image);

        try {
            await axios.post(`${API_BASE_URL}/users/pets/list`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            onSuccess?.();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit listing. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>🐾 List a Pet for Adoption</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.imageUploadArea}>
                        {preview ? (
                            <img src={preview} alt="Pet preview" className={styles.preview} />
                        ) : (
                            <label htmlFor="pet-image-upload" className={styles.uploadPlaceholder}>
                                <span className={styles.uploadIcon}>📷</span>
                                <span>Click to upload pet photo</span>
                            </label>
                        )}
                        <input
                            id="pet-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.hiddenInput}
                        />
                        {preview && (
                            <label htmlFor="pet-image-upload" className={styles.changePhotoBtn}>
                                Change Photo
                            </label>
                        )}
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label>Pet Name *</label>
                            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g., Tommy" required />
                        </div>
                        <div className={styles.field}>
                            <label>Species *</label>
                            <select name="species" value={form.species} onChange={handleChange} required>
                                <option value="">Select species</option>
                                <option value="Dog">Dog</option>
                                <option value="Cat">Cat</option>
                                <option value="Bird">Bird</option>
                                <option value="Rabbit">Rabbit</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Age *</label>
                            <input name="age" value={form.age} onChange={handleChange} placeholder="e.g., 2 years, 6 months" required />
                        </div>
                        <div className={styles.field}>
                            <label>Location *</label>
                            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g., Pune, Maharashtra" required />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Tell us about this pet's personality, health, and why they need a new home..."
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={isLoading} className={styles.submitBtn}>
                            {isLoading ? 'Submitting...' : '🐾 Submit Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserPetListingForm;
