import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TermsModal from '../components/TermsModal';

export default function Landing() {
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('terms');
  const [loading, setLoading] = useState(false);

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      // 👇 Background mein Guest Login karo (bina popup ke)
      await loginAsGuest();
      
      // Interests save karo
      if (interests.trim()) {
        sessionStorage.setItem('interests', interests.trim());
      } else {
        sessionStorage.removeItem('interests');
      }

      // Terms flag save karo
      localStorage.setItem('acceptedTerms', 'true');
      localStorage.setItem('acceptedTermsAt', new Date().toISOString());

      // Chat page pe bhejo
      navigate('/chat');
    } catch (err) {
      console.error(err);
      alert('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="landing-root">
      <div className="landing-bg-orb landing-bg-orb-1" />
      <div className="landing-bg-orb landing-bg-orb-2" />

      <div className="landing-card">
        {/* Logo */}
        <div className="landing-logo">
          <img src="/logo.png" alt="Random Talk" className="landing-logo-img" />
          <p className="landing-logo-tagline">Talk to strangers. Anonymously.</p>
        </div>

        {/* Content */}
        <div className="landing-content">
          <p>
            <b>Random Talk</b> is a great way to meet new friends from around
            the world. You are paired randomly with another person to talk
            one-on-one. Add your interests below to match with people who
            share similar interests.
          </p>

          <p>
            To help you stay safe, chats are anonymous unless you tell someone
            who you are, and you can stop a chat at any time. Read our{' '}
            <span className="landing-link" onClick={() => openModal('terms')}>
              Terms of Service
            </span>{' '}
            and{' '}
            <span
              className="landing-link"
              onClick={() => openModal('guidelines')}
            >
              Community Guidelines
            </span>{' '}
            before starting.
          </p>

          <p className="landing-highlight">
            You must be 18+ or 13+ with parental permission and supervision to
            use Random Talk. See our{' '}
            <span className="landing-link" onClick={() => openModal('terms')}>
              Terms of Service
            </span>{' '}
            for more info.
          </p>
        </div>

        {/* Warning */}
        <div className="landing-warning">
          <span className="landing-warning-icon">⚠</span>
          <span>Video is monitored. Keep it clean</span>
        </div>

        {/* Interests */}
        <div className="landing-form">
          <label className="landing-label">
            What do you wanna talk about?
          </label>
          <div className="landing-form-row">
            <input
              type="text"
              className="landing-input"
              placeholder="Add your interests (optional)"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              maxLength={100}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStart();
              }}
            />
            <button
              onClick={handleStart}
              className="landing-btn"
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Start Video Chat'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="landing-footer">
          <span>© {new Date().getFullYear()} Random Talk</span>
          <span className="landing-footer-sep">·</span>
          <span className="landing-link" onClick={() => openModal('terms')}>
            Terms of Service
          </span>
          <span className="landing-footer-sep">·</span>
          <span className="landing-link" onClick={() => openModal('privacy')}>
            Privacy Policy
          </span>
          <span className="landing-footer-sep">·</span>
          <span
            className="landing-link"
            onClick={() => openModal('guidelines')}
          >
            Community Guidelines
          </span>
        </div>
      </div>

      <TermsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
      />
    </div>
  );
}