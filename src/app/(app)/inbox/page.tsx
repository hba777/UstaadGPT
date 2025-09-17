"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface FriendRequest {
  id: string;
  from: string;
  fromName: string;
  fromPhotoURL?: string;
}

export default function InboxPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const requestsRef = collection(db, 'friendRequests');
    const q = query(requestsRef, where('to', '==', user.uid), where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newRequests: FriendRequest[] = [];
      for (const requestDoc of snapshot.docs) {
        const requestData = requestDoc.data();
        const userDocRef = doc(db, 'users', requestData.from);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          newRequests.push({
            id: requestDoc.id,
            from: requestData.from,
            fromName: userData.displayName,
            fromPhotoURL: userData.photoURL,
          });
        }
      }
      setRequests(newRequests);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRequest = async (requestId: string, fromId: string, accepted: boolean) => {
    if (!user) return;

    const requestDocRef = doc(db, 'friendRequests', requestId);

    try {
        if (accepted) {
            // Update request to 'accepted'
            await updateDoc(requestDocRef, { status: 'accepted' });

            // Add to friends subcollection for both users
            const currentUserFriendsRef = collection(db, 'users', user.uid, 'friends');
            await addDoc(currentUserFriendsRef, {
                uid: fromId,
                addedAt: serverTimestamp()
            });

            const otherUserFriendsRef = collection(db, 'users', fromId, 'friends');
            await addDoc(otherUserFriendsRef, {
                uid: user.uid,
                addedAt: serverTimestamp()
            });
            toast({ title: "Friend request accepted!" });
        } else {
            // Just delete the request if rejected
            await deleteDoc(requestDocRef);
            toast({ title: "Friend request rejected." });
        }
    } catch (error) {
        console.error("Error handling friend request:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not process request." });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">Manage your incoming friend requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Friend Requests</CardTitle>
          <CardDescription>
            {requests.length > 0
              ? 'Accept or reject requests from other users.'
              : 'You have no pending friend requests.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length > 0 ? (
            <ul className="space-y-4">
              {requests.map((request) => (
                <li key={request.id} className="flex items-center justify-between">
                  <Link href={`/profile/${request.from}`} className="flex items-center gap-4 group">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.fromPhotoURL} alt={`${request.fromName}'s avatar`} />
                      <AvatarFallback>{request.fromName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium group-hover:underline">{request.fromName}</span>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-green-500 hover:bg-green-50 hover:text-green-600"
                      onClick={() => handleRequest(request.id, request.from, true)}
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleRequest(request.id, request.from, false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-10">No new requests.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
