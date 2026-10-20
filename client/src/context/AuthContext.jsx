import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Custom avatar load karo
      if (currentUser?.uid) {
        const saved = localStorage.getItem(`avatar_${currentUser.uid}`);
        if (saved) setCustomAvatar(saved);
        else setCustomAvatar(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

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

  // 👇 Custom avatar save karo
  const saveCustomAvatar = (base64) => {
    if (!user?.uid) return;
    localStorage.setItem(`avatar_${user.uid}`, base64);
    setCustomAvatar(base64);
  };

  // 👇 Reset to Google
  const resetCustomAvatar = () => {
    if (!user?.uid) return;
    localStorage.removeItem(`avatar_${user.uid}`);
    setCustomAvatar(null);
  };

  // 👇 Current avatar — custom ya Google
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