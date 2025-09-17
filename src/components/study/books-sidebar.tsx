"use client"
import { useState, useEffect } from "react"
import { Search, Book as BookIcon, Trash2, Eye, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getUserBooks, searchUserBooks, deleteBook } from "@/lib/firestore"
import type { Book } from "@/lib/firestore"
import { useAuth } from "@/hooks/use-auth"

interface BooksSidebarProps {
  onBookSelect: (book: Book) => void
  selectedBookId?: string
  className?: string
}

export function BooksSidebar({ onBookSelect, selectedBookId, className = "" }: BooksSidebarProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Load user books
  useEffect(() => {
    if (user?.uid) {
      loadBooks()
    }
  }, [user?.uid])

  // Filter books based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBooks(books)
    } else {
      const filtered = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredBooks(filtered)
    }
  }, [books, searchTerm])

  const loadBooks = async () => {
    if (!user?.uid) return

    setIsLoading(true)
    try {
      const userBooks = await getUserBooks(user.uid)
      setBooks(userBooks)
    } catch (error) {
      console.error("Error loading books:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your books.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    setDeletingBookId(bookId)
    try {
      await deleteBook(bookId)
      setBooks(prev => prev.filter(book => book.id !== bookId))
      toast({
        title: "Book Deleted",
        description: `"${bookTitle}" has been deleted.`,
      })
    } catch (error) {
      console.error("Error deleting book:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete book.",
      })
    } finally {
      setDeletingBookId(null)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  if (!user) {
    return (
      <div className={`p-4 ${className}`}>
        <p className="text-sm text-muted-foreground text-center">
          Sign in to view your books
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <BookIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">My Books</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-8">
            <BookIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "No books found" : "No books yet"}
            </p>
            {!searchTerm && (
              <p className="text-xs text-muted-foreground mt-2">
                Upload a PDF and generate flashcards to get started
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBooks.map((book) => (
              <Card
                key={book.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedBookId === book.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium truncate">
                    {book.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {book.flashcards.length} cards
                    </Badge>
                    {book.updatedAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(book.updatedAt)}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onBookSelect(book)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deletingBookId === book.id}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Book</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{book.title}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              book.id && handleDeleteBook(book.id, book.title)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
