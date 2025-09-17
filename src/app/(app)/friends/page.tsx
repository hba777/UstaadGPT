"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit, startAt, endAt, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderCircle, UserSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FoundUser {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export default function FriendsPage() {
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
        // Firestore queries are case-sensitive. A common workaround is to store a lowercase version of the name.
        // For simplicity here, we'll query for exact matches on what's typed, but this is limited.
        // A more robust solution would use a search service like Algolia or a different database structure.
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
          // Exclude the current user from the results
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

    // Debounce search
    const debounceTimeout = setTimeout(() => {
        searchUsers();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, user?.uid]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find Friends</h1>
        <p className="text-muted-foreground">
          Search for other users by their name to connect with them.
        </p>
      </div>

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
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                         <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : results.length > 0 ? (
                <ul className="space-y-4">
                    {results.map((foundUser) => (
                    <li key={foundUser.uid} className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={foundUser.photoURL} alt={`${foundUser.displayName}'s avatar`} />
                            <AvatarFallback>{foundUser.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{foundUser.displayName}</span>
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
