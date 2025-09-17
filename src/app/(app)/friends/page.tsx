
"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, limit, startAt, endAt, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { UserSearch, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FoundUser {
  uid: string;
  displayName: string;
  photoURL?: string;
}

function FindFriendsTab() {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim() === "") {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(
            usersRef,
            orderBy("displayName"),
            startAt(searchQuery),
            endAt(searchQuery + '\uf8ff'),
            limit(10)
        );

        const querySnapshot = await getDocs(q);
        const users: FoundUser[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.uid !== user?.uid) {
            users.push({
              uid: data.uid,
              displayName: data.displayName,
              photoURL: data.photoURL,
            });
          }
        });
        setResults(users);
      } catch (error) {
        console.error("Error searching for users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
        searchUsers();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, user?.uid]);

  return (
    <div className="space-y-6">
        <div className="relative">
            <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            />
        </div>
        
        <Card>
            <CardContent className="p-6">
                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full bg-primary/20" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px] bg-primary/20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <ul className="space-y-2">
                        {results.map((foundUser) => (
                        <li key={foundUser.uid}>
                        <Link href={`/profile/${foundUser.uid}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={foundUser.photoURL} alt={`${foundUser.displayName}'s avatar`} />
                                <AvatarFallback>{foundUser.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{foundUser.displayName}</span>
                        </Link>
                        </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        {hasSearched ? (
                            <p>No users found matching your search.</p>
                        ) : (
                            <p>Start typing to find users.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

function MyFriendsTab() {
    const { user } = useAuthContext();
    const [friends, setFriends] = useState<FoundUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const q = query(friendsRef);

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const friendList: FoundUser[] = [];
            for (const friendDoc of snapshot.docs) {
                const friendData = friendDoc.data();
                const userDocRef = doc(db, 'users', friendData.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    friendList.push({
                        uid: userData.uid,
                        displayName: userData.displayName,
                        photoURL: userData.photoURL,
                    });
                }
            }
            setFriends(friendList);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
         <Card>
            <CardContent className="p-6">
                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[...Array(3)].map((_ , i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full bg-primary/20" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px] bg-primary/20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : friends.length > 0 ? (
                    <ul className="space-y-2">
                        {friends.map((friend) => (
                            <li key={friend.uid}>
                                <Link href={`/profile/${friend.uid}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={friend.photoURL} alt={`${friend.displayName}'s avatar`} />
                                        <AvatarFallback>{friend.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{friend.displayName}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                       <p>You haven't added any friends yet.</p>
                       <p className="text-sm">Use the "Find Friends" tab to connect with people.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function FriendsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <p className="text-muted-foreground">
          Find new friends or see your existing connections.
        </p>
      </div>
      <Tabs defaultValue="find" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="find">
                <UserSearch className="mr-2 h-4 w-4" />
                Find Friends
            </TabsTrigger>
            <TabsTrigger value="my-friends">
                <Users className="mr-2 h-4 w-4" />
                My Friends
            </TabsTrigger>
        </TabsList>
        <TabsContent value="find" className="mt-6">
           <FindFriendsTab />
        </TabsContent>
        <TabsContent value="my-friends" className="mt-6">
            <MyFriendsTab />
        </TabsContent>
    </Tabs>
    </div>
  );
}
