import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 🔥 Vercel ke environment variable se URL aayega (fallback localhost)
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

    const s = io(serverUrl, {
      withCredentials: true,
      // 'polling' pehle try hoga taaki mobile network par block na ho
      transports: ['polling', 'websocket'], 
    });

    s.on('connect', () => console.log('🟢 socket connected successfully:', s.id));
    s.on('connect_error', (err) => console.log('🔴 socket connection error:', err.message));
    s.on('disconnect', () => console.log('🔴 socket disconnected'));

    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}