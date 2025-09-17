

"use client";

import { useEffect, useState, ChangeEvent, useRef } from 'react';
import { doc, getDoc, serverTimestamp, collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, UserCheck, Clock, Inbox, Edit, Save, Upload, Scissors } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
  bio?: string;
}

type FriendStatus = 'not_friends' | 'pending_sent' | 'pending_received' | 'friends' | 'self';

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

function EditProfileDialog({ userProfile, onProfileUpdate }: { userProfile: UserProfile, onProfileUpdate: (data: Partial<UserProfile>) => void }) {
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState(userProfile.displayName);
    const [bio, setBio] = useState(userProfile.bio || '');
    const [photoURL, setPhotoURL] = useState(userProfile.photoURL || '');
    const [isSaving, setIsSaving] = useState(false);
    const [open, setOpen] = useState(false);

    // Cropping state
    const [imgSrc, setImgSrc] = useState('')
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<Crop>()
    const [isCropping, setIsCropping] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          setCrop(undefined) // Makes crop preview update between images.
          const reader = new FileReader()
          reader.addEventListener('load', () => {
              setImgSrc(reader.result?.toString() || '')
              setIsCropping(true)
          })
          reader.readAsDataURL(e.target.files[0])
        }
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height, 1))
    }

    async function handleCropConfirm() {
        const image = imgRef.current
        const previewCanvas = previewCanvasRef.current
        if (!image || !previewCanvas || !completedCrop) {
            throw new Error('Crop canvas does not exist')
        }

        const scaleX = image.naturalWidth / image.width
        const scaleY = image.naturalHeight / image.height

        const offscreen = new OffscreenCanvas(
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
        )
        const ctx = offscreen.getContext('2d')
        if (!ctx) {
            throw new Error('No 2d context')
        }

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            offscreen.width,
            offscreen.height,
        )
        
        const blob = await offscreen.getBlob({
            type: 'image/png',
        })
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoURL(reader.result as string);
        };
        reader.readAsDataURL(blob);

        setIsCropping(false)
        setImgSrc('')
    }


    const handleSave = async () => {
        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            const updateData: {[key: string]: any} = {
                displayName,
                bio,
                photoURL,
            };

            await updateDoc(userDocRef, updateData);
            onProfileUpdate(updateData);
            toast({ title: "Profile updated successfully!" });
            setOpen(false); // Close the dialog on success
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update profile." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={photoURL} alt="Profile avatar" />
                            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Button asChild variant="outline">
                            <label htmlFor="photo-upload" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" />
                                Change Photo
                                <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={onSelectFile} />
                            </label>
                        </Button>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="displayName" className="text-right">Name</Label>
                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bio" className="text-right">Bio</Label>
                        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="col-span-3" placeholder="Tell us a little about yourself" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <><Save className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Cropping Modal */}
        <Dialog open={isCropping} onOpenChange={setIsCropping}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crop your new photo</DialogTitle>
                    <DialogDescription>Adjust the selection to frame your profile picture.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center">
                    {imgSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imgSrc}
                                onLoad={onImageLoad}
                                style={{ transform: `scale(1) rotate(0deg)` }}
                            />
                        </ReactCrop>
                    )}
                </div>
                {/* Hidden canvas for preview */}
                <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
                <DialogFooter>
                     <Button variant="outline" onClick={() => setIsCropping(false)}>Cancel</Button>
                     <Button onClick={handleCropConfirm}><Scissors className="mr-2 h-4 w-4" /> Crop</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

export default function ProfilePage({ params }: { params: { uid: string } }) {
  const { user: currentUser, updateUserProfile } = useAuthContext();
  const { toast } = useToast();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('not_friends');
  const [friendRequestId, setFriendRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!params.uid) return;

    const fetchUser = async () => {
      setIsLoading(true);
      const userDocRef = doc(db, 'users', params.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setProfileUser(userDoc.data() as UserProfile);
      } else {
        console.error("No such user!");
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [params.uid]);

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

  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    if (profileUser) {
        const newProfileData = { ...profileUser, ...updatedData };
        setProfileUser(newProfileData as UserProfile);
        // Also update the global context
        if (currentUser && currentUser.uid === profileUser.uid) {
            updateUserProfile(updatedData);
        }
    }
  };

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
            if (profileUser) {
              return <EditProfileDialog userProfile={profileUser} onProfileUpdate={handleProfileUpdate} />;
            }
            return null;
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
    return <div>User not found.</div>;
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

