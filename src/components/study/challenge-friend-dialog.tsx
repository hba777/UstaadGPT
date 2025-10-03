
"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, LoaderCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/models/user";
import type { Book, SavedQuizSet } from "@/lib/firestore";
import { cn } from "@/lib/utils";

interface ChallengeFriendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null | undefined;
  quizSet: SavedQuizSet | null;
}

type Friend = Pick<UserProfile, 'uid' | 'displayName' | 'photoURL'>;

export function ChallengeFriendDialog({ isOpen, onClose, book, quizSet }: ChallengeFriendDialogProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [openPopover, setOpenPopover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchFriends = async () => {
      setIsLoading(true);
      try {
        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const q = query(friendsRef);
        const snapshot = await getDocs(q);
        const friendList: Friend[] = [];

        for (const friendDoc of snapshot.docs) {
          const friendData = friendDoc.data();
          const userDocRef = doc(db, 'users', friendData.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            friendList.push({
              uid: userData.uid,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
            });
          }
        }
        setFriends(friendList);
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your friends." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [isOpen, user, toast]);

  const handleSendChallenge = async () => {
    if (!user || !selectedFriend || !book || !quizSet) {
        toast({ variant: "destructive", title: "Missing Information", description: "Cannot send challenge." });
        return;
    }

    setIsSending(true);
    try {
        await addDoc(collection(db, 'quizChallenges'), {
            bookId: book.id,
            bookTitle: book.title,
            quizSetId: quizSet.id,
            challengerUid: user.uid,
            challengerName: user.displayName,
            challengerPhotoURL: user.photoURL || '',
            challengerScore: null,
            recipientUid: selectedFriend.uid,
            recipientName: selectedFriend.displayName,
            recipientPhotoURL: selectedFriend.photoURL || '',
            recipientScore: null,
            status: 'pending',
            createdAt: serverTimestamp(),
            completedAt: null,
            winnerUid: null,
        });
        toast({ title: "Challenge Sent!", description: `Your quiz challenge has been sent to ${selectedFriend.displayName}.` });
        handleClose();
    } catch(error) {
        console.error("Error sending challenge:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to send the challenge. Please try again." });
    } finally {
        setIsSending(false);
    }
  };

  const handleClose = () => {
    setSelectedFriend(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Challenge a Friend</DialogTitle>
          <DialogDescription>Select a friend to challenge to this quiz.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm font-medium">Book: <span className="font-normal text-muted-foreground">{book?.title}</span></p>
            <p className="text-sm font-medium">Quiz: <span className="font-normal text-muted-foreground">{quizSet?.questions.length}-question set</span></p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading friends...</p>
            </div>
          ) : friends.length > 0 ? (
            <Popover open={openPopover} onOpenChange={setOpenPopover}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPopover}
                        className="w-full justify-between"
                    >
                    {selectedFriend
                        ? selectedFriend.displayName
                        : "Select a friend..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search friends..." />
                        <CommandList>
                            <CommandEmpty>No friend found.</CommandEmpty>
                            <CommandGroup>
                                {friends.map((friend) => (
                                <CommandItem
                                    key={friend.uid}
                                    value={friend.uid}
                                    onSelect={(currentValue) => {
                                        const friend = friends.find(f => f.uid === currentValue);
                                        setSelectedFriend(friend || null);
                                        setOpenPopover(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedFriend?.uid === friend.uid ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {friend.displayName}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          ) : (
             <p className="text-sm text-center text-muted-foreground pt-4">You have no friends to challenge. Add friends from the 'Friends' page.</p>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSendChallenge} disabled={!selectedFriend || isSending}>
            {isSending ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : (
                <><Send className="mr-2 h-4 w-4" /> Send Challenge</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
