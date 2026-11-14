import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const footerLinkStyle = {
  color: 'inherit',
  textDecoration: 'none',
  cursor: 'pointer',
};

export default function Landing() {
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();
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
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background */}
      <div
        className="pink-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100dvh',
          backgroundImage: "url('/bg-pink.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1,
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
          gap: '15px',
          textAlign: 'center',
        }}
      >
        <div className="logo-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0px' }}>
          <img
            src="/logo.png"
            alt="Random Talk"
            className="pink-logo pulse-logo"
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
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Connecting...' : 'Tap to Start'}
        </button>

        {/* Age and consent notice */}
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(11px, 3vw, 12px)',
            lineHeight: 1.5,
            color: '#fdf2f8',
            opacity: 0.9,
          }}
        >
          By continuing, you confirm that you are 18 years of age or older and agree to our{' '}
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
          .
        </p>

        <div
          className="pink-footer"
          style={{
            marginTop: '4px',
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            fontSize: 'clamp(12px, 3.5vw, 14px)',
          }}
        >
          <Link to="/terms" style={footerLinkStyle}>Terms</Link>
          <Link to="/privacy" style={footerLinkStyle}>Privacy</Link>
        </div>
      </div>
    </div>
  );
}