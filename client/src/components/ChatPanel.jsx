import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Country names dictionary (copy from Home.jsx)
const COUNTRY_NAMES = {
  ANY: { name: 'Any Country', flag: '🌍' },
  IN: { name: 'India', flag: '🇮🇳' },
  US: { name: 'United States', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  BR: { name: 'Brazil', flag: '🇧🇷' },
  PK: { name: 'Pakistan', flag: '🇵🇰' },
  BD: { name: 'Bangladesh', flag: '🇧🇩' },
  NP: { name: 'Nepal', flag: '🇳🇵' },
  LK: { name: 'Sri Lanka', flag: '🇱🇰' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  AU: { name: 'Australia', flag: '🇦🇺' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  FR: { name: 'France', flag: '🇫🇷' },
  JP: { name: 'Japan', flag: '🇯🇵' },
  CN: { name: 'China', flag: '🇨🇳' },
  RU: { name: 'Russia', flag: '🇷🇺' },
  ID: { name: 'Indonesia', flag: '🇮🇩' },
  PH: { name: 'Philippines', flag: '🇵🇭' },
  VN: { name: 'Vietnam', flag: '🇻🇳' },
  TH: { name: 'Thailand', flag: '🇹🇭' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦' },
  AE: { name: 'UAE', flag: '🇦🇪' },
  EG: { name: 'Egypt', flag: '🇪🇬' },
  NG: { name: 'Nigeria', flag: '🇳🇬' },
  ZA: { name: 'South Africa', flag: '🇿🇦' },
  MX: { name: 'Mexico', flag: '🇲🇽' },
  AR: { name: 'Argentina', flag: '🇦🇷' },
  ES: { name: 'Spain', flag: '🇪🇸' },
  IT: { name: 'Italy', flag: '🇮🇹' },
  NL: { name: 'Netherlands', flag: '🇳🇱' },
  TR: { name: 'Turkey', flag: '🇹🇷' },
  KR: { name: 'South Korea', flag: '🇰🇷' },
  MY: { name: 'Malaysia', flag: '🇲🇾' },
  SG: { name: 'Singapore', flag: '🇸🇬' },
  IR: { name: 'Iran', flag: '🇮🇷' },
  IQ: { name: 'Iraq', flag: '🇮🇶' },
  AF: { name: 'Afghanistan', flag: '🇦🇫' },
  NZ: { name: 'New Zealand', flag: '🇳🇿' },
  IE: { name: 'Ireland', flag: '🇮🇪' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
  CH: { name: 'Switzerland', flag: '🇨🇭' },
  SE: { name: 'Sweden', flag: '🇸🇪' },
  NO: { name: 'Norway', flag: '🇳🇴' },
  PL: { name: 'Poland', flag: '🇵🇱' },
  UA: { name: 'Ukraine', flag: '🇺🇦' },
  KE: { name: 'Kenya', flag: '🇰🇪' },
  GH: { name: 'Ghana', flag: '🇬🇭' },
};

export default function ChatPanel({
  messages,
  onSend,
  connected,
  onClose,
  isMobile,
  partnerCountry,
  onReportAbuse // 👈 Abhi use nahi karenge but future proof
}) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;
    onSend(input.trim());
    setInput('');
  };

  // Country Info
  const countryInfo = partnerCountry ? (COUNTRY_NAMES[partnerCountry] || { name: partnerCountry, flag: '🌍' }) : null;

  return (
    <aside className="chat-panel">
      <div className="chat-panel-header">
        <h3 className="chat-panel-title">{t('panel.title')}</h3>
        <button onClick={onClose} className="chat-panel-close">
          ✕
        </button>
      </div>

      {/* 👇 Connection Banner */}
      {connected && countryInfo && (
        <div className="chat-connection-banner">
          <div className="chat-connection-icon">🎙️</div>
          <div className="chat-connection-text">
            <div className="chat-connection-title">Connection established</div>
            <div className="chat-connection-country">
              {countryInfo.flag} {countryInfo.name}
            </div>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>{t('panel.empty')}</p>
            <p>{t('panel.empty.sub')}</p>
          </div>
        )}
        {messages.map((m, i) => {
          if (m.from === 'system') {
            return (
              <div key={i} className="chat-msg-system">
                {m.text}
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`chat-msg ${m.from === 'me' ? 'chat-msg-me' : 'chat-msg-stranger'}`}
            >
              {m.text}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            connected ? t('panel.input.placeholder') : t('panel.input.waiting')
          }
          disabled={!connected}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!connected || !input.trim()}
        >
          ➤
        </button>
      </form>
    </aside>
  );
}