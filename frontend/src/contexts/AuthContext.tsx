import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  isDemoUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // Check if demo user was active
    const savedDemo = localStorage.getItem('qualitylens_demo_user');
    if (savedDemo === 'true') {
      setIsDemoUser(true);
      setCurrentUser({
        uid: 'demo-engineer-uid',
        email: 'quality.lead@demo.qualitylens.io',
        displayName: 'Lead Quality Engineer (Demo)',
      } as any);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsDemoUser(false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    localStorage.removeItem('qualitylens_demo_user');
    setIsDemoUser(false);
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    localStorage.removeItem('qualitylens_demo_user');
    setIsDemoUser(false);
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    localStorage.removeItem('qualitylens_demo_user');
    setIsDemoUser(false);
    setCurrentUser(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
  };

  const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const loginDemo = async () => {
    localStorage.setItem('qualitylens_demo_user', 'true');
    setIsDemoUser(true);
    setCurrentUser({
      uid: 'demo-engineer-uid',
      email: 'quality.lead@demo.qualitylens.io',
      displayName: 'Lead Quality Engineer (Demo)',
    } as any);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        logout,
        resetPassword,
        loginDemo,
        isDemoUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
