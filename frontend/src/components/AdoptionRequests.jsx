// frontend/src/components/AdoptionRequests.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- (RequestDetailModal component remains the same) ---
const RequestDetailModal = ({ request, onClose }) => {
    if (!request) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Adoption Request Details</h2>
                <div className="space-y-3 text-gray-700">
                    <p><strong>Pet:</strong> {request.pet_name}</p>
                    <p><strong>Applicant Name:</strong> {request.adopter_name}</p>
                    <p><strong>Applicant Email:</strong> {request.adopter_email}</p>
                    <p><strong>Applicant Phone:</strong> {request.adopter_phone}</p>
                    <p><strong>Address:</strong> {request.adopter_address}</p>
                    <p><strong>Prior Experience:</strong> {request.experience}</p>
                    <p><strong>Reason for Adopting:</strong> {request.reason}</p>
                </div>
                <div className="mt-6 text-right">
                    <button 
                        onClick={onClose} 
                        className="bg-primary text-white py-2 px-6 rounded-md hover:bg-secondary transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---
const AdoptionRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    
    // --- NEW: State to track which request is being actioned ---
    const [actioningId, setActioningId] = useState(null);

    const fetchAdoptionRequests = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('ngo_token');
        if (!token) {
            setError("Authentication failed. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('http://127.0.0.1:8000/ngo/me/adoption-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch adoption requests.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdoptionRequests();
    }, [fetchAdoptionRequests]);

    // --- NEW: Handler to update the status ---
    const handleStatusUpdate = async (requestId, newStatus) => {
        setActioningId(requestId);
        const token = localStorage.getItem('ngo_token');
        try {
            await axios.put(
                `http://127.0.0.1:8000/ngo/adoption-requests/${requestId}/status`,
                { status: newStatus }, // Send status in the request body
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Refresh the list to show the updated status
            fetchAdoptionRequests();
        } catch (err) {
            console.error("Failed to update status:", err);
            alert(`Could not update the status. Please try again.`);
        } finally {
            setActioningId(null);
        }
    };

    if (loading) return <p className="text-center p-8">Loading requests...</p>;
    if (error) return <p className="text-center text-red-500 p-8">{error}</p>;

    return (
        <div className="container mx-auto px-4 py-8">
            {selectedRequest && (
                <RequestDetailModal 
                    request={selectedRequest} 
                    onClose={() => setSelectedRequest(null)} 
                />
            )}

            <h1 className="text-3xl font-bold mb-6">Incoming Adoption Requests</h1>
            {requests.length === 0 ? (
                <p>You have no pending adoption requests at the moment.</p>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            {/* ... table headers ... */}
                        </thead>
                        <tbody className="text-gray-700">
                            {requests.map(req => (
                                <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-4 px-5">{req.pet_name}</td>
                                    <td className="py-4 px-5">{req.adopter_name}</td>
                                    <td className="py-4 px-5">{req.adopter_email}</td>
                                    <td className="py-4 px-5">
                                        <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full
                                            ${req.status === 'Approved' ? 'bg-green-200 text-green-900' :
                                             req.status === 'Rejected' ? 'bg-red-200 text-red-900' :
                                             'bg-yellow-200 text-yellow-900'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5 space-x-2">
                                        <button 
                                            onClick={() => setSelectedRequest(req)}
                                            className="bg-blue-500 text-white text-sm py-1 px-3 rounded hover:bg-blue-600"
                                            disabled={actioningId === req.id}
                                        >
                                            Details
                                        </button>
                                        {/* --- NEW: Show Approve/Reject buttons only for Pending requests --- */}
                                        {req.status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                                                    className="bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600"
                                                    disabled={actioningId === req.id}
                                                >
                                                    {actioningId === req.id ? '...' : 'Reject'}
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'Approved')}
                                                    className="bg-green-500 text-white text-sm py-1 px-3 rounded hover:bg-green-600"
                                                    disabled={actioningId === req.id}
                                                >
                                                    {actioningId === req.id ? '...' : 'Approve'}
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdoptionRequests;