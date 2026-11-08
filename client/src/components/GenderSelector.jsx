import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const OPTIONS = [
  { id: 'male', labelKey: 'control.gender.male', symbol: '♂', color: '#60a5fa' },
  { id: 'female', labelKey: 'control.gender.female', symbol: '♀', color: '#f472b6' },
  { id: 'other', labelKey: 'control.gender.other', symbol: '⚧', color: '#a78bfa' },
];

export default function GenderSelector({ selected, onSelect }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = OPTIONS.find((o) => o.id === selected) || OPTIONS[0];

  const buttonStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
    color: '#fff',
    border: '1px solid #1e40af',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: '0 10px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 5px 0 #1e3a8a, 0 8px 18px rgba(0,0,0,0.5)',
    transition: 'all 0.12s ease',
    letterSpacing: '0.3px',
    outline: 'none',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  };

  return (
    <div 
      ref={dropdownRef} 
      className="gender-selector-wrapper" 
      style={{ position: 'relative', width: '100%', height: '100%' }} // 🔥 FIX: height 100%
    >
      <button onClick={() => setOpen(!open)} style={buttonStyle}>
        <span style={{ fontSize: '20px', color: '#fff', fontWeight: 700 }}>
          {current.symbol}
        </span>
        <span>{t(current.labelKey)}</span>
      </button>

      {open && (
        <div style={{
            position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
            width: '200px', background: '#131823', border: '1px solid rgba(96, 165, 250, 0.3)',
            borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', zIndex: 100,
        }}>
          {OPTIONS.map((o) => {
            const isSelected = selected === o.id;
            return (
              <button
                key={o.id} onClick={() => { onSelect(o.id); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  background: isSelected ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                  border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', fontWeight: 600,
                }}
              >
                <span style={{ fontSize: '20px', width: '24px', textAlign: 'center', color: o.color, fontWeight: 700 }}>{o.symbol}</span>
                <span style={{ flex: 1 }}>{t(o.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}