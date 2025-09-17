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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/models/user";

export default function SignupPage() {
  const { signup, user } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null; // or a loading spinner
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCred = await signup(email, password);
      const user = userCred.user;

      const newUserProfile: Omit<UserProfile, 'createdAt' | 'lastLogin'> & { createdAt: any, lastLogin: any } = {
        uid: user.uid,
        email: user.email!,
        displayName: username,
        bio: "",
        photoURL: "",
        points: 0,
        loginStreak: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), newUserProfile);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      console.error("Error signing up:", err);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>
          Enter your email, username, and password to create an account.
        </CardDescription>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSignup}>
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="yourusername"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            Sign up
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:underline"
        >
          Already have an account? Login
        </Link>
      </CardFooter>
    </Card>
  );
}
