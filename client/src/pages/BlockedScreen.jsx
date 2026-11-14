import { useState, useEffect } from 'react';

const APPEAL_EMAIL ='alok10112004@gmail.com'; // 🔥 apna appeal email yahan daalo

const REASON_TEXT = {
  nudity: 'nudity or sexual content',
  minor: 'content involving minors',
  harassment: 'harassment or abusive behavior',
  violence: 'violence',
  spam: 'spam',
};

export default function BlockedScreen({ until, reason, permanent, onExpire }) {
  const [remaining, setRemaining] = useState(Math.max(0, until - Date.now()));

  useEffect(() => {
    if (permanent) return undefined;
    const interval = setInterval(() => {
      const rem = Math.max(0, until - Date.now());
      setRemaining(rem);
      if (rem <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [until, permanent, onExpire]);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  const pad = (n) => String(n).padStart(2, '0');

  let deviceId = '';
  try { deviceId = localStorage.getItem('rt_device_id') || ''; } catch (e) {}

  const mailHref =
    `mailto:${APPEAL_EMAIL}` +
    `?subject=${encodeURIComponent('Ban appeal - Random Talk')}` +
    `&body=${encodeURIComponent(
      `Hello,\n\nI would like to appeal my ban.\n\nDevice ID: ${deviceId}\n\nWhat happened:\n`
    )}`;

  return (
    <div className="blocked-screen">
      <div className="blocked-bg-orb blocked-bg-orb-1" />
      <div className="blocked-bg-orb blocked-bg-orb-2" />

      <div className="blocked-card">
        <div className="blocked-icon">🚫</div>

        <h1 className="blocked-title">
          {permanent ? 'You have been permanently banned' : 'You have been temporarily blocked'}
        </h1>

        <p className="blocked-desc">
          Your access was restricted after reports for{' '}
          <b>{REASON_TEXT[reason] || 'violating our community guidelines'}</b>.
          {permanent
            ? ' This ban does not expire.'
            : ' You can use Random Talk again after the countdown ends.'}
        </p>

        {!permanent && (
          <div className="blocked-timer">
            <div className="blocked-timer-label">Time remaining</div>
            <div className="blocked-timer-display">
              <span className="blocked-time-unit">
                <span className="blocked-time-value">{pad(hours)}</span>
                <span className="blocked-time-label">HRS</span>
              </span>
              <span className="blocked-time-sep">:</span>
              <span className="blocked-time-unit">
                <span className="blocked-time-value">{pad(minutes)}</span>
                <span className="blocked-time-label">MIN</span>
              </span>
              <span className="blocked-time-sep">:</span>
              <span className="blocked-time-unit">
                <span className="blocked-time-value">{pad(seconds)}</span>
                <span className="blocked-time-label">SEC</span>
              </span>
            </div>
          </div>
        )}

        <div className="blocked-notice">
          ⚠️ Repeated violations will result in a <b>permanent ban</b>.
        </div>

        <a href={mailHref} className="blocked-logout-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
          Think this is a mistake? Appeal by email
        </a>
      </div>
    </div>
  );
}