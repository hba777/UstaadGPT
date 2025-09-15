import { auth, db } from "@/lib/firebase";
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
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to check and create user document in Firestore
  const checkAndCreateUser = async (authUser: User) => {
    console.log("Checking or creating user in Firestore for:", authUser.uid);
    const userDocRef = doc(db, "users", authUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log("User does not exist in Firestore. Creating new document.");
      const newUser = {
        displayName: authUser.displayName || "New User",
        email: authUser.email,
        photoURL: authUser.photoURL,
        friends: [],
        createdAt: serverTimestamp(),
        emailVerified: authUser.emailVerified,
      };
      await setDoc(userDocRef, newUser);
      console.log("User document created in Firestore.");
      return { ...authUser, ...newUser };
    } else {
      console.log("User already exists in Firestore.");
      return { ...authUser, ...userDoc.data() };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        console.log("onAuthStateChanged: User is authenticated.", authUser.uid);
        try {
          const fullUser = await checkAndCreateUser(authUser);
          setUser(fullUser as User);
        } catch (e: any) {
          console.error("Error in onAuthStateChanged user processing:", e);
          setError(e.message);
          setUser(null);
        }
      } else {
        console.log("onAuthStateChanged: User is not authenticated.");
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log("Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      const { user: authUser } = await createUserWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle creating the Firestore document.
    } catch (error: any) {
      console.error("Signup error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
       // The onAuthStateChanged listener will handle login.
    } catch (error: any) {
      console.error("Login error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error("Logout error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the result.
    } catch (error: any) {
      console.error("Google sign-in error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { user, error, loading, signup, login, logout, resetPassword, signInWithGoogle };
}
