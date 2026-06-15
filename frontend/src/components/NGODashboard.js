// src/components/NGODashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './NGODashboard.module.css';
import AddPetForm from './AddPetForm';
import API_BASE_URL from '../api';
import { usePlatform } from '../hooks/usePlatform';

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
                <h2>📝 Update Case #{caseData.id}</h2>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add progress notes here..."
                        className={styles.modalTextarea}
                        rows="4"
                        required
                    />
                    <input
                        type="file"
                        onChange={(e) => setPhoto(e.target.files[0])}
                        style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.5rem' }}
                    />
                    {error && <p className={styles.error}>{error}</p>}
                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" disabled={isLoading} className={styles.submitButton}>
                            {isLoading ? 'Submitting…' : '✅ Submit Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Case Card Component ---
const SEVERITY_CONFIG = {
    Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.5)', emoji: '🔴', label: 'CRITICAL' },
    High:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.5)', emoji: '🟠', label: 'HIGH' },
    Moderate: { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.5)',  emoji: '🟡', label: 'MODERATE' },
    Low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)',  emoji: '🟢', label: 'LOW' },
};

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%232a2a40%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20fill%3D%22%23ffffff55%22%3ENo%20Image%20Available%3C%2Ftext%3E%3C%2Fsvg%3E';

const CaseCard = ({ caseData, onAccept, onReject, onOpenUpdateModal, isActioning }) => {
    const backendUrl = API_BASE_URL;
    const sev = SEVERITY_CONFIG[caseData.severity_label] || SEVERITY_CONFIG.Low;

    return (
        <div className={`${styles.caseCard} ${styles[caseData.status.toLowerCase()]}`}
            style={{ borderLeft: `4px solid ${sev.color}` }}
        >
            {/* Severity Badge */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.4rem 0.75rem',
                background: sev.bg,
                borderBottom: `1px solid ${sev.border}`,
            }}>
                <span style={{
                    color: sev.color, fontWeight: 800, fontSize: '0.72rem',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    {sev.emoji} {sev.label} PRIORITY
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>
                    Score: {caseData.severity_score || 0}
                </span>
            </div>

            <img
                src={caseData.photo_url ? `${backendUrl}/${caseData.photo_url}` : PLACEHOLDER_IMAGE}
                alt="Animal"
                className={styles.cardImage}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
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
                
                <Link 
                    to={`/cases/${caseData.id}`} 
                    className={`${styles.button}`} 
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', textDecoration: 'none', textAlign: 'center', marginTop: '0.5rem', display: 'block' }}
                >
                    View Details & Map
                </Link>
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
    const { isMobile } = usePlatform();

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

    const pendingCount = cases.filter(c => c.status === 'Pending').length;
    const acceptedCount = cases.filter(c => c.status === 'Accepted').length;
    const rejectedCount = cases.filter(c => c.status === 'Rejected').length;

    return (
        <div className={styles.dashboardContainer}>
            {selectedCaseForUpdate && (
                <UpdateCaseModal
                    caseData={selectedCaseForUpdate}
                    onClose={() => setSelectedCaseForUpdate(null)}
                    onUpdateSuccess={handleUpdateSuccess}
                />
            )}
            {isAddPetModalOpen && (
                <AddPetForm
                    onClose={() => setIsAddPetModalOpen(false)}
                    onPetAdded={handlePetAdded}
                />
            )}

            {/* Header */}
            <div className={styles.headerRow}>
                <h1 className={styles.title}>🏥 NGO Case Dashboard</h1>
                <button
                    onClick={() => setIsAddPetModalOpen(true)}
                    className={styles.addPetButton}
                >
                    🐾 List a Pet for Adoption
                </button>
            </div>

            {/* Sub-Navigation Links — hidden on Android (bottom nav covers all these routes) */}
            {!isMobile && (
              <div className={styles.subNavigation}>
                <Link to="/ngo-requests"     className={styles.subNavLink}>Pending Requests</Link>
                <Link to="/ngo-adopted-pets" className={styles.subNavLink}>Adopted Pets</Link>
                <Link to="/ngo-pet-listings" className={styles.subNavLink}>Pet Submissions</Link>
                <Link to="/ngo-feedback"     className={styles.subNavLink}>My Feedback</Link>
                <Link to="/ngo-analytics"    className={styles.subNavLink}>Analytics</Link>
              </div>
            )}

            {/* Stats bar */}
            {!isLoading && cases.length > 0 && (
                <div className={styles.statsBar}>
                    <div className={styles.statBubble}>
                        <div className={styles.statNum}>{cases.length}</div>
                        <div className={styles.statLabel}>Total Cases</div>
                    </div>
                    <div className={styles.statBubble}>
                        <div className={styles.statNum}>{pendingCount}</div>
                        <div className={styles.statLabel}>Pending</div>
                    </div>
                    <div className={styles.statBubble}>
                        <div className={styles.statNum}>{acceptedCount}</div>
                        <div className={styles.statLabel}>Accepted</div>
                    </div>
                    <div className={styles.statBubble}>
                        <div className={styles.statNum}>{rejectedCount}</div>
                        <div className={styles.statLabel}>Rejected</div>
                    </div>
                </div>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.cardGrid}>
                {isLoading ? (
                    <p className={styles.loading}>Loading cases…</p>
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
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📂</span>
                        No cases are currently assigned to your NGO.
                    </div>
                )}
            </div>
        </div>
    );
}