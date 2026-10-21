import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Landing from './pages/Landing';
import Home from './pages/Home';

// Protected route ab bhi rahega, par Login page nahi hai
function ProtectedRoute({ children }) {
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <Home />
                </SocketProvider>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}