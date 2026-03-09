// frontend/src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="text-center">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary to-secondary text-white py-24 px-4">
                <h1 className="text-5xl font-bold mb-4 animate-fade-in-down">Welcome to StrayCare</h1>
                <p className="text-xl max-w-3xl mx-auto mb-8">
                    Your community-driven platform for rescuing, reporting, and rehoming stray animals in need.
                </p>
                <div className="space-x-4">
                    <Link 
                        to="/adopt" 
                        className="bg-white text-primary font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-transform transform hover:scale-105"
                    >
                        Find a Pet to Adopt
                    </Link>
                    <Link 
                        to="/report-case" 
                        className="bg-accent text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-yellow-300 transition-transform transform hover:scale-105"
                    >
                        Report an Animal in Need
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-light-gray">
                <h2 className="text-3xl font-bold mb-12">How It Works</h2>
                <div className="container mx-auto grid md:grid-cols-3 gap-12">
                    <div className="feature-card">
                        <h3 className="text-2xl font-semibold mb-3">🐾 Adopt</h3>
                        <p>Browse our gallery of lovable animals rescued by our partner NGOs. Your new best friend is waiting for you.</p>
                    </div>
                    <div className="feature-card">
                        <h3 className="text-2xl font-semibold mb-3">❤️ Report</h3>
                        <p>See an animal in distress? Use our simple reporting tool to alert nearby NGOs instantly with a photo and location.</p>
                    </div>
                    <div className="feature-card">
                        <h3 className="text-2xl font-semibold mb-3">🤝 Support</h3>
                        <p>Every action counts. Learn about animal first-aid, support our partner organizations, and be a voice for the voiceless.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;