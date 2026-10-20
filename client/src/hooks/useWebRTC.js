import { useRef, useCallback } from 'react';

// ============================================
// METERED.CA TURN SERVER CONFIG
// ============================================
// Password REVEAL karo dashboard se aur yahan daalo
const TURN_USERNAME = '7f3c95826ffbde8af6338539';
const TURN_PASSWORD = 'B3jr4blV1TLmiV1/';

const ICE_SERVERS = {
  iceServers: [
    // STUN
    { urls: 'stun:stun.relay.metered.ca:80' },
    // TURN — UDP
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: TURN_USERNAME,
      credential: TURN_PASSWORD,
    },
    // TURN — TCP
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: TURN_USERNAME,
      credential: TURN_PASSWORD,
    },
    // TURN — TLS
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: TURN_USERNAME,
      credential: TURN_PASSWORD,
    },
    // TURN — TLS over TCP
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
    console.log('🧹 Cleanup started');

    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch (e) {
        console.warn('PC close error:', e);
      }
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
      localStreamRef.current = null;
    }

    remoteStreamRef.current = null;
    roomIdRef.current = null;
    console.log('🧹 Cleanup done');
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
        console.log('🎥 Remote track received:', e.track.kind);
        remoteStreamRef.current = e.streams[0];
        onRemoteStream?.(e.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        console.log('📡 PC state:', pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE state:', pc.iceConnectionState);
      };

      pc.onicegatheringstatechange = () => {
        console.log('❄️ ICE gathering:', pc.iceGatheringState);
      };

      return pc;
    },
    [socket]
  );

  const startLocalStream = useCallback(async () => {
    console.log('📹 Requesting camera + mic...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Camera not supported. HTTPS ya localhost chahiye.'
      );
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();

      console.log('✅ Camera got:', {
        width: settings?.width,
        height: settings?.height,
        frameRate: settings?.frameRate,
        device: videoTrack?.label,
      });

      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('❌ getUserMedia error:', err.name, err.message);

      let msg = 'Camera access failed. ';
      switch (err.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          msg += 'Please allow camera & microphone in browser settings.';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          msg += 'No camera or microphone found on your device.';
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          msg += 'Camera is already in use by another app (Zoom, Meet, etc).';
          break;
        case 'OverconstrainedError':
          msg += 'Camera does not support requested settings.';
          break;
        case 'SecurityError':
          msg += 'HTTPS required for camera access.';
          break;
        case 'AbortError':
          msg += 'Camera access was aborted.';
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
      if (!pc) {
        console.warn('⚠️ No PC for signal');
        return;
      }

      try {
        if (data.sdp) {
          console.log('📨 Received SDP:', data.sdp.type);
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          if (data.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', {
              roomId: roomIdRef.current,
              data: { sdp: pc.localDescription },
            });
            console.log('📤 Sent SDP answer');
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
      console.log('📤 Sent SDP offer');
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