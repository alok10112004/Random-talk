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
  const [warning, setWarning] = useState(null);
  const [partnerCountry, setPartnerCountry] = useState(null);
  const [partnerHistory, setPartnerHistory] = useState([]);
  const partnerHistoryRef = useRef([]);
  const currentPartnerRef = useRef(null);
  const reportFrameRef = useRef(null);
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

  useEffect(() => {
    if (socket) socket.emit('set-country', { country });
  }, [socket, country]);

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

  // Report ke liye bada frame (NSFW check ke liye)
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
      roomIdRef.current = roomId;
      currentPartnerRef.current = partnerId;
      setStatus('connecting');
      setMessages([]);
      setPartnerCountry(partnerCountry || 'ANY');
      let localStream = localStreamRef.current;
      if (!localStream) {
        localStream = await startLocalStream();
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      }
      const pc = createPeer((remoteStream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        addPartnerToHistory(partnerId);
        setStatus('connected');
      });
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
      if (initiator) await makeOffer();
    };
    const onSignal = ({ data }) => handleSignal(data);
    const onPartnerDisconnected = () => {
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
    const onBlocked = ({ until }) => setBlockedUntil(until);
    const onWarning = (data) => setWarning(data);
    const onMessageBlocked = () =>
      showToast('Message block hua: links ya galat shabd allowed nahi hain');
    const onOutdated = () => alert('Page purana hai, refresh karo (Ctrl + Shift + R).');

    socket.on('waiting', onWaiting); socket.on('matched', onMatched); socket.on('signal', onSignal);
    socket.on('partner-left', onPartnerDisconnected);
    socket.on('partner-disconnected', onPartnerDisconnected);
    socket.on('chat-message', onChat);
    socket.on('report-received', onReportReceived); socket.on('online-count', onOnlineCount);
    socket.on('you-are-blocked', onBlocked); socket.on('warning', onWarning);
    socket.on('message-blocked', onMessageBlocked); socket.on('outdated-client', onOutdated);
    return () => {
      socket.off('waiting', onWaiting); socket.off('matched', onMatched); socket.off('signal', onSignal);
      socket.off('partner-left', onPartnerDisconnected);
      socket.off('partner-disconnected', onPartnerDisconnected);
      socket.off('chat-message', onChat);
      socket.off('report-received', onReportReceived); socket.off('online-count', onOnlineCount);
      socket.off('you-are-blocked', onBlocked); socket.off('warning', onWarning);
      socket.off('message-blocked', onMessageBlocked); socket.off('outdated-client', onOutdated);
    };
  }, [socket, cleanup, createPeer, handleSignal, makeOffer, roomIdRef, startLocalStream, localStreamRef, isMobile, t, user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const isAgeOk = () => {
    try { return localStorage.getItem('rt_age_ok') === '1'; } catch (e) { return false; }
  };

  const startChat = async () => {
    if (!socket) return;
    if (!user) {
      try { await loginAsGuest(); } catch (err) { alert("Guest login failed."); return; }
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
    setStatus('waiting'); setMessages([]); setPartnerCountry(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (pcRef?.current) { try { pcRef.current.close(); pcRef.current = null; } catch (e) {} }
    socket.emit('next');
  };

  const handleStop = () => {
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
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (pcRef?.current) { try { pcRef.current.close(); pcRef.current = null; } catch (e) {} }
      setStatus('waiting'); setMessages([]); setPartnerCountry(null);
      socket.emit('next');
      socket.emit('find-partner', { interests: getInterestsArray() });
    }, 500);
  };

  if (blockedUntil) {
    return <BlockedScreen until={blockedUntil} onExpire={() => { setBlockedUntil(null); window.location.reload(); }} />;
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
          <div style={{ background: '#fff', color: '#222', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>18+ Only</h2>
            <p style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '12px' }}>
              Ye site sirf 18 saal ya usse zyada umar ke logon ke liye hai. Nudity, sexual content, harassment aur nabalig (minors) ki mojoodgi allowed nahi hai. Report hone par aapko ban kiya ja sakta hai.
            </p>
            <p style={{ fontSize: '12px', marginBottom: '16px' }}>
              Aage badhkar aap{' '}
              <Link to="/terms" style={{ textDecoration: 'underline' }}>Terms</Link> aur{' '}
              <Link to="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</Link> maante hain.
            </p>
            <button onClick={confirmAge} style={{ width: '100%', background: '#e91e63', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}>
              Main 18+ hoon, aage badho
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