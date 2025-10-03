// src/models/user.ts

import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  createdAt: Timestamp;
  points: number;
  loginStreak: number;
  lastLogin: Timestamp;
  badges?: string[];
}
