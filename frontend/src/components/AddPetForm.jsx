// frontend/src/components/AddPetForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

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
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            setError('An image of the pet is required.');
            return;
        }

        setIsLoading(true);
        setError('');

        const submissionData = new FormData();
        // Append all form fields
        Object.keys(formData).forEach(key => {
            submissionData.append(key, formData[key]);
        });
        submissionData.append('image', image);

        const token = localStorage.getItem('ngo_token');

        try {
            await axios.post('http://127.0.0.1:8000/ngo/pets', submissionData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            onPetAdded(); // This will trigger a refresh on the dashboard
        } catch (err) {
            setError('Failed to list pet. Please check the details and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">List a New Pet for Adoption</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Add form fields for name, breed, age, location, etc. */}
                    <input name="name" onChange={handleChange} placeholder="Pet's Name" className="form-input" required />
                    <select name="species" value={formData.species} onChange={handleChange} className="form-input">
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                    </select>
                    <input name="breed" onChange={handleChange} placeholder="Breed" className="form-input" required />
                    <input name="age" onChange={handleChange} placeholder="Age (e.g., 2 years)" className="form-input" required />
                     <div>
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" name="is_vaccinated" checked={formData.is_vaccinated} onChange={handleChange} />
                            <span>Is Vaccinated?</span>
                        </label>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} required />
                    
                    {error && <p className="text-red-500">{error}</p>}
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-6 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" disabled={isLoading} className="py-2 px-6 bg-primary text-white rounded-md">
                            {isLoading ? 'Listing...' : 'List Pet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPetForm;