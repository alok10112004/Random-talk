import { useRef, useCallback } from 'react';

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
      // 🔥 TURN credentials use karo jo startLocalStream me fetch honge
      const iceServers = localStreamRef.current?.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }];
      
      const pc = new RTCPeerConnection({ iceServers });
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

      // Force High Quality Bitrate
      setTimeout(() => {
        try {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (sender.track && sender.track.kind === 'video') {
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              params.encodings[0].maxBitrate = 1500000;
              params.encodings[0].maxFramerate = 30;
              sender.setParameters(params);
            }
          });
        } catch (err) {}
      }, 1000);

      return pc;
    },
    [socket]
  );

  const startLocalStream = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported. HTTPS ya localhost chahiye.');
    }

    // 🔥 Cloudflare se TURN credentials fetch karo
    let dynamicIceServers = [];
    try {
      const res = await fetch('https://random-talk-x65v.onrender.com/api/turn/credentials');
      if (res.ok) {
        dynamicIceServers = await res.json();
        console.log('✅ Cloudflare TURN Credentials fetched successfully');
      }
    } catch (e) {
      console.warn('❌ Cloudflare TURN fetch failed, using STUN only');
    }

    // Agar fetch fail ho jaye toh backup STUN server use karo
    if (dynamicIceServers.length === 0) {
      dynamicIceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    }

    // 📱 Camera Settings (Mobile pe 4:3 wide view, Laptop pe 16:9)
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const videoConstraints = isMobileDevice 
      ? { 
          width: { ideal: 640, max: 1280 }, 
          height: { ideal: 480, max: 960 }, 
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      : { 
          width: { ideal: 1280, max: 1920 }, 
          height: { ideal: 720, max: 1080 }, 
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 }
        };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      localStreamRef.current = stream;
      // 🔥 Credentials ko stream object me save kar do
      localStreamRef.current.iceServers = dynamicIceServers; 
      return stream;
    } catch (err) {
      console.error('❌ getUserMedia error:', err.name, err.message);
      let msg = 'Camera access failed. ';
      switch (err.name) {
        case 'NotAllowedError': msg += 'Please allow camera & microphone.'; break;
        case 'NotFoundError': msg += 'No camera or microphone found.'; break;
        case 'NotReadableError': msg += 'Camera is already in use by another app.'; break;
        default: msg += err.message || 'Unknown error.';
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