import { useState, useRef, useEffect, useMemo } from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import countryCodes from 'country-codes-list';
import { useLanguage } from '../context/LanguageContext';

export default function CountrySelector({ selected, onSelect }) {
  const { t, theme } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  const isLight = theme === 'light';

  const allCountries = useMemo(() => {
    return countryCodes
      .all()
      .map((c) => ({
        code: c.countryCode,
        name: c.countryNameEn,
        dialCode: c.countryCallingCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = allCountries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const Flag = selected && selected !== 'ANY' ? Flags[selected] : null;

  // Theme-based button styles
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

  const dropdownStyle = {
    position: 'absolute',
    bottom: '110%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '320px',
    background: isLight ? '#ffffff' : '#131823',
    border: `1px solid ${
      isLight ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.3)'
    }`,
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    zIndex: 100,
  };

  const itemStyle = (isSelected) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    background: isSelected
      ? 'rgba(168, 85, 247, 0.2)'
      : 'transparent',
    border: 'none',
    color: isLight ? '#1f2937' : '#fff',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
  });

  return (
    <div
      ref={dropdownRef}
      className="country-selector-wrapper"
      style={{
        position: 'relative',
        flex: '0 0 180px',
        width: '180px',
      }}
    >
      <button onClick={() => setOpen(!open)} style={buttonStyle}>
        <span>{t('control.country')}</span>
        {Flag ? (
          <Flag style={{ width: '24px', height: '16px', borderRadius: '3px' }} />
        ) : (
          <span style={{ fontSize: '20px' }}>🌍</span>
        )}
      </button>

      {open && (
        <div style={dropdownStyle}>
          <div
            style={{
              padding: '10px',
              borderBottom: `1px solid ${
                isLight
                  ? 'rgba(168, 85, 247, 0.15)'
                  : 'rgba(168, 85, 247, 0.15)'
              }`,
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('country.search')}
              autoFocus
              style={{
                width: '100%',
                background: isLight ? '#f3f4f6' : 'rgba(10, 14, 26, 0.6)',
                border: `1px solid ${
                  isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)'
                }`,
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                color: isLight ? '#1f2937' : '#fff',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            onClick={() => {
              onSelect('ANY');
              setOpen(false);
              setSearch('');
            }}
            style={{
              ...itemStyle(selected === 'ANY'),
              borderBottom: `1px solid rgba(168, 85, 247, 0.15)`,
            }}
          >
            <span
              style={{
                fontSize: '18px',
                width: '22px',
                textAlign: 'center',
              }}
            >
              🌍
            </span>
            <span style={{ flex: 1 }}>{t('country.any')}</span>
          </button>

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <p
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: isLight ? '#6b7280' : '#6b7280',
                  fontSize: '12px',
                }}
              >
                {t('country.none')}
              </p>
            )}
            {filtered.map((c) => {
              const CountryFlag = Flags[c.code];
              const isSelected = selected === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => {
                    onSelect(c.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  style={itemStyle(isSelected)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(168, 85, 247, 0.1)')
                  }
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected
                      ? 'rgba(168, 85, 247, 0.2)'
                      : 'transparent';
                  }}
                >
                  {CountryFlag ? (
                    <CountryFlag
                      style={{
                        width: '22px',
                        height: '15px',
                        borderRadius: '2px',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '22px',
                        height: '15px',
                        background: '#374151',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      color: isLight ? '#6b7280' : '#6b7280',
                      fontSize: '11px',
                    }}
                  >
                    +{c.dialCode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}