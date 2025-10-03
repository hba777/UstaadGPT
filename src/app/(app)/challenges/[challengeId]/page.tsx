
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { getBookById, type Book, type SavedQuizSet } from '@/lib/firestore';
import { type QuizChallenge } from '@/models/quiz-challenge';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Award, Check, X, Repeat, LoaderCircle, Swords, ArrowLeft } from 'lucide-react';
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

                const challengeData = challengeDoc.data() as QuizChallenge;
                if (challengeData.recipientUid !== user.uid) {
                    throw new Error("You are not the recipient of this challenge.");
                }
                 if (challengeData.status !== 'pending') {
                    router.replace('/challenges');
                    toast({title: "This challenge has already been completed or declined."})
                    return;
                }

                setChallenge(challengeData);

                const book = await getBookById(challengeData.bookId, challengeData.challengerUid);
                if (!book) {
                    throw new Error("The book for this challenge could not be found.");
                }

                const targetQuizSet = book.savedQuizzes.find(qs => qs.id === challengeData.quizSetId);
                if (!targetQuizSet) {
                    throw new Error("The quiz for this challenge could not be found.");
                }

                setQuizSet(targetQuizSet);
                 await updateDoc(challengeDocRef, { status: 'in-progress' });


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
        if (!challenge || !quizSet) return;
    
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
            const challengeDoc = await getDoc(challengeDocRef); // Re-fetch to be safe
            if(!challengeDoc.exists()) throw new Error("Challenge vanished");

            const currentData = challengeDoc.data() as QuizChallenge;
            
            // Wait for challenger to submit their score if they haven't yet
            if(currentData.challengerScore === null) {
                // In a real app you might use a transaction or a cloud function to handle this race condition
                // For now, we'll just optimistically update.
                toast({title: "Waiting for challenger...", description: "Your score will be recorded when the challenger completes their side."})
            }

            const challengerScore = currentData.challengerScore ?? 0; // Assume 0 if null
            
            let winnerUid: QuizChallenge['winnerUid'] = null;
            if (newScore > challengerScore) {
                winnerUid = challenge.recipientUid;
            } else if (challengerScore > newScore) {
                winnerUid = challenge.challengerUid;
            } else {
                winnerUid = 'draw';
            }

            await updateDoc(challengeDocRef, {
                recipientScore: newScore,
                status: 'completed',
                completedAt: serverTimestamp(),
                winnerUid: winnerUid,
            });

            toast({ title: "Challenge Complete!", description: `You scored ${newScore}/${quizSet.questions.length}.` });

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
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Swords className="h-8 w-8" />
                <h1 className="text-3xl font-bold tracking-tight">Quiz Challenge</h1>
            </div>
            <p className="text-muted-foreground">
                You are being challenged by <span className="font-semibold">{challenge.challengerName}</span> on the book "{challenge.bookTitle}". Good luck!
            </p>

            <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm p-4 overflow-hidden min-h-0">
                <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
                     <div className="space-y-6">
                        {quizState === "submitted" && (
                            <Card className="text-center bg-primary/10 border-primary/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-center gap-2">
                                        <Award className="text-yellow-500" />
                                        Challenge Complete!
                                    </CardTitle>
                                    <CardDescription>Your score</CardDescription>
                                </CardHeader>
                                <CardContent>
                                <p className="text-5xl font-bold">{Math.round((score / quizSet.questions.length) * 100)}%</p>
                                <p className="text-muted-foreground mt-1">({score} out of {quizSet.questions.length} correct)</p>
                                <Progress value={(score / quizSet.questions.length) * 100} className="w-full mt-4" />
                                </CardContent>
                            </Card>
                        )}
                        {quizSet.questions.map((question, qIndex) => (
                             <Card key={qIndex} className={cn(
                                'transition-colors duration-300',
                                quizState === 'submitted' && (userAnswers[qIndex] === question.correctAnswerIndex ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10')
                            )}>
                                <CardHeader>
                                    <CardTitle className="text-base flex justify-between items-start">
                                        <span>Question {qIndex + 1}</span>
                                        {quizState === 'submitted' && (
                                            userAnswers[qIndex] === question.correctAnswerIndex ? 
                                            <Check className="h-5 w-5 text-green-700 flex-shrink-0" /> : 
                                            <X className="h-5 w-5 text-red-700 flex-shrink-0" />
                                        )}
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
                                                quizState === "submitted" && (oIndex === question.correctAnswerIndex) && "bg-green-500/20",
                                                quizState === "submitted" && (userAnswers[qIndex] === oIndex) && (oIndex !== question.correctAnswerIndex) && "bg-red-500/20",
                                                quizState !== "submitted" && "hover:bg-muted/50 cursor-pointer",
                                                quizState === "submitted" && "cursor-default"
                                            )}>
                                                <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}o${oIndex}`} />
                                                <Label htmlFor={`q${qIndex}o${oIndex}`} className={cn("flex-1", quizState !== 'submitted' ? 'cursor-pointer' : 'cursor-default')}>
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
                         {quizState === "submitted" && (
                            <Button onClick={() => router.push('/challenges')} className="w-full">
                                Back to Challenges
                            </Button>
                        )}
                     </div>
                </ScrollArea>
            </div>
        </div>
    )

}
