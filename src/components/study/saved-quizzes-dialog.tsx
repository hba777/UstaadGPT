
"use client"
import { useState } from "react";
import jsPDF from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type Book, type SavedQuizSet, deleteSavedQuizSet, getBookById } from "@/lib/firestore"
import { History, Lightbulb, Eye, Trash2, LoaderCircle, Download, Swords } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { ChallengeFriendDialog } from "./challenge-friend-dialog";

interface SavedQuizzesDialogProps {
    isOpen: boolean
    onClose: () => void
    book: Book | null | undefined
    onLoadSet: (set: SavedQuizSet) => void
    onBookUpdate: (book: Book, deletedSetId?: string) => void;
}

export function SavedQuizzesDialog({ isOpen, onClose, book, onLoadSet, onBookUpdate }: SavedQuizzesDialogProps) {
    const { toast } = useToast();
    const { user } = useAuthContext();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false);
    const [challengeQuizSet, setChallengeQuizSet] = useState<SavedQuizSet | null>(null);
    
    const sortedSets = [...(book?.savedQuizzes || [])].sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    const handleChallengeClick = (set: SavedQuizSet) => {
        setChallengeQuizSet(set);
        setIsChallengeDialogOpen(true);
    };

    const handleExport = (set: SavedQuizSet) => {
        if (set.questions.length === 0) {
            toast({ variant: "destructive", title: "No quiz to export." });
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Quiz for: ${book?.title || 'Untitled Document'}`, 10, 10);
        doc.setFontSize(12);
        
        let y = 20;

        set.questions.forEach((q, qIndex) => {
            if (y > 270) { // Check if new page is needed
                doc.addPage();
                y = 10;
            }

            const questionText = doc.splitTextToSize(`Question ${qIndex + 1}: ${q.questionText}`, 180);
            doc.text(questionText, 10, y);
            y += questionText.length * 5;

            q.options.forEach((opt, oIndex) => {
                const optionText = `${String.fromCharCode(97 + oIndex)}) ${opt}`;
                const fullOption = oIndex === q.correctAnswerIndex ? `(Correct) ${optionText}` : optionText;
                
                if (oIndex === q.correctAnswerIndex) {
                    doc.setTextColor(0, 128, 0); // Green
                }
                const splitOption = doc.splitTextToSize(fullOption, 170);
                doc.text(splitOption, 15, y);
                y += splitOption.length * 5;
                doc.setTextColor(0, 0, 0); // Reset to black
            });
            y += 5; // Extra space between questions
        });

        doc.save(`${book?.title || 'quiz'}-set.pdf`);
        toast({ title: "Exported", description: "Quiz set downloaded as a PDF." });
    };

    const handleDelete = async (set: SavedQuizSet) => {
        if (!book?.id || !user?.uid) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete set." });
            return;
        }
        setDeletingId(set.id);
        try {
             // Find the original set object from the book to pass to arrayRemove
            const originalSet = book.savedQuizzes?.find(s => s.id === set.id);
            if (!originalSet) {
                 toast({ variant: "destructive", title: "Error", description: "Could not find set to delete." });
                 setDeletingId(null);
                 return;
            }
            await deleteSavedQuizSet(book.id, originalSet);
            const updatedBook = await getBookById(book.id, user.uid);
            if (updatedBook) {
                onBookUpdate(updatedBook, set.id);
            }
            toast({ title: "Success", description: "Quiz set deleted." });
        } catch (error) {
            console.error("Failed to delete quiz set", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete set." });
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History />
                        Saved Quiz Sets
                    </DialogTitle>
                    <DialogDescription>
                        Showing saved quizzes for "{book?.title}". Select a quiz to take it.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-[50vh] pr-4">
                        <div className="space-y-4">
                            {sortedSets.length > 0 ? (
                                sortedSets.map((set) => (
                                    <Card key={set.id} className="transition-colors hover:bg-muted/50">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-base">
                                                        {set.questions.length}-Question Quiz
                                                    </CardTitle>
                                                    <CardDescription>
                                                       Saved on {set.createdAt?.seconds ? new Date(set.createdAt.seconds * 1000).toLocaleString() : 'Unknown Date'}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => onLoadSet(set)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleExport(set)}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Export
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleChallengeClick(set)}>
                                                        <Swords className="mr-2 h-4 w-4" />
                                                        Challenge
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                          <Button size="icon" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={deletingId === set.id}>
                                                                {deletingId === set.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this quiz set.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(set)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <Lightbulb className="mx-auto h-12 w-12" />
                                    <p className="mt-2 font-semibold">No Saved Quizzes Found</p>
                                    <p className="text-sm">Save a quiz to see it here.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
        <ChallengeFriendDialog
            isOpen={isChallengeDialogOpen}
            onClose={() => setIsChallengeDialogOpen(false)}
            book={book}
            quizSet={challengeQuizSet}
        />
        </>
    )
}
