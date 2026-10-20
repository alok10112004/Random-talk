import { useEffect, useRef, useState } from 'react';
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

// Country names dictionary (same as before)
const COUNTRY_NAMES = {
  ANY: { name: 'Any Country', flag: '🌍' },
  IN: { name: 'India', flag: '🇮🇳' },
  US: { name: 'United States', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  BR: { name: 'Brazil', flag: '🇧🇷' },
  PK: { name: 'Pakistan', flag: '🇵🇰' },
  BD: { name: 'Bangladesh', flag: '🇧🇩' },
  NP: { name: 'Nepal', flag: '🇳🇵' },
  LK: { name: 'Sri Lanka', flag: '🇱🇰' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  AU: { name: 'Australia', flag: '🇦🇺' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  FR: { name: 'France', flag: '🇫🇷' },
  JP: { name: 'Japan', flag: '🇯🇵' },
  CN: { name: 'China', flag: '🇨🇳' },
  RU: { name: 'Russia', flag: '🇷🇺' },
  ID: { name: 'Indonesia', flag: '🇮🇩' },
  PH: { name: 'Philippines', flag: '🇵🇭' },
  VN: { name: 'Vietnam', flag: '🇻🇳' },
  TH: { name: 'Thailand', flag: '🇹🇭' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦' },
  AE: { name: 'UAE', flag: '🇦🇪' },
  EG: { name: 'Egypt', flag: '🇪🇬' },
  NG: { name: 'Nigeria', flag: '🇳🇬' },
  ZA: { name: 'South Africa', flag: '🇿🇦' },
  MX: { name: 'Mexico', flag: '🇲🇽' },
  AR: { name: 'Argentina', flag: '🇦🇷' },
  ES: { name: 'Spain', flag: '🇪🇸' },
  IT: { name: 'Italy', flag: '🇮🇹' },
  NL: { name: 'Netherlands', flag: '🇳🇱' },
  TR: { name: 'Turkey', flag: '🇹🇷' },
  KR: { name: 'South Korea', flag: '🇰🇷' },
  MY: { name: 'Malaysia', flag: '🇲🇾' },
  SG: { name: 'Singapore', flag: '🇸🇬' },
  IR: { name: 'Iran', flag: '🇮🇷' },
  IQ: { name: 'Iraq', flag: '🇮🇶' },
  AF: { name: 'Afghanistan', flag: '🇦🇫' },
  NZ: { name: 'New Zealand', flag: '🇳🇿' },
  IE: { name: 'Ireland', flag: '🇮🇪' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
  CH: { name: 'Switzerland', flag: '🇨🇭' },
  SE: { name: 'Sweden', flag: '🇸🇪' },
  NO: { name: 'Norway', flag: '🇳🇴' },
  PL: { name: 'Poland', flag: '🇵🇱' },
  UA: { name: 'Ukraine', flag: '🇺🇦' },
  KE: { name: 'Kenya', flag: '🇰🇪' },
  GH: { name: 'Ghana', flag: '🇬🇭' },
};

export default function Home() {
  const socket = useSocket();
  const { user } = useAuth();
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
  const [toast, setToast] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [warning, setWarning] = useState(null);
  
  // 👇 Partner Country state
  const [partnerCountry, setPartnerCountry] = useState(null);

  const [partnerHistory, setPartnerHistory] = useState([]);
  const partnerHistoryRef = useRef([]);
  const currentPartnerRef = useRef(null);

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
    const saved = sessionStorage.getItem('interests');
    if (saved) setInterests(saved);
  }, []);

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
    } catch (err) {
      return null;
    }
  };

  const addPartnerToHistory = (partnerId) => {
    setTimeout(() => {
      const thumb = captureThumbnail();
      const partner = {
        id: partnerId,
        thumbnail: thumb,
        timestamp: Date.now(),
      };
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

    if (user?.uid) {
      socket.emit('identify', { userId: user.uid });
    }

    const onWaiting = () => {
      setStatus('waiting');
      setPartnerCountry(null); // reset
    };

    const onMatched = async ({ roomId, partnerId, initiator, partnerCountry }) => {
      roomIdRef.current = roomId;
      currentPartnerRef.current = partnerId;
      setStatus('connecting');
      setMessages([]); // Chat clear
      
      // 👇 Set partner country for banner
      setPartnerCountry(partnerCountry || 'ANY');

      let localStream = localStreamRef.current;
      if (!localStream) {
        localStream = await startLocalStream();
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      }

      const pc = createPeer((remoteStream) => {
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = remoteStream;
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

    socket.on('waiting', onWaiting);
    socket.on('matched', onMatched);
    socket.on('signal', onSignal);
    socket.on('partner-disconnected', onPartnerDisconnected);
    socket.on('chat-message', onChat);
    socket.on('report-received', onReportReceived);
    socket.on('online-count', onOnlineCount);
    socket.on('you-are-blocked', onBlocked);
    socket.on('warning', onWarning);

    return () => {
      socket.off('waiting', onWaiting);
      socket.off('matched', onMatched);
      socket.off('signal', onSignal);
      socket.off('partner-disconnected', onPartnerDisconnected);
      socket.off('chat-message', onChat);
      socket.off('report-received', onReportReceived);
      socket.off('online-count', onOnlineCount);
      socket.off('you-are-blocked', onBlocked);
      socket.off('warning', onWarning);
    };
  }, [socket, cleanup, createPeer, handleSignal, makeOffer, roomIdRef, startLocalStream, localStreamRef, isMobile, t, user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStart = async () => {
    if (!socket) return;
    setStatus('starting');
    try {
      const localStream = await startLocalStream();
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    } catch (err) {
      setStatus('idle');
      alert('Camera access failed: ' + err.message);
      return;
    }
    socket.emit('find-partner', { interests: getInterestsArray() });
  };

  const handleNext = () => {
    if (!socket) return;
    setStatus('waiting');
    setMessages([]);
    setPartnerCountry(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (pcRef?.current) {
      try { pcRef.current.close(); pcRef.current = null; } catch (e) {}
    }

    socket.emit('next');
    socket.emit('find-partner', { interests: getInterestsArray() });
  };

  const handleStop = () => {
    cleanup();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setStatus('idle');
    setMessages([]);
    setPartnerCountry(null);
    if (socket) socket.emit('stop');
  };

  const handleSendMessage = (text) => {
    if (!socket || !roomIdRef.current) return;
    socket.emit('chat-message', { roomId: roomIdRef.current, message: text });
    setMessages((prev) => [...prev, { from: 'me', text }]);
  };

  const handleReportSubmit = async ({ partnerId, reason }) => {
    if (!socket) return;
    socket.emit('report', {
      partnerId: partnerId || currentPartnerRef.current,
      reason,
    });
    showToast(t('report.toast.auto'));
    setTimeout(() => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (pcRef?.current) { try { pcRef.current.close(); pcRef.current = null; } catch (e) {} }
      setStatus('waiting');
      setMessages([]);
      setPartnerCountry(null);
      socket.emit('next');
      socket.emit('find-partner', { interests: getInterestsArray() });
    }, 500);
  };

  if (blockedUntil) {
    return (
      <BlockedScreen
        until={blockedUntil}
        onExpire={() => {
          setBlockedUntil(null);
          window.location.reload();
        }}
      />
    );
  }

  const loadingType =
    status === 'starting' ? 'starting' :
    status === 'waiting' ? 'waiting' :
    status === 'connecting' ? 'connecting' : null;

  const hideControlBarMobile =
    isMobile && (status === 'waiting' || status === 'connecting' || status === 'connected');

  return (
    <div className="chat-page">
      <div className="chat-bg-orb chat-bg-orb-1" />
      <div className="chat-bg-orb chat-bg-orb-2" />

      <TopBar
        status={status}
        onlineCount={onlineCount}
        onHelp={() => setHelpOpen(true)}
        onToggleChat={() => setShowChat((s) => !s)}
        chatOpen={showChat}
      />

      <div className="chat-layout">
        <div className="chat-videos-wrap">
          <SwipeWrapper
            onSwipeRight={handleNext}
            enabled={isMobile && status === 'connected'}
          >
            <div className="chat-videos">
              {/* Self video */}
              <div className="chat-video-tile video-self-tile">
                <video ref={localVideoRef} autoPlay muted playsInline />
                <div className="chat-video-label">{t('chat.you')}</div>

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
              <div className="chat-video-tile video-stranger-tile">
                <video ref={remoteVideoRef} autoPlay playsInline />
                <div className="chat-video-label">{t('chat.stranger')}</div>
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
            <ControlBar
              status={status}
              onStart={handleStart}
              onNext={handleNext}
              onStop={handleStop}
              onReport={() => setReportOpen(true)}
              country={country}
              onCountryChange={setCountry}
            />
          )}
        </div>

        {showChat && (
          <ChatPanel
            messages={messages}
            onSend={handleSendMessage}
            connected={status === 'connected'}
            onClose={() => setShowChat(false)}
            isMobile={isMobile}
            partnerCountry={partnerCountry} // 👈 Pass country
            onReportAbuse={() => setReportOpen(true)} // 👈 Pass report handler (optional)
          />
        )}
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        partners={partnerHistory}
        currentPartnerId={currentPartnerRef.current}
      />

      <WarningModal
        open={!!warning}
        level={warning?.level}
        message={warning?.message}
        detail={warning?.detail}
        onClose={() => setWarning(null)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl z-[200] text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}