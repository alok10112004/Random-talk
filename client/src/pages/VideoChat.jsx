import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const socket = io("http://localhost:5000");

function VideoChat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [partnerId, setPartnerId] = useState(null);
  const [partnerCountry, setPartnerCountry] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [gender, setGender] = useState("male");
  const [onlineCount] = useState(364488);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const roomIdRef = useRef(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Media error:", err);
        alert("Camera/Mic permission denied.");
      });

    socket.on(
      "matched",
      ({ roomId, partnerId, partnerCountry, isInitiator }) => {
        roomIdRef.current = roomId;
        setPartnerId(partnerId);
        setPartnerCountry(partnerCountry || "Unknown");
        setStatus("connected");

        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });
        peerRef.current = peer;

        const localStream = localVideoRef.current.srcObject;
        localStream.getTracks().forEach((track) => {
          peer.addTrack(track, localStream);
        });

        peer.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        if (isInitiator) {
          peer.createOffer().then((offer) => {
            peer.setLocalDescription(offer);
            socket.emit("offer", { roomId, offer });
          });
        }
      }
    );

    socket.on("offer", async ({ offer }) => {
      const peer = peerRef.current;
      if (!peer) return;
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { roomId: roomIdRef.current, answer });
    });

    socket.on("answer", async ({ answer }) => {
      const peer = peerRef.current;
      if (!peer) return;
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      const peer = peerRef.current;
      if (!peer) return;
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("new-message", ({ message, senderId }) => {
      setMessages((prev) => [...prev, { message, senderId }]);
    });

    socket.on("partner-left", () => {
      setStatus("idle");
      setPartnerId(null);
      setPartnerCountry("");
      setMessages([]);
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    });

    return () => {
      socket.off("matched");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("new-message");
      socket.off("partner-left");
    };
  }, []);

  const startChat = () => {
    setStatus("searching");
    socket.emit("find-partner", {
      userId: user._id,
      country: user.country || "Unknown",
      gender,
    });
  };

  const stopChat = () => {
    if (roomIdRef.current) {
      socket.emit("next", { roomId: roomIdRef.current });
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setMessages([]);
    setPartnerId(null);
    setPartnerCountry("");
    setStatus("idle");
  };

  const sendMessage = () => {
    if (!input.trim() || !roomIdRef.current) return;
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

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-orange-500">📺 Iconic TV</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              🟢 {onlineCount.toLocaleString()} users online
            </span>
            <span className="text-sm text-gray-400">
              {user?.name} • {user?.country || "🌍"}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Area */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-orange-500/30">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full aspect-video object-cover"
              />

              {/* Partner video */}
              {status === "connected" && (
                <div className="absolute bottom-2 right-2 w-40 h-28 bg-black rounded-lg overflow-hidden border-2 border-orange-500">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {partnerCountry && (
                    <div className="absolute top-1 left-1 bg-black/80 px-2 py-0.5 rounded text-xs">
                      🌍 {partnerCountry}
                    </div>
                  )}
                </div>
              )}

              <p className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                You • {user?.country || "🌍"}
              </p>

              {status === "searching" && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <p className="text-lg text-orange-400 animate-pulse">
                    🔍 Searching for partner...
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={startChat}
                disabled={status !== "idle"}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-4 rounded-lg font-bold text-lg transition"
              >
                ▶ Start
              </button>
              <button
                onClick={stopChat}
                disabled={status === "idle"}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-4 rounded-lg font-bold text-lg transition"
              >
                ⏹ Stop
              </button>
              <div className="bg-gray-900 rounded-lg p-2 border border-orange-500/30">
                <label className="block text-xs text-gray-400 mb-1">
                  I am
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-black text-white rounded px-2 py-1 text-sm"
                >
                  <option value="male">👦 Male</option>
                  <option value="female">👧 Female</option>
                </select>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500">
              ⚠️ 18+ only. Keep your face visible. Report inappropriate behavior.
            </p>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg border border-orange-500/30 h-full flex flex-col">
              <div className="p-3 border-b border-orange-500/30 flex justify-between items-center">
                <h2 className="font-bold text-orange-400">💬 Chat</h2>
                {partnerCountry && (
                  <span className="text-xs text-gray-400">
                    🌍 {partnerCountry}
                  </span>
                )}
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[400px]">
                {status !== "connected" ? (
                  <p className="text-gray-500 text-sm text-center mt-10">
                    Start chat to begin messaging
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center">
                    Say hi! 👋
                  </p>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`text-sm p-2 rounded max-w-[80%] ${
                        m.senderId === user._id
                          ? "bg-orange-600 ml-auto text-right"
                          : "bg-gray-700 mr-auto"
                      }`}
                    >
                      {m.message}
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-orange-500/30 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Write a message..."
                  disabled={status !== "connected"}
                  className="flex-1 bg-black border border-orange-500/30 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={status !== "connected"}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 px-4 py-2 rounded text-sm font-bold"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoChat;