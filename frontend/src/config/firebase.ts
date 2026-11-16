import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAa96WjvGauwQTUf-_KKG8AId4KwNyHeTQ",
  authDomain: "quality-lens-c174e.firebaseapp.com",
  projectId: "quality-lens-c174e",
  storageBucket: "quality-lens-c174e.firebasestorage.app",
  messagingSenderId: "835016759265",
  appId: "1:835016759265:web:d4dfaa3cb4fdc28ec324a0",
  measurementId: "G-0LPHBW1KT0"
};

// Initialize Firebase modular instances once
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
