import { useLanguage } from '../context/LanguageContext';

export default function LoadingOverlay({ type }) {
  const { t } = useLanguage();

  const CONFIG = {
    starting: {
      text: t('loading.starting'),
      icon: '🎥',
      showTip: false,
    },
    waiting: {
      text: t('loading.waiting'),
      icon: '🔍',
      showTip: true,
    },
    connecting: {
      text: t('loading.connecting'),
      icon: '🔌',
      showTip: false,
    },
  };

  const config = CONFIG[type] || CONFIG.waiting;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-icon-pulse">{config.icon}</div>

        <div className="loading-spinner">
          <div className="loading-spinner-ring" />
        </div>

        <div className="loading-text">{config.text}</div>

        <div className="loading-dots">
          <span />
          <span />
          <span />
        </div>

        {config.showTip && (
          <div className="loading-tip">
            <span className="loading-tip-icon">💡</span>
            <span>{t('loading.tip')}</span>
          </div>
        )}
      </div>
    </div>
  );
}