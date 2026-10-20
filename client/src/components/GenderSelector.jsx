import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const OPTIONS = [
  { id: 'male', labelKey: 'control.gender.male', symbol: '♂', color: '#60a5fa' },
  { id: 'female', labelKey: 'control.gender.female', symbol: '♀', color: '#f472b6' },
  { id: 'other', labelKey: 'control.gender.other', symbol: '⚧', color: '#a78bfa' },
];

export default function GenderSelector({ selected, onSelect }) {
  const { t, theme } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isLight = theme === 'light';

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = OPTIONS.find((o) => o.id === selected) || OPTIONS[0];

  const handleSelect = (id) => {
    onSelect(id);
    setOpen(false);
  };

  const buttonStyle = isLight
    ? {
        width: '100%',
        height: '64px',
        background:
          'linear-gradient(180deg, #ffffff 0%, #f3f4f6 50%, #e5e7eb 100%)',
        color: '#1f2937',
        border: '1px solid #d1d5db',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: '0 18px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.9), 0 5px 0 #d1d5db, 0 8px 16px rgba(0,0,0,0.1)',
        transition: 'all 0.12s ease',
        letterSpacing: '0.3px',
        outline: 'none',
      }
    : {
        width: '100%',
        height: '64px',
        background:
          'linear-gradient(180deg, #3b4560 0%, #252b3d 50%, #1a1f2e 100%)',
        backgroundColor: '#252b3d',
        color: '#fff',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: '0 18px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.15), 0 5px 0 #0a0e1a, 0 8px 18px rgba(0,0,0,0.5)',
        transition: 'all 0.12s ease',
        letterSpacing: '0.3px',
        outline: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      };

  return (
    <div
      ref={dropdownRef}
      className="gender-selector-wrapper"
      style={{
        position: 'relative',
        flex: '0 0 180px',
        width: '180px',
      }}
    >
      <button onClick={() => setOpen(!open)} style={buttonStyle}>
        <span
          style={{
            fontSize: '20px',
            color: current.color,
            fontWeight: 700,
          }}
        >
          {current.symbol}
        </span>
        <span>{t(current.labelKey)}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            background: isLight ? '#ffffff' : '#131823',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {OPTIONS.map((o) => {
            const isSelected = selected === o.id;
            return (
              <button
                key={o.id}
                onClick={() => handleSelect(o.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: isSelected
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'transparent',
                  border: 'none',
                  color: isLight ? '#1f2937' : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)')
                }
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'transparent';
                }}
              >
                <span
                  style={{
                    fontSize: '20px',
                    width: '24px',
                    textAlign: 'center',
                    color: o.color,
                    fontWeight: 700,
                  }}
                >
                  {o.symbol}
                </span>
                <span style={{ flex: 1 }}>{t(o.labelKey)}</span>
                {isSelected && (
                  <span style={{ color: '#a855f7', fontSize: '14px' }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}