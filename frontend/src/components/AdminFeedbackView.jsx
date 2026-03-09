// frontend/src/components/AdminFeedbackView.jsx
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const StarDisplay = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.445a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
            </svg>
        ))}
    </div>
);

const AdminFeedbackView = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAllFeedback = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token'); // Admin uses the standard user token
        try {
            const response = await axios.get('http://127.0.0.1:8000/admin/feedback', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbackList(response.data);
        } catch (err) {
            setError('You do not have permission to view this page, or an error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllFeedback();
    }, [fetchAllFeedback]);

    if (loading) return <p className="text-center p-8">Loading all feedback...</p>;
    if (error) return <p className="text-center text-red-500 p-8">{error}</p>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Feedback Oversight</h1>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                            <th className="py-3 px-5 text-left">Rating</th>
                            <th className="py-3 px-5 text-left">Comment</th>
                            <th className="py-3 px-5 text-left">Case ID</th>
                            <th className="py-3 px-5 text-left">NGO ID</th>
                            <th className="py-3 px-5 text-left">User ID</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {feedbackList.map(fb => (
                            <tr key={fb.id} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="py-4 px-5"><StarDisplay rating={fb.rating} /></td>
                                <td className="py-4 px-5">{fb.comment || <span className="text-gray-400">N/A</span>}</td>
                                <td className="py-4 px-5">
                                    <Link to={`/cases/${fb.case_id}`} className="text-blue-500 hover:underline">{fb.case_id}</Link>
                                </td>
                                <td className="py-4 px-5">{fb.ngo_id}</td>
                                <td className="py-4 px-5">{fb.user_id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminFeedbackView;