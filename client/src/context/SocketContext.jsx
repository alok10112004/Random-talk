import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket'],
    });

    s.on('connect', () => console.log('🟢 socket connected:', s.id));
    s.on('disconnect', () => console.log('🔴 socket disconnected'));

    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}