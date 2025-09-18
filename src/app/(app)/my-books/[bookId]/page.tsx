
"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getBookById, type Book } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext"
import { BookFlashcardsView } from "@/components/study/book-flashcards-view"
import { FlashcardView } from "@/components/study/flashcard-view"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type ViewMode = 'view-book' | 'edit-book'

export default function BookDetailPage({ params }: { params: { bookId: string } }) {
  const { user } = useAuthContext()
  const router = useRouter()
  const { bookId } = params
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('view-book')

  useEffect(() => {
    if (user?.uid && bookId) {
      const fetchBook = async () => {
        setIsLoading(true)
        try {
          const fetchedBook = await getBookById(bookId, user.uid)
          setBook(fetchedBook)
        } catch (error) {
          console.error("Failed to fetch book", error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchBook()
    }
  }, [user?.uid, bookId])
  
  const handleBackToBooks = () => {
    router.push('/my-books')
  }

  const handleEdit = (book: Book) => {
    setBook(book)
    setViewMode('edit-book')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 h-full p-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="w-full flex-grow" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl font-semibold">Book not found</h2>
        <p className="text-muted-foreground">This book may have been deleted or does not exist.</p>
        <Button onClick={handleBackToBooks} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Books
        </Button>
      </div>
    )
  }
  
  return (
    <div className="h-full p-6">
      {viewMode === 'view-book' && (
        <BookFlashcardsView
          book={book}
          onBack={handleBackToBooks}
          onEdit={handleEdit}
        />
      )}
      {viewMode === 'edit-book' && (
        <FlashcardView
          documentContent={book.documentContent || ""}
          bookId={book.id}
          bookName={book.title}
        />
      )}
    </div>
  )
}
