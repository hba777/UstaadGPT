
"use client"
import { useState, useEffect } from "react"
import { BookCopy, LoaderCircle, Save, Check, History } from "lucide-react"
import type { GenerateFlashcardsOutput, Flashcard as FlashcardType } from "@/ai/flows/generate-flashcards"
import { generateFlashcards } from "@/ai/flows/generate-flashcards"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Flashcard } from "./flashcard"
import { saveBook, type Book, type SavedFlashcardSet } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext" 
import { useRouter } from "next/navigation"
import { SavedFlashcardsDialog } from "./saved-flashcards-dialog"

interface FlashcardViewProps {
  documentContent: string
  book?: Book | null;
  onBookUpdate: (book: Book) => void;
}

export function FlashcardView({ documentContent, book: initialBook, onBookUpdate }: FlashcardViewProps) {
  const [book, setBook] = useState(initialBook);
  const [activeFlashcardSet, setActiveFlashcardSet] = useState<SavedFlashcardSet | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<FlashcardType[] | null>(null);

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false);
  const [currentBookId, setCurrentBookId] = useState(initialBook?.id)
  const [bookTitle, setBookTitle] = useState(initialBook?.title || "")
  const [isSavedSetsOpen, setIsSavedSetsOpen] = useState(false);

  const { toast } = useToast()
  const { user } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    setBook(initialBook);
    if (initialBook) {
      const latestSet = initialBook.savedFlashcards?.slice().sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
      setActiveFlashcardSet(latestSet || null);
      setGeneratedFlashcards(null);
      setBookTitle(initialBook.title);
      setCurrentBookId(initialBook.id);
      setJustSaved(false);
    }
  }, [initialBook]);
  
  const flashcardsToDisplay = generatedFlashcards ?? activeFlashcardSet?.cards ?? [];

  const handleGenerateFlashcards = async () => {
    setIsLoading(true)
    setGeneratedFlashcards(null)
    setActiveFlashcardSet(null);
    setJustSaved(false);
    
    try {
      const result = await generateFlashcards({ documentContent: documentContent })
      setGeneratedFlashcards(result.flashcards)
    } catch (error) {
      console.error("Error generating flashcards:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFlashcards = async () => {
    if (!user?.uid) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to save flashcards.",
      })
      return
    }

    if (!bookTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Book Title Required",
        description: "Please enter a title for your book.",
      })
      return
    }
    
    const cardsToSave = generatedFlashcards;

    if (!cardsToSave || cardsToSave.length === 0) {
      toast({
        variant: "destructive",
        title: "No New Flashcards",
        description: "Generate new flashcards before saving.",
      })
      return
    }

    setIsSaving(true)
    
    try {
      const saveParams = {
        userId: user.uid,
        bookId: currentBookId,
        bookTitle: bookTitle.trim(),
        flashcards: cardsToSave,
        saveNewFlashcardSet: true,
        // Only pass documentContent if it's a new book
        ...(!currentBookId && { documentContent: documentContent })
      };
      
      const updatedBook = await saveBook(saveParams);
      
      onBookUpdate(updatedBook);
      
      if (!currentBookId) {
        router.replace(`/my-books/${updatedBook.id}`, { scroll: false })
      }
      
      setJustSaved(true);
      toast({
        title: "Success",
        description: `New flashcard set saved to "${bookTitle}".`,
      })
    } catch (error) {
      console.error("Error saving flashcards:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save flashcards. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleLoadSet = (set: SavedFlashcardSet) => {
    setActiveFlashcardSet(set);
    setGeneratedFlashcards(null);
    setJustSaved(false);
    setIsSavedSetsOpen(false);
    toast({
        title: "Flashcard Set Loaded",
        description: `Loaded set from ${new Date(set.createdAt.seconds * 1000).toLocaleString()}.`
    })
  }

  const handleBookUpdateFromDialog = (updatedBook: Book, deletedSetId?: string) => {
    onBookUpdate(updatedBook);
    // If the deleted set was the one being viewed, update the view
    if (activeFlashcardSet && activeFlashcardSet.id === deletedSetId) {
       const latestSet = updatedBook.savedFlashcards?.slice().sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
       setActiveFlashcardSet(latestSet || null);
    }
  }
  
  const isNewUnsavedContent = !!generatedFlashcards;
  const isSaveButtonDisabled = isSaving || justSaved || !isNewUnsavedContent || !bookTitle.trim();

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <BookCopy />
          Flashcard Generator
        </div>
        <div className="flex flex-col gap-2">
          {!book?.id && (
              <div>
                <Label htmlFor="book-title">Book Title</Label>
                <Input
                  id="book-title"
                  placeholder="Enter book title..."
                  value={bookTitle}
                  onChange={(e) => {
                    setBookTitle(e.target.value)
                    setJustSaved(false)
                  }}
                  className="mt-1"
                />
              </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={handleGenerateFlashcards} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <LoaderCircle className="mr-2 animate-spin" />
              ) : (
                <BookCopy className="mr-2" />
              )}
              {activeFlashcardSet || generatedFlashcards ? "Generate New" : "Generate Flashcards"}
            </Button>
            
            {isNewUnsavedContent && (
              <Button 
                onClick={handleSaveFlashcards} 
                disabled={isSaveButtonDisabled}
                variant={"default"}
                className="flex-1"
              >
                {isSaving ? (
                  <LoaderCircle className="mr-2 animate-spin" />
                ) : (
                  <Save className="mr-2" />
                )}
                {justSaved ? "Saved" : "Save as New Set"}
              </Button>
            )}

            {book && (
                <Button variant="outline" onClick={() => setIsSavedSetsOpen(true)} disabled={!book.savedFlashcards || book.savedFlashcards.length === 0}>
                    <History className="mr-2 h-4 w-4" />
                    View Saved
                </Button>
            )}
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm p-4 min-h-0">
          {isLoading && (
            <div className="w-full max-w-sm mx-auto">
              <Skeleton className="h-64 w-full" />
              <div className="mt-4 flex justify-center">
                  <Skeleton className="h-10 w-28" />
              </div>
            </div>
          )}
          
          {!isLoading && flashcardsToDisplay.length > 0 && (
            <div className="w-full max-w-sm">
              <Carousel className="w-full">
                <CarouselContent>
                  {flashcardsToDisplay.map((card, index) => (
                    <CarouselItem key={index}>
                      <Flashcard front={card.front} back={card.back} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {flashcardsToDisplay.length} flashcard{flashcardsToDisplay.length !== 1 ? 's' : ''} {generatedFlashcards ? 'generated' : book ? '(active set)' : ''}
              </div>
            </div>
          )}
          
          {!isLoading && flashcardsToDisplay.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
              <BookCopy className="h-12 w-12 mx-auto mb-4" />
              <p className="font-semibold">Generate flashcards from your document</p>
              <p className="text-sm">Click the button above to get started.</p>
            </div>
          )}
        </div>
      </div>
      <SavedFlashcardsDialog
        isOpen={isSavedSetsOpen}
        onClose={() => setIsSavedSetsOpen(false)}
        book={book}
        onLoadSet={handleLoadSet}
        onBookUpdate={handleBookUpdateFromDialog}
      />
    </>
  )
}
