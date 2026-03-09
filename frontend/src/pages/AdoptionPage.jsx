// frontend/src/pages/AdoptionPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

// --- PetCard Component with the FIX ---
const PetCard = ({ pet, onAdoptClick }) => {
    // **FIX #1:** The check must be for 'image_url', not 'photo_url'.
    if (!pet || !pet.image_url) {
        return null; // This was incorrectly filtering out your newly listed pet.
    }

    // **FIX #2:** Check if the URL is external (starts with http) or local.
    const imageUrl = pet.image_url.startsWith('http')
        ? pet.image_url
        : `/${pet.image_url}`;

    return (
        <div className="group border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="overflow-hidden">
                <img 
                    src={imageUrl} // Use the corrected image URL
                    alt={pet.name} 
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
                />
            </div>
            <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
                <p className="text-gray-600 capitalize">{pet.breed} • {pet.age}</p>
                <button
                    onClick={() => onAdoptClick(pet)}
                    className="mt-4 w-full bg-primary text-white font-semibold py-2 rounded-md hover:bg-secondary transition-colors"
                >
                    Adopt Me
                </button>
            </div>
        </div>
    );
};


// --- (The rest of your file remains the same, but is included for completeness) ---

const PetGrid = ({ pets, onAdoptClick }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pets.length > 0 ? (
            pets.map(pet => <PetCard key={pet.id} pet={pet} onAdoptClick={onAdoptClick} />)
        ) : (
            <p>No pets match the current filters.</p>
        )}
    </div>
);

const FilterDashboard = ({ filters, onFilterChange, resultCount }) => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-wrap gap-4 items-center">
        <h2 className="text-lg font-semibold mr-4">Find a Friend</h2>
        <select name="species" value={filters.species} onChange={onFilterChange} className="border p-2 rounded">
            <option value="all">All Species</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
        </select>
        <div className="ml-auto text-gray-600">{resultCount} pets found</div>
    </div>
);

const AdoptionModal = ({ pet, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ 
        name: '', email: '', phone: '', address: '', experience: '', reason: '' 
    });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };
    
    if (!pet) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Adoption Application for {pet.name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className="form-input" required />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your Email Address" className="form-input" required />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Your Phone Number" className="form-input" required />
                    <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Your Address" className="form-input" rows="2" required />
                    <textarea name="experience" value={formData.experience} onChange={handleChange} placeholder="Do you have prior experience with pets?" className="form-input" rows="2" required />
                    <textarea name="reason" value={formData.reason} onChange={handleChange} placeholder="Why do you want to adopt this pet?" className="form-input" rows="2" required />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-6 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="py-2 px-6 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600">Submit Application</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdoptionPage = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ species: 'all', size: 'all', gender: 'all', location: '' });
    const [selectedPet, setSelectedPet] = useState(null);
    const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
    const [showAdoptionConfirmation, setShowAdoptionConfirmation] = useState(false);
    
    useEffect(() => {
        const fetchPets = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/pets');
                setPets(response.data);
            } catch (error) {
                console.error("Failed to fetch pets:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPets();
    }, []);

    const handleAdoptionFormSubmit = async (formData) => {
        const requestData = {
            pet_id: selectedPet.id,
            adopter_name: formData.name,
            adopter_email: formData.email,
            adopter_phone: formData.phone,
            adopter_address: formData.address,
            experience: formData.experience,
            reason: formData.reason,
        };
        
        try {
            await axios.post('/adoption-requests', requestData);
            handleCloseAdoptionModal();
            setShowAdoptionConfirmation(true);
            setTimeout(() => setShowAdoptionConfirmation(false), 5000);
        } catch (error) {
            console.error("Failed to submit adoption request:", error);
            const errorDetail = error.response?.data?.detail[0]?.msg || "An unexpected error occurred.";
            alert(`Submission Failed: ${errorDetail}`);
        }
    };

    const handleFilterChange = (e) => setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
    const handleAdoptClick = (pet) => { setSelectedPet(pet); setIsAdoptionModalOpen(true); };
    const handleCloseAdoptionModal = () => setIsAdoptionModalOpen(false);

    const filteredPets = useMemo(() => {
        return pets.filter(pet => 
            (filters.species === 'all' || (pet.species && pet.species.toLowerCase() === filters.species))
        );
    }, [pets, filters]);

    if (loading) return <div className="text-center p-20 text-xl font-semibold">Loading our furry friends...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <FilterDashboard filters={filters} onFilterChange={handleFilterChange} resultCount={filteredPets.length} />
            <PetGrid pets={filteredPets} onAdoptClick={handleAdoptClick} />
            
            {isAdoptionModalOpen && (
                <AdoptionModal 
                    pet={selectedPet} 
                    onClose={handleCloseAdoptionModal} 
                    onSubmit={handleAdoptionFormSubmit}
                />
            )}

            {showAdoptionConfirmation && (
                <div className="fixed bottom-5 right-5 bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg">
                    Application Submitted! The NGO will contact you soon.
                </div>
            )}
        </div>
    );
};

export default AdoptionPage;