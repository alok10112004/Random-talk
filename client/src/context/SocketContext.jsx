import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || 'https://random-talk-production.up.railway.app';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => console.log('🟢 socket connected successfully:', s.id));
    s.on('connect_error', (err) => console.log('🔴 socket connection error:', err.message));
    s.on('disconnect', () => console.log('🔴 socket disconnected'));

    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}