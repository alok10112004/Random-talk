import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function TopBar({
  status,
  onlineCount = 0,
  onHelp,
  onToggleChat,
  chatOpen,
}) {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <header
      className="topbar"
      style={{
        background: 'rgba(20, 10, 30, 0.6)', // Dark Glass Background
        backdropFilter: 'blur(15px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
              style={{ color: '#6ee7b7' }}
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
            <span className="text-xs font-semibold text-red-400">LIVE</span>
          </div>
        )}
        {status === 'waiting' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs font-semibold text-yellow-400">SEARCHING</span>
          </div>
        )}

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: chatOpen ? 'rgba(255, 105, 180, 0.4)' : 'rgba(255, 255, 255, 0.15)',
            border: chatOpen ? '1px solid rgba(255, 105, 180, 0.8)' : '1px solid rgba(255, 255, 255, 0.2)',
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
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
      </div>
    </header>
  );
}