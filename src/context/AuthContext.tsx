'use client';

import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, setDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseAuthUser,
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
        setLoading(true);
        const userProfile = await fetchAndProcessUserProfile(authUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAndProcessUserProfile = async (authUser: FirebaseAuthUser): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', authUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    let userProfile: UserProfile;

    if (userDoc.exists()) {
        userProfile = userDoc.data() as UserProfile;
    } else {
        // This case can happen if the Firestore doc creation is delayed after signup.
        // We create a temporary profile object to pass to handleDailyLogin,
        // which will then create the document properly.
        userProfile = {
            uid: authUser.uid,
            email: authUser.email!,
            displayName: authUser.displayName || 'New User',
            photoURL: authUser.photoURL || "",
            points: 0,
            loginStreak: 0,
            createdAt: serverTimestamp() as Timestamp, // This will be replaced by the server
            lastLogin: null as any, // This signals a first-time login
        };
    }
    
    const updatedProfile = await handleDailyLogin(userProfile);
    return updatedProfile;
  }

  const handleDailyLogin = async (currentUser: UserProfile): Promise<UserProfile> => {
    const today = new Date();
    const userDocRef = doc(db, 'users', currentUser.uid);

    if (!currentUser.lastLogin || !(currentUser.lastLogin instanceof Timestamp)) {
        // First login ever or corrupted lastLogin data
        const updatedData = {
            lastLogin: serverTimestamp(),
            loginStreak: 1,
            points: (currentUser.points || 0) + 50,
        };
        // Use set with merge to safely create or update the document
        await setDoc(userDocRef, updatedData, { merge: true });

        setStreakBonus({ streak: 1, points: 50 });
        // Return a merged profile for immediate UI update
        return { ...currentUser, ...updatedData, lastLogin: new Timestamp(Math.floor(Date.now() / 1000), 0) };
    }

    const lastLoginDate = currentUser.lastLogin.toDate();

    if (isSameDay(lastLoginDate, today)) {
        return currentUser; // Already logged in today, no changes needed
    }

    let newStreak = currentUser.loginStreak || 0;
    if(isYesterday(lastLoginDate, today)) {
        newStreak++;
    } else {
        newStreak = 1; // Streak broken, reset to 1
    }

    const pointsGained = newStreak >= 5 ? 250 : 50;
    const newPoints = (currentUser.points || 0) + pointsGained;

    const updatedData = {
        loginStreak: newStreak,
        points: newPoints,
        lastLogin: serverTimestamp(),
    };
    await updateDoc(userDocRef, updatedData);

    setStreakBonus({ streak: newStreak, points: pointsGained });
    // Return the updated profile so the UI can update immediately
    return { ...currentUser, ...updatedData, lastLogin: new Timestamp(Math.floor(Date.now() / 1000), 0) };
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
