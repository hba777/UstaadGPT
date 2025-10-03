
"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getBookById, type Book } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext"
import { AITools } from "@/components/study/ai-tools"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Book as BookIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentView } from "@/components/study/document-view"

export default function BookDetailPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const params = useParams()
  const bookId = params.bookId as string
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchBook = async (id: string, uid: string) => {
    setIsLoading(true)
    try {
      const fetchedBook = await getBookById(id, uid)
      setBook(fetchedBook)
    } catch (error) {
      console.error("Failed to fetch book", error)
      setBook(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid && bookId) {
      fetchBook(bookId, user.uid)
    }
  }, [user?.uid, bookId])

  const handleBookUpdate = (updatedBook: Book) => {
    setBook(updatedBook);
  }
  
  const handleBackToBooks = () => {
    router.push('/my-books')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 h-full p-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-36" />
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

  let fullTextContent = '';
    if (Array.isArray(book.documentContent)) {
      fullTextContent = (book.documentContent || []).join('\n\n');
    } else if (typeof book.documentContent === 'string') {
      fullTextContent = book.documentContent;
    }
  
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b">
            <Button variant="outline" size="sm" onClick={handleBackToBooks}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2 min-w-0">
                <BookIcon className="h-5 w-5 flex-shrink-0" />
                <h1 className="text-lg font-semibold truncate">{book.title}</h1>
            </div>
        </div>
       <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg border">
        <ResizablePanel defaultSize={50} minSize={30}>
            <div className="p-6 h-full min-w-0">
                <DocumentView pages={Array.isArray(book.documentContent) ? book.documentContent : (book.documentContent ? [book.documentContent] : [])} />
            </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
            <div className="p-6 h-full">
                <AITools 
                  documentContent={fullTextContent}
                  book={book} 
                  onBookUpdate={handleBookUpdate}
                />
            </div>
        </ResizablePanel>
       </ResizablePanelGroup>
    </div>
  )
}
