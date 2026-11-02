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
  const [mode, setMode] = useState('solo'); // solo ya squad

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
    <div className="monkey-landing">
      {/* Background Image */}
      <div className="monkey-bg"></div>

      {/* Left Side: Self Camera Area (Ya Placeholder) */}
      <div className="monkey-left">
        <div className="camera-placeholder">
          <p>Camera Preview</p>
          <span>(Turn on camera to see yourself)</span>
        </div>
      </div>

      {/* Right Side: Control Card */}
      <div className="monkey-right">
        <div className="monkey-card">
          {/* Top Tabs (Solo/Squad) */}
          <div className="monkey-tabs">
            <button 
              className={`monkey-tab ${mode === 'solo' ? 'active' : ''}`}
              onClick={() => setMode('solo')}
            >
              SOLO
            </button>
            <button 
              className={`monkey-tab ${mode === 'squad' ? 'active' : ''}`}
              onClick={() => setMode('squad')}
            >
              SQUAD
            </button>
          </div>

          {/* Logo & Title */}
          <div className="monkey-logo-area">
            <img src="/logo.png" alt="Random Talk" className="monkey-logo" />
            <h1 className="monkey-title">Random Talk</h1>
            <p className="monkey-subtitle">Make new friends<br/>face-to-face</p>
          </div>

          {/* Match Mode Button */}
          <button className="monkey-match-btn">
            👫 Both
          </button>

          {/* Start Button */}
          <button 
            className="monkey-start-btn" 
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Start Video Chat'}
          </button>

          {/* Footer Links */}
          <div className="monkey-footer">
            <span onClick={() => { setModalType('terms'); setModalOpen(true); }}>Terms</span>
            <span onClick={() => { setModalType('privacy'); setModalOpen(true); }}>Privacy</span>
          </div>
        </div>
      </div>

      <TermsModal open={modalOpen} onClose={() => setModalOpen(false)} type={modalType} />
    </div>
  );
}