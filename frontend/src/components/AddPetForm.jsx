// frontend/src/components/AddPetForm.jsx
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import styles from './NGODashboard.module.css';
import API_BASE_URL from '../api';
import AnimalRecognitionBadge from './AnimalRecognitionBadge';


const AddPetForm = ({ onClose, onPetAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        gender: 'Male',
        size: 'Medium',
        location: '',
        is_vaccinated: false,
    });
    const [image, setImage] = useState(null);
    const [video, setVideo] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [detectedAnimal, setDetectedAnimal] = useState(null);

    // Called by AI recognizer — auto-selects species dropdown
    const handleAnimalDetected = useCallback((result) => {
        setDetectedAnimal(result);
        const speciesMap = { Dog: 'Dog', Cat: 'Cat' };
        const mapped = speciesMap[result.species] || 'Other';
        setFormData(prev => ({ ...prev, species: mapped }));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideo(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            setError('A photo of the pet is required.');
            return;
        }

        setIsLoading(true);
        setError('');

        const submissionData = new FormData();
        Object.keys(formData).forEach(key => {
            submissionData.append(key, formData[key]);
        });
        submissionData.append('image', image);
        if (video) {
            submissionData.append('video', video);
        }

        const token = localStorage.getItem('ngo_token');

        try {
            await axios.post(`${API_BASE_URL}/ngo/pets`, submissionData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            onPetAdded();
            onClose();
        } catch (err) {
            setError('Failed to list pet. Please check the details and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.7rem 1rem',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '0.6rem',
        color: '#f1f5f9',
        fontSize: '0.92rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    };
    const labelStyle = {
        fontSize: '0.78rem',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: '0.3rem',
        display: 'block',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '520px', width: '100%', maxHeight: '92dvh', overflowY: 'auto' }}>
                <h2 style={{ fontSize: '1.15rem' }}>🐾 List a Pet for Adoption</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Basic Info - single column on mobile */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Pet Name *</label>
                                <input name="name" onChange={handleChange} placeholder="e.g., Tommy" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Species *</label>
                                <select name="species" value={formData.species} onChange={handleChange} style={inputStyle}>
                                    <option value="Dog">Dog</option>
                                    <option value="Cat">Cat</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Age *</label>
                                <input name="age" onChange={handleChange} placeholder="e.g., 2 years, 6 months" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Gender *</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Breed *</label>
                                <input name="breed" onChange={handleChange} placeholder="e.g., Mix breed" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Size *</label>
                                <select name="size" value={formData.size} onChange={handleChange} style={inputStyle}>
                                    <option value="Small">Small</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Large">Large</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Location *</label>
                        <input name="location" onChange={handleChange} placeholder="e.g. Wakad, Pune" style={inputStyle} required />
                    </div>

                    <label style={{ ...labelStyle, textTransform: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="is_vaccinated"
                            checked={formData.is_vaccinated}
                            onChange={handleChange}
                            style={{ width: 16, height: 16 }}
                        />
                        Pet is vaccinated
                    </label>

                    {/* Photo Upload — with AI recognition */}
                    <div>
                        <AnimalRecognitionBadge
                            id="pet-photo-input"
                            label="Pet Photo (jpg, png)"
                            required
                            onFileChange={(file) => setImage(file)}
                            onAnimalDetected={handleAnimalDetected}
                        />
                        {detectedAnimal && (
                            <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#a5b4fc' }}>
                                ✨ Species auto-set to <strong>{formData.species}</strong> from AI detection
                            </p>
                        )}
                    </div>

                    {/* Video Upload */}
                    <div>
                        <label style={labelStyle}>Pet Video (optional — mp4, mov)</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}
                        />
                        {videoPreview && (
                            <video
                                src={videoPreview}
                                controls
                                style={{ width: '100%', marginTop: '0.6rem', borderRadius: '0.5rem', maxHeight: '180px' }}
                            />
                        )}
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" disabled={isLoading} className={styles.submitButton}>
                            {isLoading ? 'Listing…' : '🐾 List Pet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPetForm;