// src/components/ReportCase.js
import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
import AnimalRecognitionBadge from './AnimalRecognitionBadge';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

import styles from './ReportCase.module.css';

// Fix default Leaflet icon broken in webpack/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom red pulsing icon for selected location
const selectedIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Sub-component: listens for map clicks and updates marker
function LocationSelector({ onLocationChange }) {
    useMapEvents({
        click(e) {
            onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

// Sub-component: flies map to a given centre when location changes
function MapFlyTo({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lng], 15, { animate: true, duration: 1.2 });
        }
    }, [center, map]);
    return null;
}

// ─── Map Picker ─────────────────────────────────────────────────────────────
function MapPicker({ location, onLocationChange }) {
    const defaultCenter = location
        ? [location.lat, location.lng]
        : [20.5937, 78.9629]; // India center fallback

    return (
        <div className={styles.mapWrapper}>
            <MapContainer
                center={defaultCenter}
                zoom={location ? 15 : 5}
                className={styles.mapContainer}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationSelector onLocationChange={onLocationChange} />
                {location && (
                    <>
                        <MapFlyTo center={location} />
                        <Marker
                            position={[location.lat, location.lng]}
                            icon={selectedIcon}
                            draggable={true}
                            eventHandlers={{
                                dragend(e) {
                                    const ll = e.target.getLatLng();
                                    onLocationChange({ lat: ll.lat, lng: ll.lng });
                                },
                            }}
                        />
                    </>
                )}
            </MapContainer>
            <p className={styles.mapHint}>
                {location
                    ? '📌 Drag the marker or click anywhere to adjust the pin'
                    : '👆 Click on the map to place a pin, or use the button above'}
            </p>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReportCase() {
    const [description, setDescription]   = useState('');
    const [photo, setPhoto]               = useState(null);
    const [detectedAnimal, setDetectedAnimal] = useState(null);

    const [location, setLocation]         = useState(null);
    const [isLocating, setIsLocating]     = useState(false);
    const [showMap, setShowMap]           = useState(false);

    const [message, setMessage]           = useState('');
    const [error, setError]               = useState('');
    const [isLoading, setIsLoading]       = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setIsLocating(true);
        setError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                setLocation(loc);
                setShowMap(true);
                setIsLocating(false);
            },
            () => {
                setError('Unable to retrieve location. Please enable location permissions.');
                setShowMap(true); // still show map so user can pick manually
                setIsLocating(false);
            }
        );
    };

    const handleAnimalDetected = useCallback((result) => {
        setDetectedAnimal(result);
        setDescription(prev => {
            if (!prev.trim()) return `${result.species} in need of help. `;
            return prev;
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token)            { setError('You must be logged in to report a case.'); return; }
        if (!photo || !description || !location) {
            setError('Please provide a photo, description, and location.');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setError('');

        const formData = new FormData();
        formData.append('description', description);
        formData.append('photo',       photo);
        formData.append('latitude',    location.lat);
        formData.append('longitude',   location.lng);

        try {
            await axios.post(`${API_BASE_URL}/report`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setMessage('✅ Case reported successfully! Thank you for your help.');
            setDescription('');
            setPhoto(null);
            setLocation(null);
            setDetectedAnimal(null);
            setShowMap(false);
            e.target.reset();
        } catch (err) {
            setError('❌ Failed to report case. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.title}>Report an Animal in Need</h2>
            <p className={styles.subtitle}>Your report will be sent to verified local NGOs.</p>

            <form onSubmit={handleSubmit} className={styles.form}>

                {/* AI-Powered Photo Upload */}
                <div className={styles.formGroup}>
                    <AnimalRecognitionBadge
                        id="report-photo"
                        label="Photo of Animal"
                        required
                        onFileChange={(file) => setPhoto(file)}
                        onAnimalDetected={handleAnimalDetected}
                    />
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.label}>
                        Description
                        {detectedAnimal && (
                            <span style={{
                                marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 700,
                                background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                                border: '1px solid rgba(99,102,241,0.3)',
                                borderRadius: '99px', padding: '0.1rem 0.5rem',
                            }}>
                                {detectedAnimal.emoji} AI: {detectedAnimal.label} detected
                            </span>
                        )}
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className={styles.textarea}
                        rows={4}
                        placeholder="Describe the animal's condition and situation..."
                    />
                </div>

                {/* Location Section */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>📍 Location</label>

                    <div className={styles.locationControls}>
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isLocating}
                            className={styles.locationButton}
                        >
                            {isLocating ? (
                                <span className={styles.locatingSpinner}>⏳ Detecting GPS…</span>
                            ) : (
                                '🎯 Use My GPS Location'
                            )}
                        </button>

                        {!showMap && (
                            <button
                                type="button"
                                onClick={() => setShowMap(true)}
                                className={styles.manualPickButton}
                            >
                                🗺️ Pick on Map
                            </button>
                        )}
                    </div>

                    {/* Interactive Map */}
                    {showMap && (
                        <MapPicker
                            location={location}
                            onLocationChange={setLocation}
                        />
                    )}

                    {/* Coordinates display */}
                    {location && (
                        <div className={styles.locationSuccess}>
                            <span className={styles.locationPinIcon}>📌</span>
                            <span>
                                <strong>Lat:</strong> {location.lat.toFixed(6)}&nbsp;&nbsp;
                                <strong>Lng:</strong> {location.lng.toFixed(6)}
                            </span>
                        </div>
                    )}
                </div>

                <button type="submit" disabled={isLoading} className={styles.submitButton}>
                    {isLoading ? 'Submitting…' : '🚨 Send Alert'}
                </button>
            </form>

            {message && <p className={styles.successMessage}>{message}</p>}
            {error   && <p className={styles.errorMessage}>{error}</p>}
        </div>
    );
}