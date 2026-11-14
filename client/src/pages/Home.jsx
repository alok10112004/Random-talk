import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useWebRTC } from '../hooks/useWebRTC';
import TopBar from '../components/TopBar';
import ControlBar from '../components/ControlBar';
import ChatPanel from '../components/ChatPanel';
import HelpModal from '../components/HelpModal';
import ReportModal from '../components/ReportModal';
import WarningModal from '../components/WarningModal';
import LoadingOverlay from '../components/LoadingOverlay';
import SwipeWrapper from '../components/SwipeWrapper';
import BlockedScreen from './BlockedScreen';

// ---------- Country helpers ----------
const NO_COUNTRY = ['ANY', 'Any', 'any', 'Unknown', 'unknown', ''];

const ALIASES = {
  usa: 'US',
  'united states': 'US',
  'united states of america': 'US',
  uk: 'GB',
  'united kingdom': 'GB',
  'great britain': 'GB',
  uae: 'AE',
  dubai: 'AE',
  'united arab emirates': 'AE',
  russia: 'RU',
  'south korea': 'KR',
  korea: 'KR',
  'north korea': 'KP',
  vietnam: 'VN',
  turkey: 'TR',
  'türkiye': 'TR',
  iran: 'IR',
  syria: 'SY',
  'ivory coast': 'CI',
  laos: 'LA',
};

let NAME_MAP = null;
function getNameMap() {
  if (NAME_MAP) return NAME_MAP;
  NAME_MAP = {};
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    const A = 65;
    for (let i = 0; i < 26; i++) {
      for (let j = 0; j < 26; j++) {
        const code = String.fromCharCode(A + i, A + j);
        try {
          const name = dn.of(code);
          if (name && name !== code) NAME_MAP[name.toLowerCase()] = code;
        } catch (e) { /* invalid code */ }
      }
    }
  } catch (e) { /* Intl not supported */ }
  return NAME_MAP;
}

// "IN" / "India" / { code: "IN" } -> { code: "IN", name: "India" }
function resolveCountry(raw) {
  let v = raw;
  if (v && typeof v === 'object') {
    v = v.code || v.iso2 || v.cca2 || v.value || v.name || v.label || '';
  }
  v = String(v || '').trim();
  if (!v || NO_COUNTRY.includes(v)) return null;

  let code = null;
  if (/^[A-Za-z]{2}$/.test(v)) code = v.toUpperCase();
  else {
    const key = v.toLowerCase();
    code = ALIASES[key] || getNameMap()[key] || null;
  }
  if (code) {
    let name = code;
    try { name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch (e) {}
    return { code, name };
  }
  return { code: null, name: v };
}

function flagEmoji(code) {
  if (!code) return '';
  try {
    return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
  } catch (e) { return ''; }
}

export default function Home() {
  const socket = useSocket();
  const { user, loginAsGuest } = useAuth();
  const { t } = useLanguage();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(
    typeof window !== 'undefined' && window.innerWidth > 768
  );
  const [country, setCountry] = useState('ANY');
  const [interests, setInterests] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [blockedReason, setBlockedReason] = useState(null);
  const [blockedPermanent, setBlockedPermanent] = useState(false);
  const [warning, setWarning] = useState(null);
  const [partnerCountry, setPartnerCountry] = useState(null);
  const [partnerHistory, setPartnerHistory] = useState([]);
  const [countryBanner, setCountryBanner] = useState(null); // { text, code }
  const partnerHistoryRef = useRef([]);
  const currentPartnerRef = useRef(null);
  const reportFrameRef = useRef(null);
  const announceTimerRef = useRef(null);
  const announcedRoomRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    roomIdRef,
    pcRef,
    localStreamRef,
    createPeer,
    startLocalStream,
    handleSignal,
    makeOffer,
    cleanup,
  } = useWebRTC(socket);

  // Apni country server ko bhejo (reconnect par bhi dobara)
  useEffect(() => {
    if (!socket) return undefined;
    const send = () => {
      let value = 'ANY';
      if (typeof country === 'string') {
        value = country || 'ANY';
      } else {
        const r = resolveCountry(country);
        value = r ? r.code || r.name : 'ANY';
      }
      socket.emit('set-country', { country: value });
    };
    send();
    socket.on('connect', send);
    return () => socket.off('connect', send);
  }, [socket, country]);

  // ---- "Stranger is from ..." announcement ----
  const clearAnnounce = () => {
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
      announceTimerRef.current = null;
    }
    announcedRoomRef.current = null;
    setCountryBanner(null);
  };

  // 1 second stranger screen par dikhao, phir chat box me line (jab tak baat chale)
  const announcePartner = (roomId, info) => {
    if (!info || announcedRoomRef.current === roomId) return;
    announcedRoomRef.current = roomId;
      const chatText = `Stranger is from ${info.name}`;
    setCountryBanner({ text: chatText, code: info.code });
    announceTimerRef.current = setTimeout(() => {
      setCountryBanner(null);
      setMessages((prev) => [{ from: 'system', text: chatText, code: info.code }, ...prev]);
    }, 1000);
  };

  const captureThumbnail = () => {
    const video = remoteVideoRef.current;
    if (!video || !video.videoWidth) return null;
    try {
      const canvas = document.createElement('canvas');
      const size = 120;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const minSide = Math.min(vw, vh);
      const sx = (vw - minSide) / 2;
      const sy = (vh - minSide) / 2;
      ctx.drawImage(video, sx, sy, minSide, minSide, 0, 0, size, size);
      return canvas.toDataURL('image/jpeg', 0.6);
    } catch (err) { return null; }
  };

  // Larger frame used for report moderation checks
  const captureFrame = () => {
    const video = remoteVideoRef.current;
    if (!video || !video.videoWidth) return null;
    try {
      const w = Math.min(480, video.videoWidth);
      const h = Math.round((video.videoHeight / video.videoWidth) * w);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(video, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.6);
    } catch (err) { return null; }
  };

  const openReport = () => {
    reportFrameRef.current = captureFrame();
    setReportOpen(true);
  };

  const addPartnerToHistory = (partnerId) => {
    setTimeout(() => {
      const thumb = captureThumbnail();
      const partner = { id: partnerId, thumbnail: thumb, timestamp: Date.now() };
      const newHistory = [partner, ...partnerHistoryRef.current].slice(0, 5);
      partnerHistoryRef.current = newHistory;
      setPartnerHistory(newHistory);
    }, 2000);
  };

  const getInterestsArray = () => {
    return interests.split(',').map((i) => i.trim()).filter(Boolean);
  };

  useEffect(() => {
    if (!socket) return;
    if (user?.uid) socket.emit('identify', { userId: user.uid });
    const onWaiting = () => { setStatus('waiting'); setPartnerCountry(null); };
    const onMatched = async ({ roomId, partnerId, initiator, partnerCountry }) => {
      clearAnnounce();
      roomIdRef.current = roomId;
      currentPartnerRef.current = partnerId;
      setStatus('connecting');
      setMessages([]);
      setPartnerCountry(partnerCountry || 'ANY');
      const info = resolveCountry(partnerCountry);
      let localStream = localStreamRef.current;
      if (!localStream) {
        localStream = await startLocalStream();
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      }
      const pc = createPeer((remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        addPartnerToHistory(partnerId);
        setStatus('connected');
        if (info) announcePartner(roomId, info);
      });
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
      if (initiator) await makeOffer();
    };
    const onSignal = ({ data }) => handleSignal(data);
    const onPartnerDisconnected = () => {
      clearAnnounce();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setStatus('waiting');
      setMessages([]);
      setPartnerCountry(null);
    };
    const onChat = ({ message }) => {
      setMessages((prev) => [...prev, { from: 'stranger', text: message }]);
      if (isMobile) setShowChat(true);
    };
    const onReportReceived = () => showToast(t('report.toast'));
    const onOnlineCount = (count) => setOnlineCount(count);
    const onBlocked = ({ until, reason, permanent }) => {
      setBlockedReason(reason || null);
      setBlockedPermanent(!!permanent);
      setBlockedUntil(until);
    };
    const onReportAction = () => showToast('Action has been taken on your report. Thank you.');
    const onWarning = (data) => setWarning(data);
    const onMessageBlocked = () =>
      showToast('Message blocked: links and inappropriate words are not allowed.');
    const onOutdated = () => alert('This page is outdated. Please refresh it (Ctrl + Shift + R).');

    socket.on('waiting', onWaiting); socket.on('matched', onMatched); socket.on('signal', onSignal);
    socket.on('partner-left', onPartnerDisconnected);
    socket.on('partner-disconnected', onPartnerDisconnected);
    socket.on('chat-message', onChat);
    socket.on('report-received', onReportReceived); socket.on('online-count', onOnlineCount);
    socket.on('you-are-blocked', onBlocked); socket.on('warning', onWarning);
    socket.on('message-blocked', onMessageBlocked); socket.on('outdated-client', onOutdated);
    socket.on('report-action', onReportAction);
    return () => {
      socket.off('waiting', onWaiting); socket.off('matched', onMatched); socket.off('signal', onSignal);
      socket.off('partner-left', onPartnerDisconnected);
      socket.off('partner-disconnected', onPartnerDisconnected);
      socket.off('chat-message', onChat);
      socket.off('report-received', onReportReceived); socket.off('online-count', onOnlineCount);
      socket.off('you-are-blocked', onBlocked); socket.off('warning', onWarning);
      socket.off('message-blocked', onMessageBlocked); socket.off('outdated-client', onOutdated);
      socket.off('report-action', onReportAction);
    };
  }, [socket, cleanup, createPeer, handleSignal, makeOffer, roomIdRef, startLocalStream, localStreamRef, isMobile, t, user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const isAgeOk = () => {
    try { return localStorage.getItem('rt_age_ok') === '1'; } catch (e) { return false; }
  };

  const startChat = async () => {
    if (!socket) return;
    if (!user) {
      try { await loginAsGuest(); } catch (err) { alert('Guest login failed.'); return; }
    }
    setStatus('starting');
    try {
      const localStream = await startLocalStream();
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    } catch (err) { setStatus('idle'); alert('Camera access failed: ' + err.message); return; }
    socket.emit('find-partner', { interests: getInterestsArray() });
  };

  const handleStart = () => {
    if (!isAgeOk()) { setAgeGateOpen(true); return; }
    startChat();
  };

  const confirmAge = () => {
    try { localStorage.setItem('rt_age_ok', '1'); } catch (e) {}
    setAgeGateOpen(false);
    startChat();
  };

  const handleNext = () => {
    if (!socket) return;
    clearAnnounce();
    setStatus('waiting'); setMessages([]); setPartnerCountry(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (pcRef?.current) { try { pcRef.current.close(); pcRef.current = null; } catch (e) {} }
    socket.emit('next');
  };

  const handleStop = () => {
    clearAnnounce();
    cleanup();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setStatus('idle'); setMessages([]); setPartnerCountry(null);
    if (socket) socket.emit('stop');
  };

  const handleSendMessage = (text) => {
    if (!socket || !roomIdRef.current) return;
    socket.emit('chat-message', { roomId: roomIdRef.current, message: text });
    setMessages((prev) => [...prev, { from: 'me', text }]);
  };

  const handleReportSubmit = async ({ partnerId, reason }) => {
    if (!socket) return;
    const pid = partnerId || currentPartnerRef.current;
    let image = null;
    if (pid && pid === currentPartnerRef.current) {
      image = reportFrameRef.current || captureFrame();
    } else {
      image = partnerHistoryRef.current.find((p) => p.id === pid)?.thumbnail || null;
    }
    socket.emit('report', { partnerId: pid, reason, image });
    reportFrameRef.current = null;
    showToast(t('report.toast.auto'));
    setTimeout(() => {
      clearAnnounce();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (pcRef?.current) { try { pcRef.current.close(); pcRef.current = null; } catch (e) {} }
      setStatus('waiting'); setMessages([]); setPartnerCountry(null);
      socket.emit('next');
      socket.emit('find-partner', { interests: getInterestsArray() });
    }, 500);
  };

  if (blockedUntil) {
    return (
      <BlockedScreen
        until={blockedUntil}
        reason={blockedReason}
        permanent={blockedPermanent}
        onExpire={() => { setBlockedUntil(null); window.location.reload(); }}
      />
    );
  }

  const loadingType = status === 'starting' ? 'starting' : status === 'waiting' ? 'waiting' : status === 'connecting' ? 'connecting' : null;
  const hideControlBarMobile = isMobile && (status === 'waiting' || status === 'connecting' || status === 'connected');

  return (
    <div className="chat-page" style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fbc2eb 100%)' }}>
      <div className="chat-bg-orb chat-bg-orb-1" />
      <div className="chat-bg-orb chat-bg-orb-2" />

      <TopBar status={status} onlineCount={onlineCount} onHelp={() => setHelpOpen(true)} onToggleChat={() => setShowChat((s) => !s)} chatOpen={showChat} />

      <div className="chat-layout">
        <div className="chat-videos-wrap" style={{ position: 'relative' }}>
          <SwipeWrapper onSwipeRight={handleNext} enabled={isMobile && status === 'connected'}>
            <div className="chat-videos">
              {/* Self video */}
              <div className="chat-video-tile video-self-tile" style={{ position: 'relative' }}>
                <video ref={localVideoRef} autoPlay muted playsInline />
                <div className="chat-video-label">{t('chat.you')}</div>
                {isMobile && (status === 'connected' || status === 'waiting') && (
                  <button onClick={handleStop} style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '20px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', zIndex: 50, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /></svg> STOP
                  </button>
                )}
                {status === 'idle' && (
                  <div className="self-logo-overlay">
                    <img src="/logo.png" alt="Random Talk" className="self-logo-img" />
                    {onlineCount > 0 && (
                      <div className="self-logo-online">
                        <span className="self-logo-dot" />
                        <span>{onlineCount} {onlineCount === 1 ? 'user' : 'users'} online</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Stranger video */}
              <div className="chat-video-tile video-stranger-tile" style={{ position: 'relative' }}>
                <video ref={remoteVideoRef} autoPlay playsInline />
                <div className="chat-video-label">{t('chat.stranger')}</div>
                {countryBanner && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '10px 18px', borderRadius: '999px', fontSize: '15px', fontWeight: 600, zIndex: 40, backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>
                    <span>{countryBanner.text}</span>
                    {countryBanner.code && (
                      <img
                        src={`https://flagcdn.com/w40/${countryBanner.code.toLowerCase()}.png`}
                        alt={countryBanner.code}
                        width="28"
                        height="20"
                        style={{ borderRadius: '3px', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                )}
                {status === 'connected' && (
                  <button onClick={openReport} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0, 0, 0, 0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }} title="Report User">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                  </button>
                )}
                {loadingType && <LoadingOverlay type={loadingType} />}
                {status === 'idle' && (
                  <div className="idle-overlay">
                    <div className="idle-text">{t('chat.idle')}</div>
                  </div>
                )}
              </div>
            </div>
          </SwipeWrapper>
          {!hideControlBarMobile && (
            <ControlBar status={status} onStart={handleStart} onNext={handleNext} onStop={handleStop} onReport={openReport} country={country} onCountryChange={setCountry} />
          )}
        </div>
        {showChat && (
          <ChatPanel messages={messages} onSend={handleSendMessage} connected={status === 'connected'} onClose={() => setShowChat(false)} isMobile={isMobile} partnerCountry={partnerCountry} onReportAbuse={openReport} />
        )}
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleReportSubmit} partners={partnerHistory} currentPartnerId={currentPartnerRef.current} />
      <WarningModal open={!!warning} level={warning?.level} message={warning?.message} detail={warning?.detail} onClose={() => setWarning(null)} />

      {/* 18+ Age Gate */}
      {ageGateOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', color: '#222', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Age Verification</h2>
            <p style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '12px' }}>
              Random Talk is intended for adults aged 18 and over. By continuing, you confirm that you are at least 18 years old.
            </p>
            <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '12px', color: '#555' }}>
              Nudity, sexual content, harassment, and the presence of minors are strictly prohibited. Violations may result in a temporary or permanent ban.
            </p>
            <p style={{ fontSize: '12px', marginBottom: '16px', color: '#555' }}>
              By continuing, you agree to our{' '}
              <Link to="/terms" style={{ textDecoration: 'underline' }}>Terms of Service</Link> and{' '}
              <Link to="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
            <button onClick={confirmAge} style={{ width: '100%', background: '#e91e63', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}>
              I am 18 or older
            </button>
            <button onClick={() => { window.location.href = 'https://www.google.com'; }} style={{ width: '100%', background: '#eee', color: '#333', border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer' }}>
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Privacy & Terms Links */}
      <div className="w-full text-center mt-6 mb-4 flex justify-center items-center gap-3 text-sm z-10 relative">
        <Link to="/privacy" className="text-pink-200 hover:text-white underline transition-colors">
          Privacy Policy
        </Link>
        <span className="text-pink-400 text-xs">•</span>
        <Link to="/terms" className="text-pink-200 hover:text-white underline transition-colors">
          Terms of Service
        </Link>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl z-[200] text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}