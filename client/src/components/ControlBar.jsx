import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import CountrySelector from './CountrySelector';
import GenderSelector from './GenderSelector';

export default function ControlBar({
  status,
  onStart,
  onNext,
  onStop,
  country,
  onCountryChange,
  onReport,
}) {
  const { t } = useLanguage();
  const [gender, setGender] = useState('male');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Common base — same colors, 3D effect
  const base = {
    height: isMobile ? '52px' : '64px', // Thoda height badhaya
    borderRadius: '12px',
    fontSize: isMobile ? '15px' : '18px', 
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '0 10px',
    minWidth: '0', // 🔥 FIX: minWidth 0 kar diya taaki sab barabar ho
    border: 'none',
    color: '#fff',
    transition: 'all 0.12s ease',
    textShadow: '0 1px 2px rgba(0,0,0,0.25)',
    letterSpacing: '0.3px',
    flex: 1, // 🔥 FIX: Sabhi buttons barabar width lenge
    whiteSpace: 'nowrap', // Text ek line me rahe
    overflow: 'hidden'
  };

  const btnGreen = {
    ...base,
    background: 'linear-gradient(180deg, #8edcb5 0%, #6ec89d 50%, #56b185 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 5px 0 #3f8f66, 0 8px 16px rgba(0,0,0,0.35)',
  };

  const btnOrange = {
    ...base,
    background: 'linear-gradient(180deg, #ffa285 0%, #f08060 50%, #d4654a 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 5px 0 #a84a35, 0 8px 16px rgba(0,0,0,0.35)',
  };

  const btnRed = {
    ...base,
    background: 'linear-gradient(180deg, #ff6b6b 0%, #ef4444 50%, #c72828 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 5px 0 #9a1e1e, 0 8px 16px rgba(0,0,0,0.35)',
  };

  const disabledStyle = {
    opacity: 0.55,
    cursor: 'not-allowed',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 0 rgba(0,0,0,0.2)',
    transform: 'none',
  };

  return (
    <div 
      className="control-bar"
      style={{
        display: 'flex',
        flexWrap: 'nowrap', 
        gap: '8px',
        justifyContent: 'center',
        padding: '10px',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto'
      }}
    >
      {status === 'idle' && (
        <button onClick={onStart} style={btnGreen}>
          ▶ {t('control.start')}
        </button>
      )}

      {status === 'waiting' && (
        <button disabled style={{ ...btnGreen, ...disabledStyle }}>
          ▶ {t('control.start')}
        </button>
      )}

      {status === 'connected' && (
        <button onClick={onNext} style={btnGreen}>
          ⏭ {t('control.next')}
        </button>
      )}

      {/* 🔥 Mobile par Stop button nahi dikhega */}
      {!isMobile && (
        <button
          onClick={onStop}
          disabled={status === 'idle'}
          style={{ ...btnOrange, ...(status === 'idle' ? disabledStyle : {}) }}
        >
          ⏹ {t('control.stop')}
        </button>
      )}

      {/* 🔥 CountrySelector aur GenderSelector ko flex: 1 dene ke liye ek div me wrap kiya */}
      <div style={{ flex: 1, display: 'flex' }}>
        <CountrySelector selected={country} onSelect={onCountryChange} />
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        <GenderSelector selected={gender} onSelect={setGender} />
      </div>

      {/* 🔥 Mobile par Report button nahi dikhega */}
      {!isMobile && (
        <button onClick={onReport} style={btnRed} title={t('control.report')}>
          🚩 {t('control.report')}
        </button>
      )}
    </div>
  );
}