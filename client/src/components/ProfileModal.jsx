import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ open, onClose }) {
  const { user, customAvatar, currentAvatar, saveCustomAvatar, resetCustomAvatar } = useAuth();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!open) return null;

  const initial = user?.displayName
    ? user.displayName[0].toUpperCase()
    : user?.email?.[0].toUpperCase() || '?';

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Check type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Check size — 500 KB
    if (file.size > 500 * 1024) {
      setError('Image too large. Max 500 KB');
      return;
    }

    // Read and preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (preview) {
      saveCustomAvatar(preview);
    }
    setPreview(null);
    setError('');
    onClose();
  };

  const handleReset = () => {
    resetCustomAvatar();
    setPreview(null);
    setError('');
  };

  const handleClose = () => {
    setPreview(null);
    setError('');
    onClose();
  };

  const displayAvatar = preview || currentAvatar;

  return (
    <div className="profile-modal-overlay" onClick={handleClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">👤 Profile</h2>
          <button className="profile-modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="profile-modal-body">
          {/* Avatar preview */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="avatar"
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-placeholder">{initial}</div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <div className="profile-avatar-buttons">
              <button
                className="profile-btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 {currentAvatar ? 'Change Photo' : 'Upload Photo'}
              </button>

              {customAvatar && (
                <button
                  className="profile-btn-secondary"
                  onClick={handleReset}
                >
                  ↩️ Reset to Google
                </button>
              )}
            </div>

            {error && <div className="profile-error">{error}</div>}

            <p className="profile-hint">
              Max 500 KB · JPG / PNG
            </p>
          </div>

          {/* User info */}
          <div className="profile-info">
            <div className="profile-info-row">
              <span className="profile-info-label">Name</span>
              <span className="profile-info-value">
                {user?.displayName || 'User'}
              </span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Email</span>
              <span className="profile-info-value">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="profile-modal-footer">
          <button className="profile-btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="profile-btn-save"
            onClick={handleSave}
            disabled={!preview}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}