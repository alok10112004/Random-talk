import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import ReportModal from "../components/ReportModal";
import TopBar from "../components/TopBar";

function VideoChat() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [partnerId, setPartnerId] = useState(null);
  const [partnerCountry, setPartnerCountry] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [gender, setGender] = useState("male");
  const [onlineCount, setOnlineCount] = useState(0); 
  const [isReportOpen, setIsReportOpen] = useState(false);

  const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const roomIdRef = useRef(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // 🔥 TURN Fetch
  useEffect(() => {
    async function fetchTurnCreds() {
      try {
        const res = await fetch(`https://random-talk-production.up.railway.app/api/turn/credentials`);
        if (res.ok) {
          const servers = await res.json();
          if (servers && servers.length > 0) {
            iceServersRef.current = servers; 
            console.log('✅ TURN Credentials loaded');
          }
        }
      } catch (e) {
        console.warn('❌ TURN fetch failed');
      }
    }
    fetchTurnCreds();
  }, []);

  // 🔥 Socket Events & Online Count
  useEffect(() => {
    if (!socket) return;

    socket.on("online-count", (count) => {
      setOnlineCount(count);
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Media error:", err);
      });

    const onMatched = ({ roomId, partnerId, partnerCountry, isInitiator }) => {
      roomIdRef.current = roomId;
      setPartnerId(partnerId);
      setPartnerCountry(partnerCountry || "Unknown");
      setStatus("connected");

      // 🔥 FIX: Purana peer band karo
      if (peerRef.current) {
        peerRef.current.close();
      }

      const peer = new RTCPeerConnection({ iceServers: iceServersRef.current });
      peerRef.current = peer;

      const localStream = localVideoRef.current?.srcObject;
      if (localStream) {
        // 🔥 FIX: addTrack ki jagah addTransceiver use karo (duplicate error nahi aayega)
        localStream.getTracks().forEach((track) => {
          if (track.kind === 'video' || track.kind === 'audio') {
            peer.addTransceiver(track, { direction: 'sendrecv', streams: [localStream] });
          }
        });
      }

      peer.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      if (isInitiator) {
        peer.createOffer().then((offer) => {
          peer.setLocalDescription(offer);
          socket.emit("offer", { roomId, offer });
        });
      }
    };

    const onOffer = async ({ offer }) => {
      const peer = peerRef.current;
      if (!peer) return;
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { roomId: roomIdRef.current, answer });
    };

    const onAnswer = async ({ answer }) => {
      const peer = peerRef.current;
      if (!peer) return;
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIce = async ({ candidate }) => {
      const peer = peerRef.current;
      if (!peer) return;
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const onMessage = ({ message, senderId }) => {
      setMessages((prev) => [...prev, { message, senderId }]);
    };

    const onPartnerLeft = () => {
      setStatus("idle");
      setPartnerId(null);
      setPartnerCountry("");
      setMessages([]);
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };

    socket.on("matched", onMatched);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);
    socket.on("new-message", onMessage);
    socket.on("partner-left", onPartnerLeft);

    return () => {
      socket.off("online-count");
      socket.off("matched", onMatched);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
      socket.off("new-message", onMessage);
      socket.off("partner-left", onPartnerLeft);
    };
  }, [socket]);

  const startChat = () => {
    if (!socket) return;
    setStatus("searching");
    socket.emit("find-partner", {
      userId: user._id,
      country: user.country || "Unknown",
      gender,
    });
  };

  const stopChat = () => {
    if (roomIdRef.current && socket) {
      socket.emit("next", { roomId: roomIdRef.current });
    }
    // 🔥 FIX: Pehle peer close karo, fir track stop karo
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setMessages([]);
    setPartnerId(null);
    setPartnerCountry("");
    setStatus("idle");
  };

  const sendMessage = () => {
    if (!input.trim() || !roomIdRef.current || !socket) return;
    socket.emit("send-message", {
      roomId: roomIdRef.current,
      message: input,
      senderId: user._id,
    });
    setInput("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isInCall = status === "connected" || status === "searching";

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-black text-white overflow-hidden flex flex-col">
      
      <div className="absolute top-0 left-0 w-full z-50">
        <TopBar 
          status={status === "searching" ? "waiting" : status} 
          onlineCount={onlineCount} 
          onToggleChat={() => {}}
          onHelp={() => {}} 
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative pt-16">
        
        <div className="flex-1 relative bg-gray-900 border-b border-gray-700">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <p className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs z-10">
            Stranger {partnerCountry && `• 🌍 ${partnerCountry}`}
          </p>

          {status === "connected" && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 rounded-full z-20"
              title="Report Stranger"
            >
              🚩
            </button>
          )}

          {status === "searching" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <p className="text-orange-400 animate-pulse text-sm">
                🔍 Searching for partner...
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 relative bg-gray-900">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <p className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs z-10">
            You • {user?.country || "🌍"}
          </p>

          {isInCall && (
            <button
              onClick={stopChat}
              className="absolute bottom-3 right-3 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg z-20 shadow-lg"
            >
              ⏹ STOP
            </button>
          )}
        </div>
      </div>

      {!isInCall && (
        <div className="flex-shrink-0 p-4 bg-black z-20">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={startChat}
              className="bg-green-600 py-3 rounded-lg font-bold text-sm"
            >
              ▶ Start
            </button>
            <button
              onClick={stopChat}
              disabled
              className="bg-gray-700 py-3 rounded-lg font-bold text-sm cursor-not-allowed"
            >
              ⏹ Stop
            </button>
            <div className="bg-gray-900 rounded-lg p-1 border border-orange-500/30">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-black text-white rounded text-xs py-1"
              >
                <option value="male">👦 Male</option>
                <option value="female">👧 Female</option>
              </select>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-500">
            ⚠️ 18+ only. Keep your face visible.
          </p>
        </div>
      )}

      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        partnerId={partnerId}
        onReportSubmitted={stopChat}
      />
    </div>
  );
}

export default VideoChat;