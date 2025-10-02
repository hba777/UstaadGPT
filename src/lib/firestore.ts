
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
  
  export interface SaveBookParams {
    userId: string;
    bookId?: string; // If updating existing book
    bookTitle: string;
    documentContent?: string;
    flashcards?: Flashcard[];
    quiz?: QuizQuestion[];
  }
  
  // Save or update a book
  export async function saveBook({
    userId,
    bookId,
    bookTitle,
    documentContent,
    flashcards,
    quiz,
  }: SaveBookParams): Promise<string> {
    try {
      const bookRef = bookId ? doc(db, 'books', bookId) : doc(collection(db, 'books'));
      const bookDoc = bookId ? await getDoc(bookRef) : null;
  
      const bookData: Partial<Book> = {
        userId,
        title: bookTitle,
        updatedAt: serverTimestamp(),
      };
  
      // Only include fields if they are provided
      if (documentContent !== undefined) bookData.documentContent = documentContent;
      if (flashcards !== undefined) bookData.flashcards = flashcards;
      if (quiz !== undefined) bookData.quiz = quiz;
  
      if (bookDoc && bookDoc.exists()) {
        // Update existing book
        await updateDoc(bookRef, bookData);
        return bookId!;
      } else {
        // Create new book
        bookData.createdAt = serverTimestamp();
        // Ensure flashcards/quiz are at least empty arrays on creation
        if (!bookData.flashcards) bookData.flashcards = [];
        if (!bookData.quiz) bookData.quiz = [];

        await addDoc(collection(db, 'books'), bookData);
        return bookRef.id;
      }
    } catch (error) {
      console.error('Error saving book:', error);
      throw new Error('Failed to save book');
    }
  }

  export async function saveFlashcardsToFirestore({
    userId,
    bookId,
    bookTitle,
    flashcards,
    documentContent
  }: SaveBookParams): Promise<string> {
    return saveBook({ userId, bookId, bookTitle, flashcards, documentContent });
  }

  export async function saveQuizToFirestore({
    userId,
    bookId,
    bookTitle,
    quiz,
    documentContent,
  }: SaveBookParams): Promise<string> {
    return saveBook({ userId, bookId, bookTitle, quiz, documentContent });
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

