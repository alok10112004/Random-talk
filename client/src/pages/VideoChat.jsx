import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import ReportModal from "../components/ReportModal";
import TopBar from "../components/TopBar";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "https://random-talk-production.up.railway.app";

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
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const roomIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // 🔥 TURN Fetch
  useEffect(() => {
    async function fetchTurnCreds() {
      try {
        const res = await fetch(`${SERVER_URL}/api/turn`);
        if (!res.ok) {
          console.warn("❌ TURN fetch failed, status:", res.status);
          return;
        }
        const servers = await res.json();
        if (Array.isArray(servers) && servers.length > 0) {
          iceServersRef.current = servers;
          console.log("✅ TURN Credentials loaded");
        } else {
          console.warn("❌ TURN response invalid:", servers);
        }
      } catch (e) {
        console.warn("❌ TURN fetch failed:", e.message);
      }
    }
    fetchTurnCreds();
  }, []);

  // 🔥 Camera / Mic (sirf ek baar)
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Media error:", err);
      });

    return () => {
      cancelled = true;
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // helper: peer close + remote video clear
  const closePeer = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    pendingCandidatesRef.current = [];
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // 🔥 Socket Events
  useEffect(() => {
    if (!socket) return;

    const onOnlineCount = (count) => setOnlineCount(count);

    const flushCandidates = async (peer) => {
      const list = pendingCandidatesRef.current;
      pendingCandidatesRef.current = [];
      for (const c of list) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(c));
        } catch (e) {
          console.warn("ICE add failed:", e.message);
        }
      }
    };

    const onMatched = ({ roomId, partnerId, partnerCountry, isInitiator }) => {
      roomIdRef.current = roomId;
      setPartnerId(partnerId);
      setPartnerCountry(partnerCountry || "Unknown");
      setStatus("connected");

      closePeer();

      const peer = new RTCPeerConnection({ iceServers: iceServersRef.current });
      peerRef.current = peer;

      const localStream = localStreamRef.current;
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peer.addTrack(track, localStream);
        });
      } else {
        console.warn("⚠️ Local stream ready nahi hai (camera permission check karo)");
      }

      peer.ontrack = (event) => {
        if (peerRef.current !== peer) return;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate && peerRef.current === peer) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      peer.onconnectionstatechange = () => {
        console.log("📡 PC state:", peer.connectionState);
      };

      if (isInitiator) {
        peer
          .createOffer()
          .then(async (offer) => {
            await peer.setLocalDescription(offer);
            socket.emit("offer", { roomId, offer });
          })
          .catch((e) => console.error("❌ createOffer error:", e));
      }
    };

    const onOffer = async ({ offer }) => {
      const peer = peerRef.current;
      if (!peer) return;
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        await flushCandidates(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", { roomId: roomIdRef.current, answer });
      } catch (e) {
        console.error("❌ onOffer error:", e);
      }
    };

    const onAnswer = async ({ answer }) => {
      const peer = peerRef.current;
      if (!peer) return;
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        await flushCandidates(peer);
      } catch (e) {
        console.error("❌ onAnswer error:", e);
      }
    };

    const onIce = async ({ candidate }) => {
      const peer = peerRef.current;
      if (!peer || !candidate) return;
      if (!peer.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("ICE add failed:", e.message);
      }
    };

    const onMessage = ({ message, senderId }) => {
      setMessages((prev) => [...prev, { message, senderId }]);
    };

    const onPartnerLeft = () => {
      setStatus("idle");
      setPartnerId(null);
      setPartnerCountry("");
      setMessages([]);
      roomIdRef.current = null;
      closePeer();
    };

    socket.on("online-count", onOnlineCount);
    socket.on("matched", onMatched);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);
    socket.on("new-message", onMessage);
    socket.on("partner-left", onPartnerLeft);

    return () => {
      socket.off("online-count", onOnlineCount);
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
    closePeer();
    roomIdRef.current = null;
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