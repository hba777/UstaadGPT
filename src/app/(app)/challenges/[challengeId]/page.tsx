
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { getBookById, type SavedQuizSet } from '@/lib/firestore';
import { type QuizChallenge } from '@/models/quiz-challenge';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Award, Check, X, ArrowLeft, LoaderCircle, Swords } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type QuizState = "in_progress" | "submitted";

export default function TakeChallengePage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const challengeId = params.challengeId as string;

    const [challenge, setChallenge] = useState<QuizChallenge | null>(null);
    const [quizSet, setQuizSet] = useState<SavedQuizSet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isChallenger, setIsChallenger] = useState(false);

    const [quizState, setQuizState] = useState<QuizState>("in_progress");
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (!user || !challengeId) return;

        const fetchChallengeData = async () => {
            setIsLoading(true);
            try {
                const challengeDocRef = doc(db, 'quizChallenges', challengeId);
                const challengeDoc = await getDoc(challengeDocRef);

                if (!challengeDoc.exists()) {
                    throw new Error("Challenge not found.");
                }

                const challengeData = { id: challengeDoc.id, ...challengeDoc.data() } as QuizChallenge;
                
                if (challengeData.recipientUid !== user.uid && challengeData.challengerUid !== user.uid) {
                    throw new Error("You are not a participant in this challenge.");
                }
                
                if (challengeData.status === 'completed') {
                    router.replace('/challenges');
                    toast({title: "This challenge has already been completed."})
                    return;
                }

                const currentUserIsChallenger = challengeData.challengerUid === user.uid;
                setIsChallenger(currentUserIsChallenger);

                // Check if user has already submitted a score
                if ((currentUserIsChallenger && challengeData.challengerScore !== null) || (!currentUserIsChallenger && challengeData.recipientScore !== null)) {
                    router.replace('/challenges');
                    toast({ title: "You have already completed this challenge." });
                    return;
                }
                
                setChallenge(challengeData);

                const bookOwnerUid = challengeData.challengerUid;
                const book = await getBookById(challengeData.bookId, bookOwnerUid);
                if (!book) {
                    throw new Error("The book for this challenge could not be found.");
                }

                const targetQuizSet = book.savedQuizzes.find(qs => qs.id === challengeData.quizSetId);
                if (!targetQuizSet) {
                    throw new Error("The quiz for this challenge could not be found.");
                }

                setQuizSet(targetQuizSet);

                // Update status to 'in-progress' if it's the first person to start
                if (challengeData.status === 'pending') {
                    await updateDoc(challengeDocRef, { status: 'in-progress' });
                }


            } catch (err: any) {
                setError(err.message);
                toast({ variant: "destructive", title: "Error", description: err.message });
            } finally {
                setIsLoading(false);
            }
        };

        fetchChallengeData();
    }, [user, challengeId, router, toast]);

    const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
    };

    const handleSubmit = async () => {
        if (!challenge || !quizSet || !user) return;
    
        let newScore = 0;
        quizSet.questions.forEach((q, i) => {
            if (userAnswers[i] === q.correctAnswerIndex) {
                newScore++;
            }
        });
    
        setScore(newScore);
        setQuizState("submitted");
    
        try {
            const challengeDocRef = doc(db, 'quizChallenges', challengeId);
            
            // Prepare update for current user
            const scoreFieldToUpdate = isChallenger ? { challengerScore: newScore } : { recipientScore: newScore };
            await updateDoc(challengeDocRef, scoreFieldToUpdate);
            
            // Now, get the latest state of the challenge
            const updatedChallengeDoc = await getDoc(challengeDocRef);
            if(!updatedChallengeDoc.exists()) throw new Error("Challenge vanished");
            const currentData = updatedChallengeDoc.data() as QuizChallenge;
            
            // Check if both players have submitted scores
            if (currentData.challengerScore !== null && currentData.recipientScore !== null) {
                let winnerUid: QuizChallenge['winnerUid'] = null;
                if (currentData.recipientScore > currentData.challengerScore) {
                    winnerUid = currentData.recipientUid;
                } else if (currentData.challengerScore > currentData.recipientScore) {
                    winnerUid = currentData.challengerUid;
                } else {
                    winnerUid = 'draw';
                }

                await updateDoc(challengeDocRef, {
                    status: 'completed',
                    completedAt: serverTimestamp(),
                    winnerUid: winnerUid,
                });

                toast({ title: "Challenge Complete!", description: `The results are in. You scored ${newScore}/${quizSet.questions.length}.` });
            } else {
                toast({ title: "Score Submitted!", description: `You scored ${newScore}/${quizSet.questions.length}. Waiting for the other player.` });
            }

        } catch (err) {
            console.error("Error updating challenge:", err);
            toast({ variant: "destructive", title: "Error", description: "Could not save your score." });
        }
    };
    

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
    }

    if (error) {
        return (
            <div className="text-center p-10">
                <h2 className="text-xl font-semibold text-destructive">Error Loading Challenge</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => router.push('/challenges')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }
    
    if (!challenge || !quizSet) {
        return <div className="p-8"><LoaderCircle className="mx-auto animate-spin" /></div>;
    }

    const allQuestionsAnswered = Object.keys(userAnswers).length === quizSet.questions.length;
    const opponentName = isChallenger ? challenge.recipientName : challenge.challengerName;
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Swords className="h-8 w-8" />
                <h1 className="text-3xl font-bold tracking-tight">Quiz Challenge</h1>
            </div>
            <p className="text-muted-foreground">
                You are playing against <span className="font-semibold">{opponentName}</span> on the book "{challenge.bookTitle}". Good luck!
            </p>

            <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm p-4 overflow-hidden min-h-0">
                <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
                     <div className="space-y-6">
                        {quizState === "submitted" && (
                            <Card className="text-center bg-accent/10 border-accent/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-center gap-2">
                                        <Award className="text-accent" />
                                        Your Score
                                    </CardTitle>
                                    <CardDescription>Results will be available once both players have finished.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                <p className="text-5xl font-bold">{Math.round((score / quizSet.questions.length) * 100)}%</p>
                                <p className="text-muted-foreground mt-1">({score} out of {quizSet.questions.length} correct)</p>
                                <Progress value={(score / quizSet.questions.length) * 100} className="w-full mt-4" />
                                <Button onClick={() => router.push('/challenges')} className="w-full mt-6">
                                    Back to Challenges
                                </Button>
                                </CardContent>
                            </Card>
                        )}
                        {quizState !== "submitted" && quizSet.questions.map((question, qIndex) => (
                             <Card key={qIndex}>
                                <CardHeader>
                                    <CardTitle className="text-base flex justify-between items-start">
                                        <span>Question {qIndex + 1}</span>
                                    </CardTitle>
                                    <CardDescription className="text-base text-foreground pt-2">{question.questionText}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={userAnswers[qIndex]?.toString()}
                                        onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}
                                        disabled={quizState === "submitted"}
                                    >
                                        {question.options.map((option, oIndex) => (
                                             <div key={oIndex} className={cn(
                                                "flex items-center space-x-3 p-3 rounded-md transition-colors",
                                                "hover:bg-muted/50 cursor-pointer",
                                            )}>
                                                <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}o${oIndex}`} />
                                                <Label htmlFor={`q${qIndex}o${oIndex}`} className={"flex-1 cursor-pointer"}>
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        ))}

                        {quizState === "in_progress" && (
                            <Button onClick={handleSubmit} disabled={!allQuestionsAnswered} className="w-full">
                                Submit Quiz
                            </Button>
                        )}
                     </div>
                </ScrollArea>
            </div>
        </div>
    )

}
