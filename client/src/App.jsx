import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Home from './pages/Home';

function ProtectedRoute({ children, requireTerms = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0a0e1a] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireTerms) {
    const accepted = localStorage.getItem('acceptedTerms') === 'true';
    if (!accepted) return <Navigate to="/landing" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/landing"
              element={
                <ProtectedRoute>
                  <Landing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute requireTerms>
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
      </LanguageProvider>
    </BrowserRouter>
  );
}