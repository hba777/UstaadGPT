

"use client";

import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, serverTimestamp, collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, UserCheck, Clock, Inbox, Edit, Save, Upload, Scissors, X } from 'lucide-react';
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
    const fileInputRef = useRef<HTMLInputElement>(null)

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
        const image = imgRef.current;
        if (!image || !completedCrop || !completedCrop.width || !completedCrop.height) {
            toast({ variant: "destructive", title: "Error", description: "Could not crop image." });
            return;
        }

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            toast({ variant: "destructive", title: "Error", description: "Could not process image." });
            return;
        }

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const dataUrl = canvas.toDataURL('image/png');
        setPhotoURL(dataUrl);
        setIsCropping(false);
        setImgSrc('');
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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
    
    const handleCancelCrop = () => {
        setIsCropping(false);
        setImgSrc('');
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            // Reset to initial profile state
            setDisplayName(userProfile.displayName);
            setBio(userProfile.bio || '');
            setPhotoURL(userProfile.photoURL || '');
            // Reset cropping state
            setIsCropping(false);
            setImgSrc('');
            setCrop(undefined);
            setCompletedCrop(undefined);
        }
    }, [open, userProfile]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
                {isCropping ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Crop your new photo</DialogTitle>
                            <DialogDescription>Adjust the selection to frame your profile picture.</DialogDescription>
                        </DialogHeader>
                         <div className="flex justify-center p-4 bg-muted/50 rounded-md">
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
                                        style={{ maxHeight: '60vh' }}
                                    />
                                </ReactCrop>
                            )}
                        </div>
                        <DialogFooter>
                             <Button variant="outline" onClick={handleCancelCrop}><X className="mr-2 h-4 w-4" />Cancel</Button>
                             <Button onClick={handleCropConfirm}><Scissors className="mr-2 h-4 w-4" /> Confirm Crop</Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
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
                                        <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={onSelectFile} ref={fileInputRef} />
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
                                {isSaving ? <><Save className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
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
