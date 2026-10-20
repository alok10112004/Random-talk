import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsModal({ open, onClose }) {
  const { language, theme, changeLanguage, changeTheme, t } = useLanguage();

  const [tempTheme, setTempTheme] = useState(theme);
  const [tempLang, setTempLang] = useState(language);

  // Modal khulte hi current values load karo
  useEffect(() => {
    if (open) {
      setTempTheme(theme);
      setTempLang(language);
    }
  }, [open, theme, language]);

  if (!open) return null;

  const handleSave = () => {
    changeTheme(tempTheme);
    changeLanguage(tempLang);
    onClose();
  };

  const handleClose = () => {
    setTempTheme(theme);
    setTempLang(language);
    onClose();
  };

  return (
    <div className="settings-modal-overlay" onClick={handleClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">⚙️ {t('settings.title')}</h2>
          <button className="settings-modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="settings-modal-body">
          {/* Theme */}
         {/* Theme — Light hidden */}
<div className="settings-section">
  <label className="settings-label">🎨 {t('settings.theme')}</label>
  <div className="settings-options">
    <button
      onClick={() => setTempTheme('dark')}
      className="settings-option settings-option-active"
      style={{ flex: 1 }}
    >
      🌙 {t('settings.theme.dark')}
    </button>
  </div>
</div>

          {/* Language */}
          <div className="settings-section">
            <label className="settings-label">🌐 {t('settings.language')}</label>
            <div className="settings-options">
              <button
                onClick={() => setTempLang('en')}
                className={`settings-option ${
                  tempLang === 'en' ? 'settings-option-active' : ''
                }`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setTempLang('hi')}
                className={`settings-option ${
                  tempLang === 'hi' ? 'settings-option-active' : ''
                }`}
              >
                🇮🇳 हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-modal-footer">
          <button className="settings-btn-cancel" onClick={handleClose}>
            {t('report.cancel')}
          </button>
          <button className="settings-btn-save" onClick={handleSave}>
            {t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}