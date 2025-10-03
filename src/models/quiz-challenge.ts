
import type { Timestamp } from "firebase/firestore";

export interface QuizChallenge {
  id: string; // doc id
  bookId: string;
  bookTitle: string;
  quizSetId: string;
  
  challengerUid: string;
  challengerName: string;
  challengerPhotoURL: string;
  challengerScore: number | null;
  
  recipientUid: string;
  recipientName: string;
  recipientPhotoURL: string;
  recipientScore: number | null;
  
  status: 'pending' | 'declined' | 'completed' | 'in-progress';
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  
  winnerUid: string | 'draw' | null;
}
