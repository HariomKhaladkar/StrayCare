// src/components/AboutUs.jsx
import React from 'react';

const AboutUs = ({ onClose }) => {
  // All the content from your uploaded AboutUs.jsx file goes here
  const teamMembers = [
    { name: "Dr. Sarah Johnson", role: "Veterinarian & Founder", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face", bio: "With over 15 years of veterinary experience, Dr. Sarah founded StrayCare to bridge the gap between stray animals and loving homes." },
    // ... other team members
  ];
  // ... other data arrays (stats, values)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">About StrayCare</h1>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
            >
              &times;
            </button>
          </div>
        </div>
        {/* ... The rest of the full content from your AboutUs.jsx file */}
      </div>
    </div>
  );
};

export default AboutUs;