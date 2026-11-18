import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function MobileChat({ messages, onSend, connected, onClose }) {
  const [input, setInput] = useState('');
  const listRef = useRef(null);
  const [vp, setVp] = useState(() => ({
    h: typeof window !== 'undefined' ? window.innerHeight : 700,
    kb: 0,
  }));

  // Keyboard khulne par chat box keyboard ke upar rahe
  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => {
      if (vv) {
        setVp({
          h: Math.round(vv.height),
          kb: Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)),
        });
      } else {
        setVp({ h: window.innerHeight, kb: 0 });
      }
    };
    update();
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
    };
  }, []);

  // Naya message aane par neeche tak scroll
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, vp.kb]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;
    onSend(input.trim());
    setInput('');
  };

  const hasUserMessages = messages.some((m) => m.from !== 'system');
  const panelH = Math.max(230, Math.min(Math.round(vp.h * 0.5), vp.h - 90));
  const canSend = connected && input.trim();

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: vp.kb,
        height: panelH,
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(to top, rgba(8,10,22,0.86), rgba(8,10,22,0.62))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTopLeftRadius: '18px',
        borderTopRightRadius: '18px',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.35)',
        paddingBottom: vp.kb > 0 ? 0 : 'env(safe-area-inset-bottom, 0px)',
        boxSizing: 'border-box',
      }}
    >
      {/* Header: title + close (✕) */}
      <div
        style={{
          flex: '0 0 auto',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Chat</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.16)',
            color: '#fff',
            fontSize: '18px',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.map((m, i) => {
          if (m.from === 'system') {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.14)',
                    color: '#f3f4f6',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <span>{m.text}</span>
                  {m.code && (
                    <img
                      src={`https://flagcdn.com/w40/${String(m.code).toLowerCase()}.png`}
                      alt={m.code}
                      width="20"
                      height="14"
                      style={{ borderRadius: '2px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
            );
          }

          const mine = m.from === 'me';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '78%',
                  padding: '8px 13px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                  background: mine ? 'linear-gradient(135deg, #ff6b9d, #ff477e)' : 'rgba(255,255,255,0.92)',
                  color: mine ? '#fff' : '#1f2937',
                  borderBottomRightRadius: mine ? '4px' : '16px',
                  borderBottomLeftRadius: mine ? '16px' : '4px',
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {!hasUserMessages && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '10px' }}>
            {connected ? 'Say hi 👋' : 'Waiting for stranger...'}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px 10px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={connected ? 'Write a message...' : 'Waiting for stranger...'}
          disabled={!connected}
          maxLength={500}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'rgba(255,255,255,0.95)',
            border: 'none',
            color: '#111',
            borderRadius: '22px',
            padding: '11px 16px',
            fontSize: '16px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={!canSend}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: canSend ? 'linear-gradient(135deg, #ff6b9d, #ff477e)' : 'rgba(255,255,255,0.25)',
            color: '#fff',
            fontSize: '18px',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ➤
        </button>
      </form>
    </div>,
    document.body
  );
}