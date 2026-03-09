// src/components/NGODashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import styles from './NGODashboard.module.css';
import AddPetForm from './AddPetForm'; // <-- 1. IMPORT THE NEW FORM COMPONENT

// --- Update Modal Component (No changes needed here) ---
const UpdateCaseModal = ({ caseData, onClose, onUpdateSuccess }) => {
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
            await axios.post(`/cases/${caseData.id}/updates`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            onUpdateSuccess();
        } catch (err) {
            setError('Failed to post update.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Update Case #{caseData.id}</h2>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add progress notes..."
                        className={styles.modalTextarea}
                        rows="4"
                        required
                    />
                    <input type="file" onChange={(e) => setPhoto(e.target.files[0])} />
                    {error && <p className={styles.error}>{error}</p>}
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" disabled={isLoading} className={styles.submitButton}>
                            {isLoading ? 'Submitting...' : 'Submit Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Case Card Component (No changes needed here) ---
const CaseCard = ({ caseData, onAccept, onReject, onOpenUpdateModal, isActioning }) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    return (
        <div className={`${styles.caseCard} ${styles[caseData.status.toLowerCase()]}`}>
            <img
                src={`${backendUrl}/${caseData.photo_url}`}
                alt="Animal"
                className={styles.cardImage}
                onError={(e) => {
                    e.target.src = "/placeholder.jpg"; // optional fallback
                }}
            />

            <div className={styles.cardContent}>
                <span className={styles.statusBadge}>{caseData.status}</span>
                <p className={styles.cardDescription}>{caseData.description}</p>
            </div>

            <div className={styles.cardActions}>
                {caseData.status === 'Pending' && (
                    <>
                        <button
                            onClick={() => onReject(caseData.id)}
                            className={`${styles.button} ${styles.rejectButton}`}
                            disabled={isActioning}
                        >
                            {isActioning ? '...' : 'Reject'}
                        </button>

                        <button
                            onClick={() => onAccept(caseData.id)}
                            className={`${styles.button} ${styles.acceptButton}`}
                            disabled={isActioning}
                        >
                            {isActioning ? '...' : 'Accept'}
                        </button>
                    </>
                )}

                {caseData.status === 'Accepted' && (
                    <button
                        onClick={() => onOpenUpdateModal(caseData)}
                        className={`${styles.button} ${styles.updateButton}`}
                    >
                        + Add Update
                    </button>
                )}
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---
export default function NGODashboard() {
    const [cases, setCases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCaseForUpdate, setSelectedCaseForUpdate] = useState(null);
    const [actioningCaseId, setActioningCaseId] = useState(null);
    
    // <-- 2. ADD STATE TO CONTROL THE 'ADD PET' MODAL -->
    const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);

    const fetchCases = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('ngo_token');
        if (!token) {
            setError("Authentication token not found.");
            setIsLoading(false);
            return;
        }
        try {
            const response = await axios.get('/ngo/me/cases', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCases(response.data);
        } catch (err) {
            setError("Failed to fetch cases.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    const handleCaseAction = async (caseId, action) => {
        setActioningCaseId(caseId);
        const token = localStorage.getItem('ngo_token');
        try {
            await axios.put(`/case/${caseId}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchCases();
        } catch (err) {
            alert(`Error: Could not ${action} the case. Please try again.`);
        } finally {
            setActioningCaseId(null);
        }
    };

    const handleAccept = (caseId) => handleCaseAction(caseId, 'accept');
    const handleReject = (caseId) => handleCaseAction(caseId, 'reject');
    
    const handleUpdateSuccess = () => {
        setSelectedCaseForUpdate(null);
        fetchCases();
    };

    // <-- 3. ADD A HANDLER FOR WHEN A PET IS SUCCESSFULLY ADDED -->
    const handlePetAdded = () => {
        setIsAddPetModalOpen(false); // Close the modal
        alert("Pet listed for adoption successfully!");
        // We don't need to refetch cases, as this is a separate functionality.
    };

    return (
        <div className={styles.dashboardContainer}>
            {selectedCaseForUpdate && (
                <UpdateCaseModal
                    caseData={selectedCaseForUpdate}
                    onClose={() => setSelectedCaseForUpdate(null)}
                    onUpdateSuccess={handleUpdateSuccess}
                />
            )}

            {/* <-- 4. RENDER THE NEW 'ADD PET' MODAL WHEN STATE IS TRUE --> */}
            {isAddPetModalOpen && (
                <AddPetForm 
                    onClose={() => setIsAddPetModalOpen(false)}
                    onPetAdded={handlePetAdded}
                />
            )}
            
            <div className="flex justify-between items-center mb-6">
                <h1 className={styles.title}>NGO Case Dashboard</h1>
                {/* <-- 5. ADD THE BUTTON TO OPEN THE 'ADD PET' FORM --> */}
                <button 
                    onClick={() => setIsAddPetModalOpen(true)}
                    className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                    + List a Pet for Adoption
                </button>
            </div>
            
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.cardGrid}>
                {isLoading ? (
                    <p>Loading cases...</p>
                ) : cases.length > 0 ? (
                    cases.map(caseData => (
                        <CaseCard
                            key={caseData.id}
                            caseData={caseData}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onOpenUpdateModal={setSelectedCaseForUpdate}
                            isActioning={actioningCaseId === caseData.id}
                        />
                    ))
                ) : (
                    <p>No cases are currently assigned to you.</p>
                )}
            </div>
        </div>
    );
}