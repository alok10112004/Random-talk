export default function WarningModal({ open, level, message, detail, onClose }) {
  if (!open) return null;

  const LEVELS = {
    1: {
      icon: 'ℹ️',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.1)',
      border: 'rgba(251, 191, 36, 0.4)',
      button: 'I Understand',
    },
    2: {
      icon: '⚠️',
      color: '#fb923c',
      bg: 'rgba(251, 146, 60, 0.1)',
      border: 'rgba(251, 146, 60, 0.4)',
      button: 'I Understand',
    },
    3: {
      icon: '🚨',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.5)',
      button: 'I Understand — This is my last warning',
    },
  };

  const config = LEVELS[level] || LEVELS[1];

  return (
    <div className="warning-modal-overlay">
      <div
        className="warning-modal"
        style={{
          borderColor: config.border,
          boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 60px ${config.bg}`,
        }}
      >
        <div className="warning-icon" style={{ color: config.color }}>
          {config.icon}
        </div>

        <h2 className="warning-title" style={{ color: config.color }}>
          {message}
        </h2>

        <p className="warning-detail">{detail}</p>

        {level === 3 && (
          <div className="warning-danger">
            ⚠️ If you receive <b>1 more report</b>, your account will be
            temporarily banned for <b>1 to 5 hours</b>.
          </div>
        )}

        <button
          className="warning-btn"
          style={{
            background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)`,
          }}
          onClick={onClose}
        >
          {config.button}
        </button>
      </div>
    </div>
  );
}