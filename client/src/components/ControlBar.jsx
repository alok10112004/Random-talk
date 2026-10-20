import { useState } from 'react';
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

  // Common base — same colors, 3D effect, bigger font
  const base = {
    height: '64px',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '0 26px',
    minWidth: '150px',
    border: 'none',
    color: '#fff',
    transition: 'all 0.12s ease',
    textShadow: '0 1px 2px rgba(0,0,0,0.25)',
    letterSpacing: '0.3px',
  };

  // GREEN — same as #6ec89d with 3D
  const btnGreen = {
    ...base,
    background: 'linear-gradient(180deg, #8edcb5 0%, #6ec89d 50%, #56b185 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.4), 0 5px 0 #3f8f66, 0 8px 16px rgba(0,0,0,0.35)',
  };

  // ORANGE — same as #f08060 with 3D
  const btnOrange = {
    ...base,
    background: 'linear-gradient(180deg, #ffa285 0%, #f08060 50%, #d4654a 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.4), 0 5px 0 #a84a35, 0 8px 16px rgba(0,0,0,0.35)',
  };

  // RED — same as #ef4444 with 3D
  const btnRed = {
    ...base,
    minWidth: '130px',
    padding: '0 22px',
    background: 'linear-gradient(180deg, #ff6b6b 0%, #ef4444 50%, #c72828 100%)',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.4), 0 5px 0 #9a1e1e, 0 8px 16px rgba(0,0,0,0.35)',
  };

  // Disabled
  const disabledStyle = {
    opacity: 0.55,
    cursor: 'not-allowed',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 0 rgba(0,0,0,0.2)',
    transform: 'none',
  };

  return (
    <div className="control-bar">
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

      <button
        onClick={onStop}
        disabled={status === 'idle'}
        style={{
          ...btnOrange,
          ...(status === 'idle' ? disabledStyle : {}),
        }}
      >
        ⏹ {t('control.stop')}
      </button>

      <CountrySelector selected={country} onSelect={onCountryChange} />

      <GenderSelector selected={gender} onSelect={setGender} />

      <button onClick={onReport} style={btnRed} title={t('control.report')}>
        🚩 {t('control.report')}
      </button>
    </div>
  );
}