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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, signInWithGoogle, user, loading } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return null; // Or a loading spinner, while redirecting
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your email and password to login.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={handleLogin}>
          Login
        </Button>
        <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
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
