import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || 'https://innovative-cooperation-production-b9f11a82.up.railway.app';

// Har browser ki ek permanent random ID (ban isi par bhi lagta hai)
function getDeviceId() {
  try {
    let id = localStorage.getItem('rt_device_id');
    if (!id) {
      id =
        (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem('rt_device_id', id);
    }
    return id;
  } catch {
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      auth: { deviceId: getDeviceId() },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => console.log('🟢 socket connected successfully:', s.id));
    s.on('connect_error', (err) => console.log('🔴 socket connection error:', err.message));
    s.on('disconnect', () => console.log('🔴 socket disconnected'));
    s.on('you-are-blocked', () => console.log('⛔ You are temporarily blocked'));
    s.on('outdated-client', () => console.log('⚠️ Page refresh karo (Ctrl+Shift+R)'));

    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}