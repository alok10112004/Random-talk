import { useRef, useCallback, useEffect } from 'react';

export function useWebRTC(socket) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const roomIdRef = useRef(null);
  
  const iceServersRef = useRef([{ urls: 'stun:stun.l.google.com:19302' }]);

  useEffect(() => {
    async function fetchTurnCreds() {
      try {
        const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/turn/credentials`);
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

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    roomIdRef.current = null;
  }, []);

  const createPeer = useCallback(
    (onRemoteStream) => {
      if (pcRef.current) pcRef.current.close();

      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      pcRef.current = pc;

      // Agar camera pehle se on hai toh track add karo
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && roomIdRef.current) {
          socket.emit('signal', {
            roomId: roomIdRef.current,
            data: { candidate: e.candidate },
          });
        }
      };

      pc.ontrack = (e) => {
        remoteStreamRef.current = e.streams[0];
        onRemoteStream?.(e.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        console.log('📡 PC state:', pc.connectionState);
      };

      return pc;
    },
    [socket]
  );

  const startLocalStream = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported.');
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const videoConstraints = isMobile 
      ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('❌ getUserMedia error:', err.name);
      throw new Error(err.name);
    }
  }, []);

  const handleSignal = useCallback(
    async (data) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', {
              roomId: roomIdRef.current,
              data: { sdp: pc.localDescription },
            });
          }
        } else if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('❌ Signal error:', err);
      }
    },
    [socket]
  );

  const makeOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit('signal', {
        roomId: roomIdRef.current,
        data: { sdp: pc.localDescription },
      });
    } catch (err) {
      console.error('❌ makeOffer error:', err);
    }
  }, [socket]);

  return {
    pcRef, localStreamRef, remoteStreamRef, roomIdRef, createPeer, startLocalStream, handleSignal, makeOffer, cleanup,
  };
}