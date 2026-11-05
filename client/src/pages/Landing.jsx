import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TermsModal from '../components/TermsModal';

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
      {/* Background Image */}
      <div className="pink-bg"></div>

      {/* Main Card Center Me */}
      <div className="pink-card">
        {/* Logo & Title */}
        <div className="logo-area">
          {/* 🔥 Yahan 'pulse-logo' class add ki hai taaki zoom in/out animation chale */}
          <img 
            src="/logo.png" 
            alt="Random Talk" 
            className="pink-logo pulse-logo" 
            style={{ height: '100px', width: 'auto' }} 
          />
          <h1 className="pink-title">Random Talk</h1>
          <p className="pink-subtitle">Talk to strangers. Anonymously.</p>
        </div>

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