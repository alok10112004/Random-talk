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
    if (result.success) navigate('/login');
  };

  const initial = user?.displayName
    ? user.displayName[0].toUpperCase()
    : user?.email?.[0].toUpperCase() || '?';

  return (
    <>
      <header className="topbar">
        {/* Left: Logo Image */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Random Talk"
            style={{
              height: '42px',
              width: 'auto',
              borderRadius: '8px',
              filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))',
            }}
          />

          {/* Online count — desktop */}
          {onlineCount > 0 && (
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#10b981' }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: '#6ee7b7' }}
              >
                {onlineCount} online
              </span>
            </div>
          )}
        </div>

        {/* Right: Status + Online (mobile) + Chat + Help + Avatar */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Online count — mobile */}
          {onlineCount > 0 && (
            <div
              className="flex md:hidden items-center gap-1.5 px-2 py-1 rounded-full"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#10b981' }}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: '#6ee7b7' }}
              >
                {onlineCount}
              </span>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-red-400">
                {t('topbar.live')}
              </span>
            </div>
          )}
          {status === 'waiting' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-xs font-semibold text-yellow-400">
                {t('topbar.searching')}
              </span>
            </div>
          )}

          {/* Chat toggle — 3D SVG */}
          <button
            onClick={onToggleChat}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: chatOpen
                ? 'rgba(168, 85, 247, 0.2)'
                : 'rgba(31, 37, 52, 0.8)',
              border: chatOpen
                ? '1px solid rgba(168, 85, 247, 0.5)'
                : '1px solid rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            title={chatOpen ? 'Hide chat' : 'Show chat'}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5BA3F5" />
                  <stop offset="100%" stopColor="#2B6FD4" />
                </linearGradient>
                <linearGradient id="smallBubbleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
              <path
                d="M30 8C16 8 4 17 4 28C4 33.8 7.4 39 13 42.6C12.8 45.6 12 48.6 10.6 51C10.2 51.8 11 52.6 11.8 52.2C16.4 50 20 48.2 22.6 46.8C25.2 47.4 27.6 47.8 30 47.8C44 47.8 56 38.8 56 28C56 17 44 8 30 8Z"
                fill="url(#bubbleGrad)"
              />
              <circle cx="20" cy="28" r="3.5" fill="#ffffff" />
              <circle cx="30" cy="28" r="3.5" fill="#ffffff" />
              <circle cx="40" cy="28" r="3.5" fill="#ffffff" />
              <path
                d="M46 34C40.5 34 36 37.6 36 42C36 44.6 37.7 46.8 40 48.2C39.9 49.6 39.5 50.9 38.9 52.1C38.7 52.5 39.1 52.9 39.5 52.7C41.5 51.8 43 50.9 44.1 50.4C44.7 50.5 45.3 50.6 46 50.6C51.5 50.6 56 47 56 42C56 37.6 51.5 34 46 34Z"
                fill="url(#smallBubbleGrad)"
              />
              <circle cx="41" cy="42" r="2" fill="#4285F4" />
              <circle cx="46" cy="42" r="2" fill="#4285F4" />
              <circle cx="51" cy="42" r="2" fill="#4285F4" />
            </svg>
          </button>

          {/* Help */}
          <button
            onClick={onHelp}
            className="w-9 h-9 rounded-lg bg-[#1f2534] hover:bg-[#2a3142] flex items-center justify-center text-gray-400 hover:text-white transition font-bold"
          >
            ?
          </button>

          {/* Avatar */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform overflow-hidden shadow-lg shadow-purple-500/30"
            >
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                initial
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-[#131823] border border-[#1f2534] rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-[#1f2534]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                      {currentAvatar ? (
                        <img
                          src={currentAvatar}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1f2534] transition text-left text-sm text-gray-300"
                  >
                    👤 {t('dropdown.profile')}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1f2534] transition text-left text-sm text-gray-300"
                  >
                    ⚙️ {t('dropdown.settings')}
                  </button>
                </div>

                <div className="p-2 border-t border-[#1f2534]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition text-left text-sm text-red-400 font-medium"
                  >
                    🚪 {t('dropdown.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}