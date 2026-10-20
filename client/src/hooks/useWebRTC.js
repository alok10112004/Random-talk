import { useRef, useCallback } from 'react';

// ============================================
// METERED.CA TURN SERVER CONFIG
// ============================================
const TURN_USERNAME = '7f3c95826ffbde8af6338539';
const TURN_PASSWORD = 'B3jr4blV1TLmiV1/'; // 👈 Yahan apna password daalo

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: TURN_USERNAME,
      credential: TURN_PASSWORD,
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: TURN_USERNAME,
      credential: TURN_PASSWORD,
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: TURN_USERNAME,
      credential: TURN_PASSWORD,
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: TURN_USERNAME,
      credential: TURN_PASSWORD,
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(socket) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const roomIdRef = useRef(null);

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    roomIdRef.current = null;
  }, []);

  const createPeer = useCallback(
    (onRemoteStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

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

      // 👇 FORCE HIGH QUALITY BITRATE
      setTimeout(() => {
        try {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (sender.track && sender.track.kind === 'video') {
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              // 1.5 Mbps force karo (HD quality ke liye)
              params.encodings[0].maxBitrate = 1500000;
              // Kabhi kabhi 2 Mbps tak allow karo
              params.encodings[0].maxFramerate = 30;
              sender.setParameters(params);
              console.log('🎥 Video bitrate forced to 1.5 Mbps');
            }
          });
        } catch (err) {
          console.warn('Bitrate force error:', err);
        }
      }, 1000); // 1 sec delay taaki connection set ho jaye

      return pc;
    },
    [socket]
  );

  const startLocalStream = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported. HTTPS ya localhost chahiye.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 }, // High resolution
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('❌ getUserMedia error:', err.name, err.message);
      let msg = 'Camera access failed. ';
      switch (err.name) {
        case 'NotAllowedError':
          msg += 'Please allow camera & microphone.';
          break;
        case 'NotFoundError':
          msg += 'No camera or microphone found.';
          break;
        case 'NotReadableError':
          msg += 'Camera is already in use by another app.';
          break;
        default:
          msg += err.message || 'Unknown error.';
      }
      throw new Error(msg);
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
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
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
    pcRef,
    localStreamRef,
    remoteStreamRef,
    roomIdRef,
    createPeer,
    startLocalStream,
    handleSignal,
    makeOffer,
    cleanup,
  };
}