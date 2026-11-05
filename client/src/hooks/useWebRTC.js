import { useRef, useCallback, useEffect } from 'react';

export function useWebRTC(socket) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const roomIdRef = useRef(null);
  
  // 🔥 TURN Credentials ko memory me save karne ke liye
  const iceServersRef = useRef([{ urls: 'stun:stun.l.google.com:19302' }]);

  // 🔥 PAGE LOAD HOTE HI CREDENTIALS FETCH KARO (Background me)
  useEffect(() => {
    let isMounted = true;
    async function fetchTurnCreds() {
      try {
        const res = await fetch('https://random-talk-x65v.onrender.com/api/turn/credentials');
        if (res.ok && isMounted) {
          const servers = await res.json();
          if (servers.length > 0) {
            iceServersRef.current = servers;
            console.log('✅ TURN Credentials pre-fetched in background');
          }
        }
      } catch (e) {
        console.warn('❌ Pre-fetch TURN failed, using default STUN');
      }
    }
    fetchTurnCreds();
    return () => { isMounted = false; };
  }, []);

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
      // 🔥 Pehle se fetch kiye hue credentials use karo
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
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

    // 📱 Camera Settings
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const videoConstraints = isMobileDevice 
      ? { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          aspectRatio: { ideal: 1.333333 },
          facingMode: 'user',
        }
      : { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
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