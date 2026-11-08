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
    <div 
      className="pink-landing-wrapper" 
      style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100dvh', // 🔥 URL bar issue fix
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background (Fixed taaki hilne ka issue khatam ho) */}
      <div 
        className="pink-bg" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100dvh',
          backgroundImage: "url('/bg-pink.png')", // Agar tumhari image ka naam alag hai toh change karna
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }}
      ></div>

      {/* Main Card */}
      <div 
        className="pink-card" 
        style={{ 
          position: 'relative',
          zIndex: 10,
          width: '90%', 
          maxWidth: '360px', 
          padding: 'clamp(20px, 5vw, 30px) 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px', // 🔥 Gap kam kiya taaki mobile par lamba na ho
          textAlign: 'center'
        }}
      >
        
        <div className="logo-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0px' }}>
          <img 
            src="/logo.png" 
            alt="Random Talk" 
            className="pink-logo pulse-logo" 
            // 🔥 FIX: Fixed height hata kar clamp lagaya (mobile par chhota, PC par bada)
            style={{ height: 'clamp(100px, 18vh, 140px)', width: 'auto', objectFit: 'contain', marginBottom: '8px' }} 
          />
          <h1 className="pink-title" style={{ fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: '700', letterSpacing: '-0.5px', margin: '0 0 4px 0' }}>
            Random Talk
          </h1>
          <p className="pink-subtitle" style={{ fontSize: 'clamp(12px, 4vw, 14px)', color: '#fdf2f8', margin: 0 }}>
            Talk to strangers. Anonymously.
          </p>
        </div>

        <button 
          className="pink-start-btn" 
          onClick={handleStart}
          disabled={loading}
          style={{ 
            width: '100%',
            fontSize: 'clamp(16px, 4vw, 18px)', 
            padding: 'clamp(12px, 4vw, 15px)', 
            borderRadius: '12px', 
            fontWeight: '600',
            marginTop: '10px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Connecting...' : 'Tap to Start'}
        </button>

        <div className="pink-footer" style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: 'clamp(12px, 3.5vw, 14px)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => { setModalType('terms'); setModalOpen(true); }}>Terms</span>
          <span style={{ cursor: 'pointer' }} onClick={() => { setModalType('privacy'); setModalOpen(true); }}>Privacy</span>
        </div>
      </div>

      <TermsModal open={modalOpen} onClose={() => setModalOpen(false)} type={modalType} />
    </div>
  );
}