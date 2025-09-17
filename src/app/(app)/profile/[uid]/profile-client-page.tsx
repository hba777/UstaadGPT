"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, collection, query, where, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import type { UserProfile } from '@/models/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, UserCheck, Clock, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FriendStatus = 'not_friends' | 'pending_sent' | 'pending_received' | 'friends' | 'self';

export default function ProfileClientPage({ uid }: { uid: string }) {
  const { user: currentUser } = useAuthContext();
  const { toast } = useToast();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('not_friends');
  const [friendRequestId, setFriendRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    setIsLoading(true);
    const userDocRef = doc(db, 'users', uid);
    
    const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists()) {
        setProfileUser(userDoc.data() as UserProfile);
      } else {
        console.error("No such user!");
        setProfileUser(null);
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!currentUser || !profileUser) return;

    if (currentUser.uid === profileUser.uid) {
      setFriendStatus('self');
      return;
    }

    const friendsRef = collection(db, 'users', currentUser.uid, 'friends');
    const friendsQuery = query(friendsRef, where('uid', '==', profileUser.uid));
    const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
        if (!snapshot.empty) {
            setFriendStatus('friends');
            return;
        }

        const requestsRef = collection(db, "friendRequests");
        const q = query(
            requestsRef,
            where('from', 'in', [currentUser.uid, profileUser.uid]),
            where('to', 'in', [currentUser.uid, profileUser.uid]),
            where('status', '==', 'pending')
        );

        const unsubscribeRequests = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setFriendStatus('not_friends');
                setFriendRequestId(null);
                return;
            }
            
            const requestDoc = snapshot.docs[0];
            const data = requestDoc.data();
            setFriendRequestId(requestDoc.id);

            if (data.from === currentUser.uid) {
                setFriendStatus('pending_sent');
            } else {
                setFriendStatus('pending_received');
            }
        });
        return () => unsubscribeRequests();
    });

    return () => unsubscribeFriends();

  }, [currentUser, profileUser]);

  const handleAddFriend = async () => {
    if (!currentUser || !profileUser) return;

    try {
      await addDoc(collection(db, "friendRequests"), {
        from: currentUser.uid,
        to: profileUser.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast({
          title: "Friend Request Sent",
          description: `Your request to ${profileUser.displayName} has been sent.`,
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
          variant: "destructive",
          title: "Error",
          description: "Could not send friend request. Please try again.",
      });
    }
  };

  const handleCancelRequest = async () => {
    if (!friendRequestId) return;
    try {
        await deleteDoc(doc(db, "friendRequests", friendRequestId));
        toast({ title: "Friend request cancelled." });
    } catch(error) {
        console.error("Error cancelling friend request:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not cancel request." });
    }
  }


  const renderFriendButton = () => {
    switch (friendStatus) {
        case 'self':
            return <Button onClick={() => router.push('/settings')}><Inbox className="mr-2 h-4 w-4" /> Edit Profile</Button>;
        case 'friends':
            return <Button disabled variant="secondary"><UserCheck className="mr-2 h-4 w-4" /> Friends</Button>;
        case 'pending_sent':
            return <Button variant="secondary" onClick={handleCancelRequest}><Clock className="mr-2 h-4 w-4" /> Request Sent</Button>;
        case 'pending_received':
            return <Button onClick={() => router.push('/inbox')}><Inbox className="mr-2 h-4 w-4" /> Respond in Inbox</Button>;
        case 'not_friends':
        default:
            return <Button onClick={handleAddFriend}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
    }
  }


  if (isLoading) {
    return (
        <div className="flex justify-center items-start pt-10">
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-8 w-48 mt-4" />
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                     <Skeleton className="h-10 w-32 mx-auto mt-4" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!profileUser) {
    return <div className="text-center pt-10">User not found.</div>;
  }

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={profileUser.photoURL} alt={`${profileUser.displayName}'s avatar`} />
            <AvatarFallback className="text-3xl">{profileUser.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{profileUser.displayName}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
            {profileUser.bio ? (
                <p className="text-muted-foreground">{profileUser.bio}</p>
            ) : (
                <p className="text-sm text-muted-foreground italic">No bio yet.</p>
            )}
            <div className="flex justify-center">
                {currentUser && renderFriendButton()}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
