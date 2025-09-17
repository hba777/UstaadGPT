"use client"
import { useState } from "react"
import { Book, ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { Flashcard } from "./flashcard"
import { type Book as BookType } from "@/lib/firestore"

interface BookFlashcardsViewProps {
  book: BookType
  onBack: () => void
  onEdit?: (book: BookType) => void
}

export function BookFlashcardsView({ book, onBack, onEdit }: BookFlashcardsViewProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Books
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Book className="h-5 w-5" />
            <h2 className="text-lg font-semibold truncate">{book.title}</h2>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary">
              {book.flashcards.length} flashcard{book.flashcards.length !== 1 ? 's' : ''}
            </Badge>
            {book.updatedAt && (
              <span className="text-sm text-muted-foreground">
                Updated {formatDate(book.updatedAt)}
              </span>
            )}
          </div>
        </div>

        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(book)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Flashcards Display */}
      <div className="flex-grow flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        {book.flashcards.length > 0 ? (
          <div className="w-full max-w-sm">
            <Carousel 
              className="w-full"
              opts={{
                startIndex: currentCardIndex,
              }}
              onSelect={(index) => setCurrentCardIndex(index as unknown as number)}

            >
              <CarouselContent>
                {book.flashcards.map((card, index) => (
                  <CarouselItem key={index}>
                    <Flashcard front={card.front} back={card.back} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            
            {/* Progress indicator */}
            <div className="mt-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Card {currentCardIndex + 1} of {book.flashcards.length}
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((currentCardIndex + 1) / book.flashcards.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Navigation shortcuts */}
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentCardIndex === 0}
                onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentCardIndex === book.flashcards.length - 1}
                onClick={() => setCurrentCardIndex(Math.min(book.flashcards.length - 1, currentCardIndex + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No flashcards available for this book.
            </p>
            {onEdit && (
              <Button variant="outline" className="mt-4" onClick={() => onEdit(book)}>
                <Edit className="h-4 w-4 mr-2" />
                Add Flashcards
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}