import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import TermsModal from '../components/TermsModal';

const MAX_INTERESTS = 5;

export default function Landing() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('terms');

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleAddInterest = () => {
    const value = inputValue.trim().toLowerCase().replace(/^#/, '');
    if (!value) return;
    if (interests.length >= MAX_INTERESTS) {
      setError(t('landing.interests.max'));
      setTimeout(() => setError(''), 2500);
      return;
    }
    if (interests.includes(value)) {
      setError(t('landing.interests.exists'));
      setTimeout(() => setError(''), 2500);
      return;
    }
    setInterests([...interests, value]);
    setInputValue('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };

  const handleRemoveInterest = (tag) => {
    setInterests(interests.filter((i) => i !== tag));
  };

  const handleStart = () => {
    if (!termsAccepted) return;

    if (interests.length > 0) {
      sessionStorage.setItem('interests', interests.join(','));
    } else {
      sessionStorage.removeItem('interests');
    }

    localStorage.setItem('acceptedTerms', 'true');
    localStorage.setItem('acceptedTermsAt', new Date().toISOString());

    navigate('/chat');
  };

  return (
    <div className="landing-root">
      <div className="landing-bg-orb landing-bg-orb-1" />
      <div className="landing-bg-orb landing-bg-orb-2" />

      <div className="landing-card">
        <div className="landing-logo">
          <img src="/logo.png" alt="Random Talk" className="landing-logo-img" />
          <p className="landing-logo-tagline">Talk to strangers. Anonymously.</p>
        </div>

        <div className="landing-content">
          <p>{t('landing.welcome.p1')}</p>
          <p>{t('landing.welcome.p2')}</p>
          <p className="landing-highlight">{t('landing.age.warning')}</p>
        </div>

        <div className="landing-warning">
          <span className="landing-warning-icon">⚠</span>
          <span>{t('landing.monitored')}</span>
        </div>

        {/* Interests Section */}
        <div className="landing-form">
          <label className="landing-label">{t('landing.interests.title')}</label>

          {/* Tags display */}
          {interests.length > 0 && (
            <div className="interest-tags">
              {interests.map((tag) => (
                <span key={tag} className="interest-tag">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(tag)}
                    className="interest-tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="landing-form-row">
            <input
              type="text"
              className="landing-input"
              placeholder={t('landing.interests.placeholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              disabled={interests.length >= MAX_INTERESTS}
            />
            <button
              type="button"
              onClick={handleAddInterest}
              className="landing-add-btn"
              disabled={!inputValue.trim() || interests.length >= MAX_INTERESTS}
            >
              + Add
            </button>
          </div>

          <p className="landing-hint">{t('landing.interests.hint')}</p>

          {error && <div className="landing-error">{error}</div>}
        </div>

        {/* Terms Checkbox */}
        <div className="landing-terms-check">
          <label className="landing-checkbox-label">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="landing-checkbox"
            />
            <span className="landing-checkbox-text">
              {t('landing.terms.check')}
            </span>
          </label>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="landing-btn-full"
          disabled={!termsAccepted}
        >
          {t('landing.start')} →
        </button>

        <div className="landing-footer">
          <span>© {new Date().getFullYear()} Random Talk</span>
          <span className="landing-footer-sep">·</span>
          <span className="landing-link" onClick={() => openModal('terms')}>
            {t('landing.footer.terms')}
          </span>
          <span className="landing-footer-sep">·</span>
          <span className="landing-link" onClick={() => openModal('privacy')}>
            {t('landing.footer.privacy')}
          </span>
          <span className="landing-footer-sep">·</span>
          <span className="landing-link" onClick={() => openModal('guidelines')}>
            {t('landing.footer.guidelines')}
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