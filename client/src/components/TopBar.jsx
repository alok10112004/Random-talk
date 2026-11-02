import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';

export default function TopBar({
  status,
  onlineCount = 0,
  onHelp,
  onToggleChat,
  chatOpen,
}) {
  const { user, logout, currentAvatar } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) navigate('/landing');
  };

  const initial = user?.displayName
    ? user.displayName[0].toUpperCase()
    : user?.email?.[0].toUpperCase() || '?';

  return (
    <>
      <header
        className="topbar"
        style={{
          background: 'rgba(255, 255, 255, 0.15)', // Pink/White Glass
          backdropFilter: 'blur(15px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Random Talk"
            style={{
              height: '42px',
              width: 'auto',
              borderRadius: '8px',
              filter: 'drop-shadow(0 0 8px rgba(255, 105, 180, 0.5))',
            }}
          />

          {/* Online count */}
          {onlineCount > 0 && (
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#10b981' }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: '#065f46' }} // Dark green text
              >
                {onlineCount} online
              </span>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Status Pill */}
          {status === 'connected' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-red-700">LIVE</span>
            </div>
          )}
          {status === 'waiting' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-xs font-semibold text-yellow-700">SEARCHING</span>
            </div>
          )}

          {/* Chat Toggle */}
          <button
            onClick={onToggleChat}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: chatOpen ? 'rgba(255, 105, 180, 0.4)' : 'rgba(255, 255, 255, 0.2)',
              border: chatOpen ? '1px solid rgba(255, 105, 180, 0.8)' : '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: '#fff',
            }}
          >
            💬
          </button>

          {/* Help */}
          <button
            onClick={onHelp}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            ?
          </button>

          {/* Avatar */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff6b9d, #ff477e)',
                border: '2px solid rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(255, 71, 126, 0.4)',
              }}
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                className="absolute right-0 top-12 w-64 rounded-xl shadow-2xl overflow-hidden z-50"
                style={{
                  background: '#fff',
                  border: '1px solid #fbcfe8',
                }}
              >
                <div className="p-4 border-b border-pink-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                      {currentAvatar ? (
                        <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user?.displayName || 'Guest'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || 'Anonymous User'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-pink-50 transition text-left text-sm text-gray-700"
                  >
                    👤 Profile
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-pink-50 transition text-left text-sm text-gray-700"
                  >
                    ⚙️ Settings
                  </button>
                </div>

                <div className="p-2 border-t border-pink-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition text-left text-sm text-red-500 font-medium"
                  >
                    🚪 Exit / Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}