
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Book as BookIcon, Trash2, Eye, Plus, Library } from "lucide-react"
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
import { getUserBooks, deleteBook, type Book } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext"

export default function MyBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null)
  const { user } = useAuthContext()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user?.uid) {
      loadBooks()
    }
  }, [user?.uid])

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

  const handleBookSelect = (book: Book) => {
    if (book.id) {
      router.push(`/my-books/${book.id}`)
    }
  }
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-8">
       <div>
        <div className="flex items-center gap-2 mb-2">
           <Library className="h-8 w-8" />
           <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
        </div>
        <p className="text-muted-foreground">
          Review and manage all your saved study materials.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <BookIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold">
            {searchTerm ? "No books found" : "No books yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm 
                ? "Try a different search term." 
                : "Go to the 'Study' page to generate your first book."}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={() => router.push('/study')}>
              <Plus className="h-4 w-4 mr-2" />
              Create a Book
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <Card key={book.id}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold truncate" title={book.title}>
                  {book.title}
                </CardTitle>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary" className="text-xs">
                    {book.flashcards.length} cards
                  </Badge>
                  {book.updatedAt && (
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(book.updatedAt)}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBookSelect(book)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Study
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingBookId === book.id}
                      >
                        <Trash2 className="h-4 w-4" />
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
  )
}
