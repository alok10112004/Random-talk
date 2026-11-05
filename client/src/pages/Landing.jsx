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
    <div className="pink-landing-wrapper" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="pink-bg"></div>

      <div className="pink-card" style={{ maxWidth: '380px', padding: '20px 20px' }}>
        
        <div className="logo-area" style={{ marginTop: '0px' }}> {/* 🔥 Upar ka space kam kiya */}
          <img 
            src="/logo.png" 
            alt="Random Talk" 
            className="pink-logo pulse-logo" 
            style={{ height: '160px', width: 'auto', marginBottom: '5px' }} 
          />
          <h1 className="pink-title" style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Random Talk
          </h1>
          <p className="pink-subtitle" style={{ fontSize: '14px', color: '#fdf2f8' }}>
            Talk to strangers. Anonymously.
          </p>
        </div>

        <button 
          className="pink-start-btn" 
          onClick={handleStart}
          disabled={loading}
          style={{ fontSize: '18px', padding: '15px', borderRadius: '12px', fontWeight: '600' }}
        >
          {loading ? 'Connecting...' : 'Tap to Start'}
        </button>

        <div className="pink-footer" style={{ marginTop: '15px' }}>
          <span onClick={() => { setModalType('terms'); setModalOpen(true); }}>Terms</span>
          <span onClick={() => { setModalType('privacy'); setModalOpen(true); }}>Privacy</span>
        </div>
      </div>

      <TermsModal open={modalOpen} onClose={() => setModalOpen(false)} type={modalType} />
    </div>
  );
}