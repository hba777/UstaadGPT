"use client"

import { useState } from "react"
import { BookCopy, LoaderCircle } from "lucide-react"

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
import { Flashcard } from "./flashcard"

interface FlashcardViewProps {
  documentContent: string
}

export function FlashcardView({ documentContent }: FlashcardViewProps) {
  const [flashcards, setFlashcards] = useState<GenerateFlashcardsOutput["flashcards"]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateFlashcards = async () => {
    setIsLoading(true)
    setFlashcards([])
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

  return (
    <div className="flex flex-col gap-4 h-full">
      <Button onClick={handleGenerateFlashcards} disabled={isLoading}>
        {isLoading ? (
          <LoaderCircle className="mr-2 animate-spin" />
        ) : (
          <BookCopy className="mr-2" />
        )}
        Generate Flashcards
      </Button>
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
          <Carousel className="w-full max-w-sm">
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
