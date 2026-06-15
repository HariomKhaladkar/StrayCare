// frontend/src/pages/AdoptionPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';
import { usePlatform } from '../hooks/usePlatform';

// ─── Pet Video Player ─────────────────────────────────────────────────────────
const PetVideoPlayer = ({ videoUrl, petName }) => {
    const src = videoUrl.startsWith('http')
        ? videoUrl
        : `${API_BASE_URL}/${videoUrl}`;

    return (
        <div style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <video
                controls
                preload="metadata"
                style={{ width: '100%', maxHeight: '200px', display: 'block' }}
                aria-label={`Video of ${petName}`}
            >
                <source src={src} type="video/mp4" />
                Your browser does not support HTML5 video.
            </video>
        </div>
    );
};

// ─── PetCard ──────────────────────────────────────────────────────────────────
const PetCard = ({ pet, onAdoptClick }) => {
    const [showVideo, setShowVideo] = useState(false);

    if (!pet || !pet.image_url) return null;

    const imageUrl = pet.image_url.startsWith('http')
        ? pet.image_url
        : `${API_BASE_URL}/${pet.image_url}`;

    return (
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '1.1rem',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.boxShadow = '0 18px 44px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.boxShadow = ''; }}
        >
            {/* Photo */}
            <div style={{ overflow: 'hidden', position: 'relative' }}>
                <img
                    src={imageUrl}
                    alt={pet.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block', transition: 'transform 0.5s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                    onMouseLeave={e => e.currentTarget.style.transform = ''}
                />
                {/* Video icon badge */}
                {pet.video_url && (
                    <button
                        onClick={() => setShowVideo(v => !v)}
                        title={showVideo ? 'Hide video' : 'Watch video'}
                        style={{
                            position: 'absolute', bottom: 8, right: 8,
                            background: showVideo ? 'rgba(236,72,153,0.85)' : 'rgba(99,102,241,0.85)',
                            border: 'none', borderRadius: '50%',
                            width: 36, height: 36, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', backdropFilter: 'blur(4px)',
                            transition: 'background 0.25s',
                        }}
                    >
                        {showVideo ? '✕' : '▶'}
                    </button>
                )}
            </div>

            {/* Inline video player (toggle) */}
            {pet.video_url && showVideo && (
                <PetVideoPlayer videoUrl={pet.video_url} petName={pet.name} />
            )}

            {/* Info */}
            <div style={{ padding: '1rem 1.1rem', flexGrow: 1, position: 'relative' }}>
                {pet.matchPercentage && (
                    <div style={{
                        position: 'absolute', top: '-1.5rem', right: '1rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', fontWeight: 900, padding: '0.4rem 0.8rem',
                        borderRadius: '20px', fontSize: '0.9rem',
                        boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        zIndex: 10
                    }}>
                        ✨ {pet.matchPercentage}% Match
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
                        {pet.name}
                    </h3>
                    {pet.is_vaccinated && (
                        <span style={{
                            fontSize: '0.7rem', fontWeight: 700,
                            background: 'rgba(20,184,166,0.15)', color: '#2dd4bf',
                            border: '1px solid rgba(20,184,166,0.35)',
                            borderRadius: '99px', padding: '0.15rem 0.55rem',
                        }}>💉 Vaccinated</span>
                    )}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', margin: '0 0 0.25rem' }}>
                    {pet.species} • {pet.breed}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: 0 }}>
                    {pet.age} • {pet.gender} • {pet.size}
                </p>
                {pet.location && (
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                        📍 {pet.location}
                    </p>
                )}
            </div>

            {/* Adopt button */}
            <div style={{ padding: '0 1.1rem 1.1rem' }}>
                <button
                    onClick={() => onAdoptClick(pet)}
                    style={{
                        width: '100%',
                        padding: '0.65rem',
                        border: 'none',
                        borderRadius: '0.6rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff',
                        boxShadow: '0 3px 12px rgba(99,102,241,0.4)',
                        transition: 'all 0.25s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(99,102,241,0.55)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 12px rgba(99,102,241,0.4)'; }}
                >
                    🐾 Adopt Me
                </button>
            </div>
        </div>
    );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────
const FilterBar = ({ filters, onFilterChange, resultCount, onOpenMatchmaker, isMobile }) => (
    <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(12px)',
        borderRadius: '1rem',
        padding: isMobile ? '1rem' : '1rem 1.25rem',
        marginBottom: isMobile ? '1rem' : '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
    }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>🔍 Find a Friend</h2>
        <select
            name="species"
            value={filters.species}
            onChange={onFilterChange}
            style={{
                padding: '0.5rem 0.85rem',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
                fontSize: '0.88rem',
                cursor: 'pointer',
            }}
        >
            <option value="all">All Species</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="other">Other</option>
        </select>
        <select
            name="gender"
            value={filters.gender}
            onChange={onFilterChange}
            style={{
                padding: '0.5rem 0.85rem',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
                fontSize: '0.88rem',
                cursor: 'pointer',
            }}
        >
            <option value="all">Any Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
        </select>

        <button onClick={onOpenMatchmaker} style={{
            marginLeft: 'auto',
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '0.6rem',
            padding: '0.6rem 1.2rem', fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(236,72,153,0.35)',
            transition: 'transform 0.2s',
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            ✨ Find My Match
        </button>

        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
            {resultCount} pet{resultCount !== 1 ? 's' : ''} found
        </div>
    </div>
);

// ─── Adoption Modal ───────────────────────────────────────────────────────────
const AdoptionModal = ({ pet, onClose, onSubmit }) => {
    const { isMobile } = usePlatform();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', experience: '', reason: ''
    });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

    if (!pet) return null;

    const overlayStyle = {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
    };
    const cardStyle = {
        background: '#16162a',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '1.25rem',
        padding: isMobile ? '1.25rem' : '2rem',
        width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    };
    const inputStyle = {
        width: '100%', padding: '0.7rem 1rem', marginBottom: '0.75rem',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '0.6rem', color: '#f1f5f9', fontSize: '0.92rem', outline: 'none',
        fontFamily: 'inherit', resize: 'vertical',
    };

    return (
        <div style={overlayStyle}>
            <div style={cardStyle}>
                <h2 style={{
                    fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1.25rem',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                    🐾 Adopt {pet.name}
                </h2>
                <form onSubmit={handleSubmit}>
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Your Full Name" style={inputStyle} required />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" style={inputStyle} required />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" style={inputStyle} required />
                    <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Your Home Address" style={{ ...inputStyle, rows: 2 }} rows="2" required />
                    <textarea name="experience" value={formData.experience} onChange={handleChange} placeholder="Do you have prior pet experience?" style={inputStyle} rows="2" required />
                    <textarea name="reason" value={formData.reason} onChange={handleChange} placeholder="Why do you want to adopt?" style={inputStyle} rows="2" required />
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onClose} style={{
                            padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600,
                            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                        }}>Cancel</button>
                        <button type="submit" style={{
                            padding: '0.6rem 1.4rem', borderRadius: '0.5rem', fontWeight: 700,
                            border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
                        }}>Submit Application</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Matchmaker Modal ─────────────────────────────────────────────────────────
const MatchmakerModal = ({ onClose, onSubmit }) => {
    const { isMobile } = usePlatform();
    const [profile, setProfile] = useState({
        living_space: 'apartment',
        activity_level: 'medium',
        has_kids: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProfile({ ...profile, [name]: type === 'checkbox' ? checked : value });
    };

    const overlayStyle = {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '1rem',
    };
    const cardStyle = {
        background: 'linear-gradient(180deg, #1e1b4b 0%, #16162a 100%)',
        border: '1px solid rgba(236,72,153,0.4)',
        borderRadius: '1.25rem', padding: isMobile ? '1.5rem' : '2.5rem',
        width: '100%', maxWidth: '450px',
        boxShadow: '0 25px 60px rgba(236,72,153,0.15)',
        color: 'white'
    };

    const selectStyle = {
        width: '100%', padding: '0.8rem', marginBottom: '1.2rem',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '0.5rem', color: '#f1f5f9', outline: 'none',
        fontSize: '1rem'
    };

    return (
        <div style={overlayStyle}>
            <div style={cardStyle}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem', color: '#f472b6' }}>
                    ✨ Perfect Match
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>Answer 3 quick questions to discover your ideal furry companion.</p>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(profile); }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Home Environment</label>
                    <select name="living_space" value={profile.living_space} onChange={handleChange} style={selectStyle}>
                        <option value="apartment">Apartment</option>
                        <option value="house">House w/ Yard</option>
                    </select>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Your Activity Level</label>
                    <select name="activity_level" value={profile.activity_level} onChange={handleChange} style={selectStyle}>
                        <option value="low">Relaxed / Low Activity</option>
                        <option value="medium">Moderate / Daily Walks</option>
                        <option value="high">Very Active / Runner</option>
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', cursor: 'pointer', fontWeight: 600 }}>
                        <input type="checkbox" name="has_kids" checked={profile.has_kids} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} />
                        I have children under 12
                    </label>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                        <button type="submit" style={{ flex: 2, padding: '0.8rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', border: 'none', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}>
                            Reveal My Matches ✨
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Adoption Page ───────────────────────────────────────────────────────
const AdoptionPage = () => {
    const { isMobile } = usePlatform();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ species: 'all', gender: 'all' });
    const [selectedPet, setSelectedPet] = useState(null);
    const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
    const [isMatchmakerOpen, setIsMatchmakerOpen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const fetchPets = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/pets`);
                setPets(response.data);
            } catch (error) {
                console.error("Failed to fetch pets:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPets();
    }, []);

    const handleMatchmakerSubmit = async (profile) => {
        setIsMatchmakerOpen(false);
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/pets/match`, profile);
            const matchedPets = response.data.map(item => ({
                ...item.pet,
                matchPercentage: item.match_percentage
            }));
            setPets(matchedPets);
        } catch (error) {
            console.error("Match error:", error);
            alert("Failed to compute matches. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
            await axios.post(`${API_BASE_URL}/adoption-requests`, requestData);
            setIsAdoptionModalOpen(false);
            setShowConfirmation(true);
            setTimeout(() => setShowConfirmation(false), 5000);
        } catch (error) {
            console.error("Failed to submit adoption request:", error);
            const errorDetail = error.response?.data?.detail[0]?.msg || "An unexpected error occurred.";
            alert(`Submission Failed: ${errorDetail}`);
        }
    };

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleAdoptClick = (pet) => { setSelectedPet(pet); setIsAdoptionModalOpen(true); };

    const filteredPets = useMemo(() => {
        return pets.filter(pet =>
            (filters.species === 'all' || (pet.species && pet.species.toLowerCase() === filters.species)) &&
            (filters.gender === 'all' || (pet.gender && pet.gender.toLowerCase() === filters.gender))
        );
    }, [pets, filters]);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>
            🐾 Loading our furry friends…
        </div>
    );

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '0 0.5rem' : '0 1rem' }}>
            {/* Hero banner */}
            <div style={{
                padding: isMobile ? '1.25rem' : '2rem',
                borderRadius: '1.25rem',
                marginBottom: isMobile ? '1rem' : '2rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(236,72,153,0.12) 100%)',
                border: '1px solid rgba(99,102,241,0.22)',
                backdropFilter: 'blur(12px)',
            }}>
                <h1 style={{
                    margin: '0 0 0.45rem',
                    fontSize: '2rem', fontWeight: 900,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                    Find Your Forever Friend 🐾
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.95rem' }}>
                    Browse rescued animals — each one deserves a loving home. Click ▶ on any card to watch their video.
                </p>
            </div>

            <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                resultCount={filteredPets.length}
                onOpenMatchmaker={() => setIsMatchmakerOpen(true)}
                isMobile={isMobile}
            />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.5rem',
            }}>
                {filteredPets.length > 0 ? (
                    filteredPets.map(pet => (
                        <PetCard key={pet.id} pet={pet} onAdoptClick={handleAdoptClick} />
                    ))
                ) : (
                    <div style={{
                        gridColumn: '1 / -1', textAlign: 'center',
                        padding: '4rem 2rem', color: 'rgba(255,255,255,0.35)', fontSize: '1rem',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐾</div>
                        No pets match the current filters.
                    </div>
                )}
            </div>

            {isAdoptionModalOpen && (
                <AdoptionModal
                    pet={selectedPet}
                    onClose={() => setIsAdoptionModalOpen(false)}
                    onSubmit={handleAdoptionFormSubmit}
                />
            )}

            {isMatchmakerOpen && (
                <MatchmakerModal
                    onClose={() => setIsMatchmakerOpen(false)}
                    onSubmit={handleMatchmakerSubmit}
                />
            )}

            {showConfirmation && (
                <div style={{
                    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
                    background: 'linear-gradient(135deg, #14b8a6, #6366f1)',
                    color: '#fff', padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    fontWeight: 700, zIndex: 9999,
                }}>
                    ✅ Application submitted! The NGO will contact you soon.
                </div>
            )}
        </div>
    );
};

export default AdoptionPage;