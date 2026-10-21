import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customAvatar, setCustomAvatar] = useState(null);

  useEffect(() => {
    // 👇 Jab user redirect (Google Login) se wapas aaye
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('✅ Logged in via Redirect:', result.user.email);
        }
      })
      .catch((error) => {
        console.error('❌ Redirect login error:', error);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser?.uid) {
        const saved = localStorage.getItem(`avatar_${currentUser.uid}`);
        if (saved) setCustomAvatar(saved);
        else setCustomAvatar(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 👇 Google Login (Popup try karega, fail hone pe Redirect)
  const loginWithGoogle = async () => {
    try {
      // 1. Pehle Popup try karo (fast hota hai)
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.warn('⚠️ Popup failed:', error.code);
      
      // 2. Agar popup block ho jaye, toh Redirect use karo
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        console.log('🔄 Switching to Redirect login...');
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw error; // Baaki errors throw karo
      }
    }
  };

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const signupWithEmail = async (email, password, displayName = '') => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false, error: err.message };
    }
  };

  const saveCustomAvatar = (base64) => {
    if (!user?.uid) return;
    localStorage.setItem(`avatar_${user.uid}`, base64);
    setCustomAvatar(base64);
  };

  const resetCustomAvatar = () => {
    if (!user?.uid) return;
    localStorage.removeItem(`avatar_${user.uid}`);
    setCustomAvatar(null);
  };

  const currentAvatar = customAvatar || user?.photoURL || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        customAvatar,
        currentAvatar,
        saveCustomAvatar,
        resetCustomAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}