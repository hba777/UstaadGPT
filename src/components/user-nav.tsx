
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CreditCard,
  Languages,
  LogOut,
  Settings,
  User,
  Inbox,
  Users,
} from "lucide-react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "./mode-toggle"
import { useAuthContext } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

export function UserNav() {
    const { user, logout } = useAuthContext();
    const router = useRouter();
    const [pendingRequests, setPendingRequests] = useState(0);

    useEffect(() => {
      if (!user) return;

      const requestsRef = collection(db, "friendRequests");
      const q = query(requestsRef, where("to", "==", user.uid), where("status", "==", "pending"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPendingRequests(snapshot.size);
      });

      return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
      try {
        await logout();
        router.push('/login');
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.photoURL || undefined} alt="User avatar" />
            <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          {pendingRequests > 0 && (
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName || "Student"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "student@ustaad.gpt"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href={`/profile/${user?.uid}`}>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/inbox">
             <DropdownMenuItem>
                <Inbox className="mr-2 h-4 w-4" />
                <span>Inbox</span>
                {pendingRequests > 0 && (
                    <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">{pendingRequests}</span>
                )}
             </DropdownMenuItem>
          </Link>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem>
            <Languages className="mr-2 h-4 w-4" />
            <span>Language (EN/UR)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">Theme</p>
            <ModeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
