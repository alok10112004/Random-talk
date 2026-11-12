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
  const turnPromiseRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const roomIdRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const pendingSignalsRef = useRef([]);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // 🔥 TURN Fetch
  useEffect(() => {
    turnPromiseRef.current = (async () => {
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
    })();
  }, []);

  // 🔥 Camera / Mic
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
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Media error:", err));

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

  const closePeer = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    pendingCandidatesRef.current = [];
    pendingSignalsRef.current = [];
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // 🔥 Socket Events
  useEffect(() => {
    if (!socket) return;

    // user identify + country (backend ke liye)
    const identify = () => {
      if (user?._id) socket.emit("identify", { userId: user._id });
      socket.emit("set-country", { country: user?.country || "ANY" });
    };
    identify();
    socket.on("connect", identify);

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

    const processSignal = async (peer, data) => {
      try {
        if (data.sdp) {
          await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await flushCandidates(peer);
          if (data.sdp.type === "offer") {
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("signal", {
              roomId: roomIdRef.current,
              data: { sdp: peer.localDescription },
            });
          }
        } else if (data.candidate) {
          if (!peer.remoteDescription) {
            pendingCandidatesRef.current.push(data.candidate);
          } else {
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        }
      } catch (e) {
        console.error("❌ Signal error:", e);
      }
    };

    const onMatched = async ({ roomId, partnerId, partnerCountry, initiator }) => {
      roomIdRef.current = roomId;
      setPartnerId(partnerId);
      setPartnerCountry(partnerCountry || "Unknown");
      setStatus("connected");

      closePeer();

      // TURN credentials aane tak ruko (max ~3 sec)
      if (turnPromiseRef.current) {
        await Promise.race([
          turnPromiseRef.current,
          new Promise((r) => setTimeout(r, 3000)),
        ]);
      }
      if (roomIdRef.current !== roomId) return; // beech me stop/next ho gaya

      const peer = new RTCPeerConnection({ iceServers: iceServersRef.current });
      peerRef.current = peer;

      const localStream = localStreamRef.current;
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peer.addTrack(track, localStream);
        });
      } else {
        console.warn("⚠️ Camera/mic ready nahi hai, permission check karo");
      }

      peer.ontrack = (event) => {
        if (peerRef.current !== peer) return;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate && peerRef.current === peer) {
          socket.emit("signal", {
            roomId,
            data: { candidate: event.candidate },
          });
        }
      };

      peer.onconnectionstatechange = () => {
        console.log("📡 PC state:", peer.connectionState);
      };

      // jo signals peer banne se pehle aa gaye the
      const queued = pendingSignalsRef.current;
      pendingSignalsRef.current = [];
      for (const d of queued) await processSignal(peer, d);

      if (initiator) {
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("signal", {
            roomId,
            data: { sdp: peer.localDescription },
          });
        } catch (e) {
          console.error("❌ createOffer error:", e);
        }
      }
    };

    const onSignal = async ({ data }) => {
      if (!data) return;
      const peer = peerRef.current;
      if (!peer) {
        pendingSignalsRef.current.push(data);
        return;
      }
      await processSignal(peer, data);
    };

    const onWaiting = () => setStatus("searching");

    const onMessage = ({ message, from }) => {
      setMessages((prev) => [...prev, { message, senderId: from }]);
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
    socket.on("waiting", onWaiting);
    socket.on("signal", onSignal);
    socket.on("chat-message", onMessage);
    socket.on("partner-left", onPartnerLeft);

    return () => {
      socket.off("connect", identify);
      socket.off("online-count", onOnlineCount);
      socket.off("matched", onMatched);
      socket.off("waiting", onWaiting);
      socket.off("signal", onSignal);
      socket.off("chat-message", onMessage);
      socket.off("partner-left", onPartnerLeft);
    };
  }, [socket, user]);

  const startChat = () => {
    if (!socket) return;
    setStatus("searching");
    socket.emit("find-partner");
  };

  // Next: purana partner chhodo, naya dhundo
  const nextChat = () => {
    if (!socket) return;
    closePeer();
    roomIdRef.current = null;
    setMessages([]);
    setPartnerId(null);
    setPartnerCountry("");
    setStatus("searching");
    socket.emit("next");
  };

  // Stop: poori tarah ruk jao
  const stopChat = () => {
    if (socket) socket.emit("stop");
    closePeer();
    roomIdRef.current = null;
    setMessages([]);
    setPartnerId(null);
    setPartnerCountry("");
    setStatus("idle");
  };

  const sendMessage = () => {
    if (!input.trim() || !roomIdRef.current || !socket) return;
    socket.emit("chat-message", {
      roomId: roomIdRef.current,
      message: input,
    });
    setMessages((prev) => [...prev, { message: input, senderId: socket.id }]);
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
            <div className="absolute bottom-3 right-3 flex gap-2 z-20">
              <button
                onClick={nextChat}
                className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg shadow-lg"
              >
                ⏭ NEXT
              </button>
              <button
                onClick={stopChat}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg"
              >
                ⏹ STOP
              </button>
            </div>
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