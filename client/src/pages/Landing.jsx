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
      <div className="pink-bg"></div>

      <div className="pink-card" style={{ maxWidth: '360px', padding: '30px 20px' }}> {/* 🔥 Box patla kiya */}
        
        <div className="logo-area">
          <img 
            src="/logo.png" 
            alt="Random Talk" 
            className="pink-logo pulse-logo" 
            style={{ height: '130px', width: 'auto', marginBottom: '10px' }} // 🔥 Logo bada kiya
          />
          <h1 className="pink-title" style={{ fontSize: '32px', marginTop: '10px' }}>Random Talk</h1>
          <p className="pink-subtitle">Talk to strangers. Anonymously.</p>
        </div>

        <button 
          className="pink-start-btn" 
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Tap to Start'}
        </button>

        <div className="pink-footer">
          <span onClick={() => { setModalType('terms'); setModalOpen(true); }}>Terms</span>
          <span onClick={() => { setModalType('privacy'); setModalOpen(true); }}>Privacy</span>
        </div>
      </div>

      <TermsModal open={modalOpen} onClose={() => setModalOpen(false)} type={modalType} />
    </div>
  );
}