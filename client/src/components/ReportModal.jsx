import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const REASONS = [
  { id: 'nudity', labelKey: 'report.reason.nudity' },
  { id: 'harassment', labelKey: 'report.reason.harassment' },
  { id: 'minor', labelKey: 'report.reason.minor' },
  { id: 'violence', labelKey: 'report.reason.violence' },
  { id: 'spam', labelKey: 'report.reason.spam' },
];

export default function ReportModal({
  open,
  onClose,
  onSubmit,
  partners = [],
  currentPartnerId,
}) {
  const { t } = useLanguage();
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedPartner(currentPartnerId || (partners[0]?.id ?? null));
      setSelectedReason(null);
    }
  }, [open, currentPartnerId, partners]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!selectedPartner || !selectedReason) return;
    setSubmitting(true);
    await onSubmit({ partnerId: selectedPartner, reason: selectedReason });
    setSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    setSelectedPartner(null);
    setSelectedReason(null);
    onClose();
  };

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div
        className="report-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="report-modal-header">
          <h2 className="report-modal-title">{t('report.title')}</h2>
          <button className="report-modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="report-modal-body">
          {partners.length > 0 ? (
            <>
              <p className="report-modal-desc">{t('report.select.user')}</p>

              <div className="report-partners">
                {partners.map((p, idx) => {
                  const isActive = selectedPartner === p.id;
                  const isCurrent = p.id === currentPartnerId;
                  return (
                    <button
                      key={`${p.id}-${idx}`}
                      onClick={() => setSelectedPartner(p.id)}
                      className={`report-partner ${
                        isActive ? 'report-partner-active' : ''
                      }`}
                    >
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={`Partner ${idx + 1}`}
                          className="report-partner-img"
                        />
                      ) : (
                        <div className="report-partner-placeholder" />
                      )}
                      {isCurrent && (
                        <span className="report-partner-badge">
                          {t('report.badge.now')}
                        </span>
                      )}
                      {isActive && (
                        <span className="report-partner-check">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="report-modal-desc">{t('report.no.users')}</p>
          )}

          <p className="report-modal-desc" style={{ marginTop: '20px' }}>
            {t('report.why')}
          </p>

          <div className="report-reasons">
            {REASONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReason(r.id)}
                className={`report-reason ${
                  selectedReason === r.id ? 'report-reason-active' : ''
                }`}
              >
                <span className="report-reason-label">{t(r.labelKey)}</span>
                {selectedReason === r.id && (
                  <span className="report-reason-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="report-modal-footer">
          <button className="report-btn-cancel" onClick={handleClose}>
            {t('report.cancel')}
          </button>
          <button
            className="report-btn-submit"
            onClick={handleSubmit}
            disabled={!selectedPartner || !selectedReason || submitting}
          >
            {submitting ? t('report.submitting') : t('report.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}