
import { Flame, Library, Star, type LucideIcon, Rocket, Trophy, BookHeart, LibraryBig, Medal, Gem } from "lucide-react";

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    category: 'Streak' | 'Librarian' | 'Quiz';
}

export const badges: Record<string, Badge> = {
    // Streak Badges
    STREAK_5: {
        id: 'STREAK_5',
        name: '5-Day Streak',
        description: 'Maintain a study streak for 5 consecutive days.',
        icon: Flame,
        category: 'Streak'
    },
    STREAK_10: {
        id: 'STREAK_10',
        name: 'Rocket Fuel',
        description: 'Maintain a study streak for 10 consecutive days.',
        icon: Rocket,
        category: 'Streak'
    },
    STREAK_30: {
        id: 'STREAK_30',
        name: 'Streak Champion',
        description: 'Maintain a study streak for 30 consecutive days. Incredible!',
        icon: Trophy,
        category: 'Streak'
    },
    // Librarian Badges
    LIBRARIAN_1: {
        id: 'LIBRARIAN_1',
        name: 'First Chapter',
        description: 'Create your first study book.',
        icon: BookHeart,
        category: 'Librarian'
    },
    LIBRARIAN_5: {
        id: 'LIBRARIAN_5',
        name: 'Bookworm',
        description: 'Create 5 study books.',
        icon: Library,
        category: 'Librarian'
    },
    LIBRARIAN_10: {
        id: 'LIBRARIAN_10',
        name: 'Head Librarian',
        description: 'Create 10 study books.',
        icon: LibraryBig,
        category: 'Librarian'
    },
    // Quiz Badges
    QUIZ_MASTER_1: {
        id: 'QUIZ_MASTER_1',
        name: 'Perfect Score',
        description: 'Get a 100% score on a quiz.',
        icon: Star,
        category: 'Quiz'
    },
    QUIZ_MASTER_5: {
        id: 'QUIZ_MASTER_5',
        name: 'Quiz Whiz',
        description: 'Get a perfect score on 5 different quizzes.',
        icon: Medal,
        category: 'Quiz'
    },
    QUIZ_MASTER_10: {
        id: 'QUIZ_MASTER_10',
        name: 'Quiz Legend',
        description: 'Get a perfect score on 10 different quizzes.',
        icon: Gem,
        category: 'Quiz'
    }
};

export const allBadges: Badge[] = Object.values(badges);
