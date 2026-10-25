import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import Landing from './pages/Landing';
import Home from './pages/Home';

export default function App() {
  return (
    <BrowserRouter>
      {/* 1. LanguageProvider sabse bahar (TopBar, ChatPanel ke liye) */}
      <LanguageProvider>
        {/* 2. AuthProvider (Login state ke liye) */}
        <AuthProvider>
          <Routes>
            {/* Landing Page (Bina Login ke accessible) */}
            <Route path="/landing" element={<Landing />} />
            
            {/* Chat Page (Socket connection ke saath) */}
            <Route
              path="/chat"
              element={
                <SocketProvider>
                  <Home />
                </SocketProvider>
              }
            />
            
            {/* Default route seedha Landing pe jayega */}
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}