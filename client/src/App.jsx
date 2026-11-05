import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Privacy from './pages/Privacy'; // 🔥 Naya Import
import Terms from './pages/Terms';     // 🔥 Naya Import

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
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

            {/* 🔥 Naye Pages Yahan Add Kiye */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* Default route seedha Landing pe jayega */}
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}