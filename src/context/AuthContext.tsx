'use client';

import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import type { UserProfile } from "@/models/user";

interface StreakBonus {
    streak: number;
    points: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  streakBonus: StreakBonus | null;
  setStreakBonus: (bonus: StreakBonus | null) => void;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

const isYesterday = (d1: Date, d2: Date) => {
    const yesterday = new Date(d2);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(d1, yesterday);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [streakBonus, setStreakBonus] = useState<StreakBonus | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDoc = await getDoc(userDocRef);
        let userProfile: UserProfile;

        if (userDoc.exists()) {
          userProfile = userDoc.data() as UserProfile;
          setUser(userProfile);
          await handleDailyLogin(userProfile);
        } else {
          // This case might happen if the Firestore doc creation fails after signup
          // Or for users that signed in with Google before the profile creation was in place
           userProfile = {
            uid: authUser.uid,
            email: authUser.email!,
            displayName: authUser.displayName || 'New User',
            points: 0,
            loginStreak: 0,
            lastLogin: serverTimestamp() as Timestamp,
          } as UserProfile;
          setUser(userProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDailyLogin = async (currentUser: UserProfile) => {
    const today = new Date();
    const lastLoginDate = (currentUser.lastLogin as Timestamp).toDate();

    if (isSameDay(lastLoginDate, today)) {
        return; // Already logged in today
    }

    let newStreak = currentUser.loginStreak;
    if(isYesterday(lastLoginDate, today)) {
        newStreak++;
    } else {
        newStreak = 1; // Streak broken, reset to 1
    }

    const pointsGained = newStreak >= 5 ? 250 : 50;
    const newPoints = (currentUser.points || 0) + pointsGained;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const updatedData = {
        loginStreak: newStreak,
        points: newPoints,
        lastLogin: serverTimestamp(),
    };
    await updateDoc(userDocRef, updatedData);

    setUser(prevUser => prevUser ? { ...prevUser, ...updatedData, lastLogin: new Timestamp(Math.floor(Date.now() / 1000), 0) } as UserProfile : null);

    setStreakBonus({ streak: newStreak, points: pointsGained });
  };


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

  const updateUserProfile = (profileData: Partial<UserProfile>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, ...profileData };
    });
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    streakBonus,
    setStreakBonus
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
