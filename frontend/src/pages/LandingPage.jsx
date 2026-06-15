// frontend/src/pages/LandingPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { usePlatform } from '../hooks/usePlatform';

/* ── Floating particle blob ── */
const Particle = ({ style }) => (
  <div
    style={{
      position: 'absolute',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
      pointerEvents: 'none',
      animation: 'particleFloat 6s ease-in-out infinite',
      ...style,
    }}
  />
);

/* ── Animated counter ── */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

const StatCard = ({ value, suffix = '', label, color }) => {
  const [count, ref] = useCounter(value);
  return (
    <div ref={ref} className="stat-card" style={{ '--glow-color': color }}>
      <div style={{
        fontSize: '2.75rem', fontWeight: 900,
        background: color, WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        lineHeight: 1.1,
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.65)', marginTop: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}>{label}</div>
    </div>
  );
};

const FeatureCard = ({ icon, title, text, delay }) => (
  <div
    className="feature-card"
    style={{
      animationDelay: `${delay}ms`,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(139,92,246,0.25)',
      textAlign: 'center',
    }}
  >
    <div style={{
      width: 64, height: 64, borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.75rem', margin: '0 auto 1.25rem',
      boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
    }}>{icon}</div>
    <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{title}</h3>
    <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, fontSize: '0.95rem' }}>{text}</p>
  </div>
);

const LandingPage = () => {
  // Live platform stats
  const [stats, setStats] = useState({
    total_cases: 0,
    resolved_cases: 0,
    ngo_count: 0,
    total_adoptions: 0,
  });

  const { isMobile } = usePlatform();

  useEffect(() => {
    axios.get('/stats/summary')
      .then(r => setStats(r.data))
      .catch(() => {
        // Fallback to static illustrative numbers if API unavailable
        setStats({ total_cases: 1200, resolved_cases: 850, ngo_count: 15, total_adoptions: 340 });
      });
  }, []);

  return (
    <div style={{ background: '#0f0f1a', overflow: 'hidden' }}>

      {/* ── Hero Section ── */}
      <section style={{
        position: 'relative',
        minHeight: isMobile ? '80vh' : '92vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: isMobile ? '3rem 1rem' : '6rem 1.5rem 4rem',
        overflow: 'hidden',
      }}>
        {/* Animated gradient bg */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 35%, #0d1b3e 70%, #0f0f1a 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 10s ease infinite',
          zIndex: 0,
        }} />

        {/* Floating particles */}
        <Particle style={{ width: 380, height: 380, top: '-10%', left: '-8%', animationDelay: '0s' }} />
        <Particle style={{ width: 280, height: 280, top: '20%', right: '-5%', animationDelay: '1.5s', background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)' }} />
        <Particle style={{ width: 200, height: 200, bottom: '10%', left: '20%', animationDelay: '3s', background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)' }} />
        <Particle style={{ width: 150, height: 150, bottom: '25%', right: '15%', animationDelay: '0.8s' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '50px', padding: '0.4rem 1.1rem',
            color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600,
            marginBottom: '1.75rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            🐾 Community Animal Care Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', fontWeight: 900,
            lineHeight: 1.08, marginBottom: '1.5rem', color: '#fff',
            animation: 'fadeInDown 0.8s ease both',
          }}>
            Every Stray Deserves{' '}
            <span className="gradient-text">a Second Chance</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'rgba(255,255,255,0.65)',
            maxWidth: '590px', margin: '0 auto 2.5rem', lineHeight: 1.7,
            animation: 'fadeInUp 0.9s ease both 0.2s',
          }}>
            Your community-driven platform for rescuing, reporting, and rehoming stray animals in need.
          </p>

          <div style={{
            display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
            animation: 'fadeInUp 1s ease both 0.4s',
          }}>
            {!isMobile && (
              <>
                <Link
                  to="/adopt"
                  className="gradient-btn"
                  style={{ padding: '0.85rem 2.2rem', fontSize: '1rem', textDecoration: 'none' }}
                >
                  🐶 Find a Pet to Adopt
                </Link>
                <Link
                  to="/report-case"
                  className="gradient-btn-warm"
                  style={{ padding: '0.85rem 2.2rem', fontSize: '1rem', textDecoration: 'none' }}
                >
                  🚨 Report an Animal in Need
                </Link>
              </>
            )}
          </div>

          {/* Scroll indicator */}
          <div style={{
            marginTop: '4rem', color: 'rgba(255,255,255,0.35)',
            fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            animation: 'floatUp 2s ease-in-out infinite',
          }}>
            ↓ Scroll to explore
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section style={{
        padding: '5rem 1.5rem',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #12122a 100%)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
          }}>
            <StatCard value={stats.total_cases}    suffix="" label="Cases Reported"       color="linear-gradient(135deg,#6366f1,#8b5cf6)" />
            <StatCard value={stats.total_adoptions} suffix="" label="Successful Adoptions" color="linear-gradient(135deg,#ec4899,#f97316)" />
            <StatCard value={stats.ngo_count}       suffix="" label="Partner NGOs"         color="linear-gradient(135deg,#14b8a6,#6366f1)" />
            <StatCard value={stats.resolved_cases}  suffix="" label="Animals Rescued"      color="linear-gradient(135deg,#f59e0b,#ef4444)" />
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section style={{ padding: '5rem 1.5rem', background: '#0f0f1a' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '50px', padding: '0.35rem 1rem',
            color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: '1rem',
          }}>How It Works</div>

          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 800,
            color: '#fff', marginBottom: '1rem',
          }}>
            Three Ways to Make a <span className="gradient-text">Difference</span>
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.55)', maxWidth: 520, margin: '0 auto 3.5rem',
            fontSize: '1rem', lineHeight: 1.65,
          }}>
            Whether you want to adopt, report, or support — StrayCare makes it easy to help.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.75rem',
          }}>
            <FeatureCard icon="🐾" delay={0}   title="Adopt"
              text="Browse our gallery of lovable animals rescued by partner NGOs. Your new best friend is waiting." />
            <FeatureCard icon="🚨" delay={150} title="Report"
              text="See an animal in distress? Alert nearby NGOs instantly with a photo and location pin." />
            <FeatureCard icon="🤝" delay={300} title="Support"
              text="Learn animal first aid, donate to NGOs, and be a voice for animals who can't speak for themselves." />
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{
        padding: '5rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.1) 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800,
            color: '#fff', marginBottom: '1rem',
          }}>
            Ready to Change a Life?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            Join thousands of compassionate citizens making India safer for stray animals.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="gradient-btn"
              style={{ padding: '0.85rem 2.2rem', fontSize: '1rem', textDecoration: 'none' }}>
              Join for Free
            </Link>
            <Link to="/donate" className="gradient-btn-warm"
              style={{ padding: '0.85rem 2.2rem', fontSize: '1rem', textDecoration: 'none' }}>
              💛 Donate Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
