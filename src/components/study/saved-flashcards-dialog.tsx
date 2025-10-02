
"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SavedFlashcardSet } from "@/lib/firestore"
import { History, BookCopy, Eye } from "lucide-react"

interface SavedFlashcardsDialogProps {
    isOpen: boolean
    onClose: () => void
    savedSets: SavedFlashcardSet[]
    onLoadSet: (set: SavedFlashcardSet) => void
    bookTitle: string
}

export function SavedFlashcardsDialog({ isOpen, onClose, savedSets, onLoadSet, bookTitle }: SavedFlashcardsDialogProps) {
    
    const sortedSets = [...savedSets].sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History />
                        Saved Flashcard Sets
                    </DialogTitle>
                    <DialogDescription>
                        Showing saved sets for "{bookTitle}". Select a set to view it.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-[50vh] pr-4">
                        <div className="space-y-4">
                            {sortedSets.length > 0 ? (
                                sortedSets.map((set) => (
                                    <Card key={set.id} className="transition-colors hover:bg-muted/50">
                                        <CardHeader className="pb-2 flex-row items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base">
                                                    {set.cards.length} Flashcards
                                                </CardTitle>
                                                <CardDescription>
                                                   Saved on {set.createdAt?.seconds ? new Date(set.createdAt.seconds * 1000).toLocaleString() : 'Unknown Date'}
                                                </CardDescription>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => onLoadSet(set)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </Button>
                                        </CardHeader>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <BookCopy className="mx-auto h-12 w-12" />
                                    <p className="mt-2 font-semibold">No Saved Sets Found</p>
                                    <p className="text-sm">Save a set of flashcards to see it here.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
