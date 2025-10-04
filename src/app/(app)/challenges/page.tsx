
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords, ArrowRight, Trophy, Clock, CheckCircle, HelpCircle } from 'lucide-react';
import type { QuizChallenge } from '@/models/quiz-challenge';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type ChallengeWithId = QuizChallenge & { id: string };

function ChallengeCard({ challenge, type }: { challenge: ChallengeWithId; type: 'incoming' | 'sent' }) {
    const router = useRouter();
    const { user } = useAuthContext();
    if (!user) return null;
    
    const isWinner = challenge.winnerUid === user?.uid;
    const isLoser = challenge.winnerUid !== null && challenge.winnerUid !== 'draw' && challenge.winnerUid !== user?.uid;
    const isDraw = challenge.winnerUid === 'draw';

    const handleTakeQuiz = () => {
        router.push(`/challenges/${challenge.id}`);
    }

    const opponent = type === 'incoming' 
        ? { name: challenge.challengerName, photo: challenge.challengerPhotoURL, score: challenge.challengerScore }
        : { name: challenge.recipientName, photo: challenge.recipientPhotoURL, score: challenge.recipientScore };
    
    const currentUserPlayer = type === 'incoming' 
        ? { name: challenge.recipientName, photo: challenge.recipientPhotoURL, score: challenge.recipientScore }
        : { name: challenge.challengerName, photo: challenge.challengerPhotoURL, score: challenge.challengerScore };

    const hasCurrentUserPlayed = currentUserPlayer.score !== null;

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{challenge.bookTitle}</CardTitle>
                    {challenge.status === 'completed' && (
                        <div className={cn("flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full", 
                            isWinner && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            isLoser && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                            isDraw && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                        )}>
                            <Trophy className="h-4 w-4"/>
                            {isWinner ? 'You Won' : isLoser ? 'You Lost' : 'Draw'}
                        </div>
                    )}
                     {challenge.status === 'pending' && (
                        <div className="flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                           <Clock className="h-4 w-4"/>
                            Pending
                        </div>
                    )}
                     {challenge.status === 'in-progress' && (
                        <div className="flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                           <Swords className="h-4 w-4"/>
                            In Progress
                        </div>
                    )}
                </div>
                <CardDescription>
                    {type === 'incoming' ? `From: ${opponent.name}` : `To: ${opponent.name}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="text-center relative">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={currentUserPlayer.photo || undefined} />
                                <AvatarFallback>{currentUserPlayer.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="text-lg font-bold mt-1">{currentUserPlayer.score ?? '-'}</p>
                            <p className="text-xs text-muted-foreground">{currentUserPlayer.name.split(' ')[0]}</p>
                        </div>
                        <span className="text-muted-foreground font-bold text-sm">vs</span>
                         <div className="text-center relative">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={opponent.photo || undefined} />
                                <AvatarFallback>{opponent.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="text-lg font-bold mt-1">{opponent.score ?? '-'}</p>
                            <p className="text-xs text-muted-foreground">{opponent.name.split(' ')[0]}</p>
                        </div>
                    </div>

                    {!hasCurrentUserPlayed && (challenge.status === 'pending' || challenge.status === 'in-progress') && (
                        <Button onClick={handleTakeQuiz}>
                            {type === 'incoming' ? "Accept & Play" : "Take Quiz"} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}

                    {hasCurrentUserPlayed && challenge.status !== 'completed' && (
                         <Button variant="secondary" disabled>
                            <Clock className="mr-2 h-4 w-4" /> Waiting for opponent
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


function ChallengeList({ type }: { type: 'incoming' | 'sent' }) {
    const { user } = useAuthContext();
    const [challenges, setChallenges] = useState<ChallengeWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        const challengesRef = collection(db, 'quizChallenges');
        const field = type === 'incoming' ? 'recipientUid' : 'challengerUid';

        const q = query(
            challengesRef,
            where(field, '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const challengeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChallengeWithId));
            
            // Sort client-side
            challengeList.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
                const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
                return dateB - dateA;
            });
            
            setChallenges(challengeList);
            setIsLoading(false);
        }, (error) => {
            console.error(`Error fetching ${type} challenges:`, error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, type]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
        );
    }

    if (challenges.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-semibold">No {type} challenges</p>
                {type === 'sent' && <p className="text-sm text-muted-foreground mt-1">Challenge a friend from the Quiz Generator!</p>}
                {type === 'incoming' && <p className="text-sm text-muted-foreground mt-1">When a friend challenges you, it will appear here.</p>}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {challenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} type={type} />
            ))}
        </div>
    );
}

export default function ChallengesPage() {
    return (
        <div className="space-y-8">
             <div>
                <div className="flex items-center gap-2 mb-2">
                    <Swords className="h-8 w-8" />
                    <h1 className="text-3xl font-bold tracking-tight">Quiz Challenges</h1>
                </div>
                <p className="text-muted-foreground">
                    Accept challenges from friends or check the status of challenges you've sent.
                </p>
            </div>
             <Tabs defaultValue="incoming">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="incoming">Incoming</TabsTrigger>
                    <TabsTrigger value="sent">Sent</TabsTrigger>
                </TabsList>
                <TabsContent value="incoming" className="mt-6">
                    <ChallengeList type="incoming" />
                </TabsContent>
                <TabsContent value="sent" className="mt-6">
                    <ChallengeList type="sent" />
                </TabsContent>
             </Tabs>
        </div>
    );
}
