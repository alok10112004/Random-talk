import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCBd3u6uXiV4AslofV3yyVyAHgwh6Cl5ak",
  authDomain: "random-talk-f6f7c.firebaseapp.com",
  projectId: "random-talk-f6f7c",
  storageBucket: "random-talk-f6f7c.firebasestorage.app",
  messagingSenderId: "67310066895",
  appId: "1:67310066895:web:24048abc7208aa0e1f6bba",
  measurementId: "G-K1M1WX6S57"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();