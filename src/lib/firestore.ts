
// lib/firestore.ts
import { 
    doc, 
    collection, 
    addDoc, 
    updateDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    serverTimestamp,
    deleteDoc,
    getDoc,
    Timestamp
  } from 'firebase/firestore'
  import { db } from '@/lib/firebase' // Your Firebase config

  export interface QuizQuestion {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
  }
  
  export interface Book {
    id?: string
    userId: string
    title: string
    flashcards: Flashcard[]
    quiz?: QuizQuestion[]
    createdAt: any
    updatedAt: any
    documentContent?: string 
  }
  
  export interface Flashcard {
    front: string
    back: string
  }
  
  export interface SaveFlashcardsParams {
    userId: string
    bookId?: string // If updating existing book
    bookTitle: string
    flashcards: Flashcard[]
    documentContent?: string
  }

  export interface SaveQuizParams {
    userId: string;
    bookId?: string;
    bookTitle: string;
    quiz: QuizQuestion[];
    documentContent?: string;
  }
  
  // Save or update flashcards for a book
  export async function saveFlashcardsToFirestore({
    userId,
    bookId,
    bookTitle,
    flashcards,
    documentContent
  }: SaveFlashcardsParams): Promise<string> {
    try {
      const bookData: Partial<Book> & { userId: string; title: string; flashcards: Flashcard[]; updatedAt: any } = {
        userId,
        title: bookTitle,
        flashcards,
        documentContent,
        updatedAt: serverTimestamp(),
      }

      if (bookId) {
        // Update existing book
        const bookRef = doc(db, 'books', bookId)
        await updateDoc(bookRef, bookData)
        return bookId
      } else {
        // Create new book
        const booksCollection = collection(db, 'books')
        const docRef = await addDoc(booksCollection, {
            ...bookData,
            createdAt: serverTimestamp(),
            flashcards: bookData.flashcards,
        })
        return docRef.id
      }
    } catch (error) {
      console.error('Error saving flashcards:', error)
      throw new Error('Failed to save flashcards')
    }
  }

  export async function saveQuizToFirestore({
    userId,
    bookId,
    bookTitle,
    quiz,
    documentContent,
  }: SaveQuizParams): Promise<string> {
    try {
      const bookData: Partial<Book> & {
        userId: string;
        title: string;
        quiz: QuizQuestion[];
        updatedAt: any;
      } = {
        userId,
        title: bookTitle,
        quiz,
        documentContent,
        updatedAt: serverTimestamp(),
      };
  
      if (bookId) {
        // Update existing book
        const bookRef = doc(db, "books", bookId);
        await updateDoc(bookRef, bookData);
        return bookId;
      } else {
        // Create new book
        const booksCollection = collection(db, "books");
        const docRef = await addDoc(booksCollection, {
          ...bookData,
          createdAt: serverTimestamp(),
          flashcards: [], // Initialize with empty flashcards
        });
        return docRef.id;
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      throw new Error("Failed to save quiz");
    }
  }
  
  // Get all books for a user
  export async function getUserBooks(userId: string): Promise<Book[]> {
    try {
      const booksCollection = collection(db, 'books')
      const q = query(
        booksCollection,
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      const books: Book[] = []
      
      querySnapshot.forEach((doc) => {
        books.push({
          id: doc.id,
          ...doc.data()
        } as Book)
      })

      // Sort books by updatedAt timestamp descending
      books.sort((a, b) => {
        const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(0);
        const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      return books
    } catch (error) {
      console.error('Error fetching user books:', error)
      throw new Error('Failed to fetch books')
    }
  }
  
  // Get a specific book by ID
  export async function getBookById(bookId: string, userId: string): Promise<Book | null> {
    try {
        const bookRef = doc(db, 'books', bookId);
        const bookDoc = await getDoc(bookRef);

        if (bookDoc.exists() && bookDoc.data().userId === userId) {
            return { id: bookDoc.id, ...bookDoc.data() } as Book;
        }
        return null;
    } catch (error) {
        console.error('Error fetching book:', error);
        throw new Error('Failed to fetch book');
    }
  }
  
  // Delete a book
  export async function deleteBook(bookId: string): Promise<void> {
    try {
      const bookRef = doc(db, 'books', bookId)
      await deleteDoc(bookRef)
    } catch (error) {
      console.error('Error deleting book:', error)
      throw new Error('Failed to delete book')
    }
  }
  
  // Search books by title
  export async function searchUserBooks(userId: string, searchTerm: string): Promise<Book[]> {
    try {
      const books = await getUserBooks(userId)
      const searchLower = searchTerm.toLowerCase()
      
      return books.filter(book => 
        book.title.toLowerCase().includes(searchLower) ||
        (book.documentContent && book.documentContent.toLowerCase().includes(searchLower))
      )
    } catch (error) {
      console.error('Error searching books:', error)
      throw new Error('Failed to search books')
    }
  }
