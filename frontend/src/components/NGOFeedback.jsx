// frontend/src/components/NGOFeedback.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './NGODashboard.module.css';

const StarDisplay = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="flex items-center">
            {[...Array(fullStars)].map((_, i) => <svg key={`full-${i}`} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.445a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" /></svg>)}
            {/* Note: This component doesn't render half-stars for simplicity, but could be extended */}
            {[...Array(emptyStars)].map((_, i) => <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.445a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" /></svg>)}
        </div>
    );
};

const NGOFeedback = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchFeedback = useCallback(async () => {
        // This assumes the NGO's ID is stored in localStorage after login.
        // We need to add this to the NGOLogin component.
        const ngoId = localStorage.getItem('ngo_id'); 
        if (!ngoId) {
            setError("Could not identify the NGO. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`/feedback/summary/${ngoId}`);
            setSummary(response.data);
        } catch (err) {
            setError("Failed to fetch feedback data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    if (loading) return <p className="text-center p-8">Loading Feedback...</p>;
    if (error) return <p className="text-center text-red-500 p-8">{error}</p>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Your Feedback</h1>
            
            {/* Summary Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold">Performance Summary</h2>
                {summary && summary.average_rating ? (
                    <div className="flex items-center space-x-4 mt-4">
                        <StarDisplay rating={summary.average_rating} />
                        <span className="text-xl font-bold text-gray-700">{summary.average_rating}</span>
                        <span className="text-gray-500">out of 5</span>
                        <span className="text-gray-500">({summary.total_reviews} reviews)</span>
                    </div>
                ) : (
                    <p className="mt-4 text-gray-600">No reviews have been submitted yet.</p>
                )}
            </div>

            {/* Individual Reviews */}
            <h2 className="text-2xl font-semibold mb-4">All Reviews</h2>
            <div className="space-y-4">
                {summary && summary.reviews.length > 0 ? (
                    summary.reviews.map(review => (
                        <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border">
                            <StarDisplay rating={review.rating} />
                            <p className="mt-2 text-gray-700">{review.comment || <i>No comment provided.</i>}</p>
                            <p className="text-xs text-gray-400 mt-2">Case ID: {review.case_id}</p>
                        </div>
                    ))
                ) : (
                    <p>No comments to display.</p>
                )}
            </div>
        </div>
    );
};

export default NGOFeedback;