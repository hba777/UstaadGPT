"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const { login, user } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  if (user) {
    router.push('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      console.error("Error logging in:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      console.log("LoginPage: Calling signInWithPopup.");
      const userCred = await signInWithPopup(auth, provider);
      console.log("LoginPage: signInWithPopup promise resolved.", userCred);

      if (userCred) {
        const user = userCred.user;
        console.log("LoginPage: User object from userCred:", user);
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          console.log("LoginPage: User document does not exist. Creating it.");
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'New User',
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
          });
          console.log("LoginPage: User document created.");
        } else {
          console.log("LoginPage: User document already exists.");
        }
        console.log("LoginPage: Redirecting to /dashboard.");
        router.push('/dashboard');
      } else {
        console.log("LoginPage: signInWithPopup resolved but userCred is falsy.");
      }
    } catch (err: any) {
      console.error("LoginPage: Error signing in with Google:", err);
      setError(err.message);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your email and password to login.</CardDescription>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleLogin}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2 mt-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className="w-full mt-4" type="submit">
            Login
          </Button>
        </form>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
          Sign in with Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link
          href="/signup"
          className="text-sm text-muted-foreground hover:underline"
        >
          Don't have an account? Sign up
        </Link>
        <Link
          href="/reset-password"
          className="text-sm text-muted-foreground hover:underline"
        >
          Forgot your password?
        </Link>
      </CardFooter>
    </Card>
  );
}
