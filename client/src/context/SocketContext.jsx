import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 🔥 HARDCODED RENDER URL (Vercel variable ka locha khatam)
    const s = io('https://random-talk-x65v.onrender.com', {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Mobile network ke liye polling fallback
    });

    s.on('connect', () => console.log('🟢 socket connected successfully:', s.id));
    s.on('connect_error', (err) => console.log('🔴 socket connection error:', err.message));
    s.on('disconnect', () => console.log('🔴 socket disconnected'));

    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}