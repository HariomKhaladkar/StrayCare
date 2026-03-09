// frontend/src/components/AdoptedPetsList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdoptedPetCard = ({ pet }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex">
        <img 
            src={pet.image_url.startsWith('http') ? pet.image_url : `http://127.0.0.1:8000/${pet.image_url}`} 
            alt={pet.name}
            className="w-32 h-32 object-cover"
        />
        <div className="p-4">
            <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
            <p className="text-gray-600">{pet.breed}</p>
            <span className="mt-2 inline-block bg-green-200 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Adopted
            </span>
        </div>
    </div>
);

const AdoptedPetsList = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAdoptedPets = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('ngo_token');
        try {
            const response = await axios.get('http://127.0.0.1:8000/ngo/me/adopted-pets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPets(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch the list of adopted pets.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdoptedPets();
    }, [fetchAdoptedPets]);

    if (loading) return <p className="text-center p-8">Loading adopted pets...</p>;
    if (error) return <p className="text-center text-red-500 p-8">{error}</p>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Successfully Adopted Pets</h1>
            {pets.length === 0 ? (
                <p>You haven't marked any pets as adopted yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pets.map(pet => (
                        <AdoptedPetCard key={pet.id} pet={pet} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdoptedPetsList;