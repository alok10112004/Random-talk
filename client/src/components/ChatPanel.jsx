import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ messages, onSend, connected, onClose }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;
    onSend(input.trim());
    setInput('');
  };

  const hasUserMessages = messages.some((m) => m.from !== 'system');

  return (
    <aside
      className="chat-panel"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
        zIndex: 10,
        position: 'relative',
      }}
    >
      <div className="chat-panel-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <h3 className="chat-panel-title" style={{ color: '#333', fontWeight: 'bold' }}>
          Chat
        </h3>
        <button onClick={onClose} style={{ color: '#666', fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }}>
          ✕
        </button>
      </div>

      <div className="chat-messages" style={{ background: 'rgba(255,255,255,0.4)' }}>
        {messages.map((m, i) => {
          // "Stranger is from India 🇮🇳" jaisi system line
          if (m.from === 'system') {
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    background: 'rgba(0,0,0,0.06)',
                    color: '#4b5563',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <span>{m.text}</span>
                  {m.code && (
                    <img
                      src={`https://flagcdn.com/w40/${String(m.code).toLowerCase()}.png`}
                      alt={m.code}
                      width="22"
                      height="16"
                      style={{ borderRadius: '2px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '8px 14px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  background: m.from === 'me' ? 'linear-gradient(135deg, #ff6b9d, #ff477e)' : '#e5e7eb',
                  color: m.from === 'me' ? '#fff' : '#1f2937',
                  borderBottomRightRadius: m.from === 'me' ? '4px' : '16px',
                  borderBottomLeftRadius: m.from === 'me' ? '16px' : '4px',
                  boxShadow: m.from === 'me' ? '0 4px 10px rgba(255, 71, 126, 0.3)' : 'none',
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {!hasUserMessages && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '20px' }}>
            <p>No messages yet</p>
            <p style={{ marginTop: '4px' }}>Say hi 👋</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="chat-input-form"
        onSubmit={handleSubmit}
        style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={connected ? 'Write a message...' : 'Waiting for stranger...'}
            disabled={!connected}
            style={{
              flex: 1,
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              color: '#333',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!connected || !input.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: connected && input.trim() ? 'linear-gradient(135deg, #ff6b9d, #ff477e)' : '#e5e7eb',
              color: connected && input.trim() ? '#fff' : '#9ca3af',
              border: 'none',
              cursor: connected && input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ➤
          </button>
        </div>
      </form>
    </aside>
  );
}