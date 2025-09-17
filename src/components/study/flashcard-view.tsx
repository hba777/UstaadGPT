"use client"
import { useState } from "react"
import { BookCopy, LoaderCircle, Save, Check } from "lucide-react"
import type { GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards"
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
import { saveFlashcardsToFirestore } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext" 

interface FlashcardViewProps {
  documentContent: string
  bookId?: string // Optional: if editing existing book
  bookName?: string // Optional: if editing existing book
}

export function FlashcardView({ documentContent, bookId, bookName }: FlashcardViewProps) {
  const [flashcards, setFlashcards] = useState<GenerateFlashcardsOutput["flashcards"]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [bookTitle, setBookTitle] = useState(bookName || "")
  const { toast } = useToast()
  const { user } = useAuthContext()

  const handleGenerateFlashcards = async () => {
    setIsLoading(true)
    setFlashcards([])
    setIsSaved(false)
    
    try {
      const result = await generateFlashcards({ documentContent: documentContent })
      setFlashcards(result.flashcards)
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

    if (flashcards.length === 0) {
      toast({
        variant: "destructive",
        title: "No Flashcards",
        description: "Generate flashcards before saving.",
      })
      return
    }

    setIsSaving(true)
    
    try {
      await saveFlashcardsToFirestore({
        userId: user.uid,
        bookId: bookId,
        bookTitle: bookTitle.trim(),
        flashcards: flashcards,
        documentContent: documentContent
      })
      
      setIsSaved(true)
      toast({
        title: "Success",
        description: `Flashcards saved for "${bookTitle}"`,
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

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-2">
        <div>
          <Label htmlFor="book-title">Book Title</Label>
          <Input
            id="book-title"
            placeholder="Enter book title..."
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleGenerateFlashcards} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <LoaderCircle className="mr-2 animate-spin" />
            ) : (
              <BookCopy className="mr-2" />
            )}
            Generate Flashcards
          </Button>
          
          <Button 
            onClick={handleSaveFlashcards} 
            disabled={isSaving || flashcards.length === 0 || !bookTitle.trim()}
            variant={isSaved ? "default" : "outline"}
            className="flex-1"
          >
            {isSaving ? (
              <LoaderCircle className="mr-2 animate-spin" />
            ) : isSaved ? (
              <Check className="mr-2" />
            ) : (
              <Save className="mr-2" />
            )}
            {isSaved ? "Saved" : "Save Flashcards"}
          </Button>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        {isLoading && (
          <div className="w-full max-w-sm mx-auto">
            <Skeleton className="h-64 w-full" />
            <div className="mt-4 flex justify-center">
                <Skeleton className="h-10 w-28" />
            </div>
          </div>
        )}
        
        {flashcards.length > 0 && !isLoading && (
          <div className="w-full max-w-sm">
            <Carousel className="w-full">
              <CarouselContent>
                {flashcards.map((card, index) => (
                  <CarouselItem key={index}>
                    <Flashcard front={card.front} back={card.back} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} generated
            </div>
          </div>
        )}
        
        {!isLoading && flashcards.length === 0 && (
          <p className="text-sm text-center text-muted-foreground">
            Click the button to generate flashcards.
          </p>
        )}
      </div>
    </div>
  )
}