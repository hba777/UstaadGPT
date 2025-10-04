import { Timestamp } from "firebase/firestore";

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
    name: string;
    createdAt: Timestamp;
    questions: QuizQuestion[];
  }

  export interface SavedFlashcardSet {
    id: string;
    createdAt: Timestamp;
    cards: Flashcard[];
  }

  export interface QuizAttempt {
    userId: string;
    bookId: string;
    quizSetId: string;
    score: number; // e.g., 80 for 80%
    timeTaken: number; // in seconds
    attemptedAt: Timestamp;
  }
  
  export interface Book {
    id?: string
    userId: string
    title: string
    flashcards: Flashcard[] // Represents the latest/active flashcards
    quiz?: QuizQuestion[] // Represents the latest/active quiz
    savedFlashcards: SavedFlashcardSet[]
    savedQuizzes: SavedQuizSet[]
    createdAt: any
    updatedAt: any
    documentContent?: string[] | string
  }
  
  export interface SaveBookParams {
    userId: string;
    bookId?: string; // If updating existing book
    bookTitle: string;
    documentContent?: string[] | string;
    flashcards?: Flashcard[];
    quiz?: QuizQuestion[];
    saveNewQuizSet?: boolean;
    quizSetName?: string;
    saveNewFlashcardSet?: boolean;
  }
  