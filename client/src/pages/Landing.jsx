import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TermsModal from '../components/TermsModal';
import HeroAnimation from '../components/HeroAnimation';

export default function Landing() {
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('terms');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
      localStorage.setItem('acceptedTerms', 'true');
      navigate('/chat');
    } catch (err) {
      alert('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="pink-landing-wrapper">
      <div className="pink-bg"></div>

      <div className="pink-card">
        
        {/* 🔥 LADKI - LOGO - LADKA */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', marginTop: '10px', height: '110px' }}>
          
          <HeroAnimation />

          {/* Logo */}
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/logo.png" 
              alt="Random Talk" 
              className="pink-logo pulse-logo" 
              style={{ height: '100px', width: 'auto', filter: 'drop-shadow(0px 5px 20px rgba(236,72,153,0.6))' }} 
            />
          </div>
          
        </div>

        {/* Title (Distance kam kiya marginTop: 0 se -10px karke) */}
        <h1 className="pink-title" style={{ marginTop: '-10px' }}>Random Talk</h1>
        <p className="pink-subtitle">Talk to strangers. Anonymously.</p>

        {/* Start Button */}
        <button 
          className="pink-start-btn" 
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Tap to Start'}
        </button>

        {/* Footer */}
        <div className="pink-footer">
          <span onClick={() => { setModalType('terms'); setModalOpen(true); }}>Terms</span>
          <span onClick={() => { setModalType('privacy'); setModalOpen(true); }}>Privacy</span>
        </div>
      </div>

      <TermsModal open={modalOpen} onClose={() => setModalOpen(false)} type={modalType} />
    </div>
  );
}