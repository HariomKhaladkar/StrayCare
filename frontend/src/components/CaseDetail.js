// src/components/CaseDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

import { useParams, Link } from 'react-router-dom';
import LeaveFeedbackModal from './LeaveFeedbackModal';
import styles from './CaseDetail.module.css'; // <-- 1. IMPORT THE MODAL
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Helper Functions ---
const formatDateTime = (isoString) => new Date(isoString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%232a2a40%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20fill%3D%22%23ffffff55%22%3ENo%20Image%20Available%3C%2Ftext%3E%3C%2Fsvg%3E';

// --- Update Modal Component (Restyled with Tailwind) ---
const UpdateModal = ({ caseId, onClose, onUpdateSuccess }) => {
    const [notes, setNotes] = useState('');
    const [photo, setPhoto] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('notes', notes);
        if (photo) {
            formData.append('photo', photo);
        }
        const token = localStorage.getItem('ngo_token');
        try {
            await axios.post(`${API_BASE_URL}/cases/${caseId}/updates`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            onUpdateSuccess();
        } catch (err) {
            setError('Failed to post update. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Post an Update</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        className="form-input"
                        rows="5"
                        placeholder="Enter progress notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        required
                    />
                    <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="form-input" />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary py-2 px-6 rounded-md">Cancel</button>
                        <button type="submit" disabled={isLoading} className="btn-primary py-2 px-6 rounded-md">
                            {isLoading ? "Posting..." : "Post Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Case Detail Component ---
const CaseDetail = () => {
    const { id } = useParams();
    const [caseDetails, setCaseDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    
    // --- 2. ADD STATE FOR FEEDBACK MODAL ---
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const isNgoUser = !!localStorage.getItem('ngo_token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    const fetchCaseDetails = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/cases/${id}`);
            setCaseDetails(response.data);
            setError('');
        } catch (err) {
            setError("Could not find the requested case.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCaseDetails();
    }, [fetchCaseDetails]);

    const handleFeedbackSubmitted = () => {
        setIsFeedbackModalOpen(false);
        alert("Thank you, your feedback has been submitted!");
        fetchCaseDetails(); // Refetch to update UI
    };
    
    const showFeedbackButton = user && caseDetails && user.id === caseDetails.owner_id && caseDetails.status !== 'Pending';

    if (loading) return <div className="text-center p-8">Loading Case Details...</div>;
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
    if (!caseDetails) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* --- 3. RENDER BOTH MODALS --- */}
            {isUpdateModalOpen && (
                <UpdateModal 
                    caseId={caseDetails.id} 
                    onClose={() => setIsUpdateModalOpen(false)} 
                    onUpdateSuccess={() => { setIsUpdateModalOpen(false); fetchCaseDetails(); }}
                />
            )}
            {isFeedbackModalOpen && (
                <LeaveFeedbackModal
                    caseData={caseDetails}
                    onClose={() => setIsFeedbackModalOpen(false)}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                />
            )}

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg grid md:grid-cols-2 gap-8">
                {/* Left Column: Image */}
                <div>
                    <img 
                        src={caseDetails.photo_url ? `${API_BASE_URL}/${caseDetails.photo_url}` : PLACEHOLDER_IMAGE} 
                        alt="Reported Animal" 
                        className="rounded-lg w-full shadow-md" 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMAGE;
                        }}
                    />
                </div>

                {/* Right Column: Details & Timeline */}
                <div>
                    <div className="flex justify-between items-start">
                        <h1 className="text-3xl font-bold text-gray-800">Case #{caseDetails.id}</h1>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full
                            ${caseDetails.status === 'Accepted' ? 'bg-green-200 text-green-800' : 
                             caseDetails.status === 'Rejected' ? 'bg-red-200 text-red-800' :
                             'bg-yellow-200 text-yellow-800'}`}>
                            {caseDetails.status}
                        </span>
                    </div>
                    <p className="mt-4 text-gray-700 text-lg">{caseDetails.description}</p>
                    
                    {caseDetails.latitude && caseDetails.longitude && (
                        <div className="mt-6">
                            <h3 className="text-xl font-semibold mb-2">Location</h3>
                            <div style={{ height: '250px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                <MapContainer 
                                    center={[caseDetails.latitude, caseDetails.longitude]} 
                                    zoom={15} 
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[caseDetails.latitude, caseDetails.longitude]}>
                                        <Popup>Case #{caseDetails.id} Location</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    )}
                    
                    {/* --- 4. ADD THE FEEDBACK BUTTON IN THE CORRECT LOCATION --- */}
                    {showFeedbackButton && (
                         <button 
                            onClick={() => setIsFeedbackModalOpen(true)}
                            className="mt-6 w-full btn bg-accent text-gray-900 hover:bg-yellow-500 focus:ring-yellow-400"
                        >
                            Leave Feedback on this Case
                        </button>
                    )}

                    {isNgoUser && caseDetails.status === 'Accepted' && (
                        <button onClick={() => setIsUpdateModalOpen(true)} className="mt-6 w-full btn btn-primary">
                            + Add Update
                        </button>
                    )}
                    
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Update Timeline</h2>
                        {caseDetails.updates && caseDetails.updates.length > 0 ? (
                            <div className="space-y-6">
                                {caseDetails.updates.slice().reverse().map(update => (
                                    <div key={update.id} className="relative pl-6 border-l-2 border-gray-200">
                                        <div className="absolute -left-2 top-1 w-4 h-4 bg-primary rounded-full"></div>
                                        <p className="font-semibold text-gray-800">{formatDateTime(update.created_at)}</p>
                                        <p className="text-gray-600">{update.notes}</p>
                                        {update.photo_url && <img src={`${API_BASE_URL}/${update.photo_url}`} alt="Update" className="mt-2 rounded-md shadow-sm max-w-xs" onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}/>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No updates have been posted for this case yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseDetail;