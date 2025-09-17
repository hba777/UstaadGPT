"use client"

import { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, Upload, Scissors, X, LoaderCircle } from 'lucide-react';
import type { UserProfile } from '@/models/user';

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
            const updateData: Partial<UserProfile> = {
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
                <Button><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
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
                                {isSaving ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}


export default function SettingsPage() {
    const { user, updateUserProfile } = useAuthContext();
    
    if (!user) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how others will see you on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className='space-y-1'>
                    <p className="font-semibold text-xl">{user.displayName}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                </div>
            </div>
             <div className="space-y-2">
                <Label>Bio</Label>
                <p className="text-sm text-muted-foreground italic">
                    {user.bio || "You haven't set a bio yet."}
                </p>
            </div>
        </CardContent>
        <CardContent>
            <EditProfileDialog userProfile={user} onProfileUpdate={updateUserProfile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Select your preferred theme.</p>
            </div>
            <ModeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
