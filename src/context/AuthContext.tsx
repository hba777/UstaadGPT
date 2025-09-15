'use client';

import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("AuthProvider: onAuthStateChanged event fired.", { authUser });
      setUser(authUser);
      setLoading(false);
      console.log("AuthProvider: Finished setting user and loading state.");
    });

    return () => {
      console.log("AuthProvider: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  }, []);

  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };
  
  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    console.log("AuthContext: signInWithGoogle called. Creating provider.");
    try {
      console.log("AuthContext: Calling signInWithPopup.");
      const result = await signInWithPopup(auth, provider);
      console.log("AuthContext: signInWithPopup promise resolved successfully.", result);
      return result;
    } catch (error) {
      console.error("AuthContext: signInWithPopup failed.", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};
