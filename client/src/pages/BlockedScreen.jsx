import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BlockedScreen({ until, onExpire }) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(
    Math.max(0, until - Date.now())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const rem = Math.max(0, until - Date.now());
      setRemaining(rem);

      if (rem <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [until, onExpire]);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="blocked-screen">
      <div className="blocked-bg-orb blocked-bg-orb-1" />
      <div className="blocked-bg-orb blocked-bg-orb-2" />

      <div className="blocked-card">
        <div className="blocked-icon">🚫</div>

        <h1 className="blocked-title">You have been temporarily blocked</h1>

        <p className="blocked-desc">
          Your account has been reported multiple times for violating our
          community guidelines. You can use Random Talk again after the
          countdown ends.
        </p>

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

        <div className="blocked-notice">
          ⚠️ Repeated violations will result in a <b>permanent ban</b>.
        </div>

        <button
          onClick={() => navigate('/login')}
          className="blocked-logout-btn"
        >
          Logout
        </button>
      </div>
    </div>
  );
}