
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
    Timestamp,
    setDoc,
    arrayUnion,
    arrayRemove
  } from 'firebase/firestore'
  import { db } from '@/lib/firebase' // Your Firebase config

  export interface QuizQuestion {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
  }

  export interface Flashcard {
    front: string
    back: string
  }

  export interface SavedQuizSet {
    id: string;
    createdAt: Timestamp;
    questions: QuizQuestion[];
  }

  export interface SavedFlashcardSet {
    id: string;
    createdAt: Timestamp;
    cards: Flashcard[];
  }
  
  export interface Book {
    id?: string
    userId: string
    title: string
    flashcards: Flashcard[] // Represents the latest/active flashcards
    quiz?: QuizQuestion[] // Represents the latest/active quiz
    savedFlashcards?: SavedFlashcardSet[]
    savedQuizzes?: SavedQuizSet[]
    createdAt: any
    updatedAt: any
    documentContent?: string 
  }
  
  export interface SaveBookParams {
    userId: string;
    bookId?: string; // If updating existing book
    bookTitle: string;
    documentContent?: string;
    flashcards?: Flashcard[];
    quiz?: QuizQuestion[];
    saveNewQuizSet?: boolean;
    saveNewFlashcardSet?: boolean;
  }
  
  // Save or update a book
  export async function saveBook({
    userId,
    bookId,
    bookTitle,
    documentContent,
    flashcards,
    quiz,
    saveNewFlashcardSet,
    saveNewQuizSet,
  }: SaveBookParams): Promise<Book> {
    try {
      const isUpdating = !!bookId;
      const bookRef = isUpdating ? doc(db, 'books', bookId) : doc(collection(db, 'books'));
      
      const bookData: Partial<Book> & { updatedAt: any } = {
        userId,
        title: bookTitle,
        updatedAt: serverTimestamp(),
      };
  
      if (documentContent !== undefined) bookData.documentContent = documentContent;
      
      const updatePayload: any = {
        title: bookTitle,
        updatedAt: serverTimestamp(),
      };

      if (isUpdating) {
        if (flashcards) {
          updatePayload.flashcards = flashcards;
          if (saveNewFlashcardSet) {
            updatePayload.savedFlashcards = arrayUnion({
              id: crypto.randomUUID(),
              createdAt: new Date(),
              cards: flashcards,
            });
          }
        }
        if (quiz) {
          updatePayload.quiz = quiz;
           if (saveNewQuizSet) {
            updatePayload.savedQuizzes = arrayUnion({
              id: crypto.randomUUID(),
              createdAt: new Date(),
              questions: quiz,
            });
          }
        }
        await updateDoc(bookRef, updatePayload);
      } else {
        // Create new book
        bookData.createdAt = serverTimestamp();
        bookData.flashcards = flashcards || [];
        bookData.quiz = quiz || [];
        bookData.savedFlashcards = flashcards ? [{ id: crypto.randomUUID(), createdAt: new Date() as any, cards: flashcards }] : [];
        bookData.savedQuizzes = quiz ? [{ id: crypto.randomUUID(), createdAt: new Date() as any, questions: quiz }] : [];
        await setDoc(bookRef, bookData, { merge: true });
      }

      const savedDoc = await getDoc(bookRef);
      if (!savedDoc.exists()) {
        throw new Error("Failed to retrieve saved book");
      }
      return { id: savedDoc.id, ...savedDoc.data() } as Book;

    } catch (error) {
      console.error('Error saving book:', error);
      throw new Error('Failed to save book');
    }
  }

  // Delete a saved quiz set from a book
  export async function deleteSavedQuizSet(bookId: string, quizSet: SavedQuizSet): Promise<void> {
    try {
      const bookRef = doc(db, 'books', bookId);
      await updateDoc(bookRef, {
        savedQuizzes: arrayRemove(quizSet)
      });
    } catch (error) {
      console.error('Error deleting saved quiz set:', error);
      throw new Error('Failed to delete quiz set.');
    }
  }

  // Delete a saved flashcard set from a book
  export async function deleteSavedFlashcardSet(bookId: string, flashcardSet: SavedFlashcardSet): Promise<void> {
    try {
      const bookRef = doc(db, 'books', bookId);
      await updateDoc(bookRef, {
        savedFlashcards: arrayRemove(flashcardSet)
      });
    } catch (error) {
      console.error('Error deleting saved flashcard set:', error);
      throw new Error('Failed to delete flashcard set.');
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
