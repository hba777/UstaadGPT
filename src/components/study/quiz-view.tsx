
"use client"

import { useState, useEffect, useRef } from "react"
import { Lightbulb, LoaderCircle, Check, X, Repeat, Award, Save, History, Swords, Languages } from "lucide-react"
import { generateQuiz } from "@/ai/flows/generate-quiz"
import { translateText } from "@/ai/flows/translate-text"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { saveBook, awardBadge, logQuizAttempt, type QuizQuestion, type Book, type SavedQuizSet, getBookById } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { SavedQuizzesDialog } from "@/components/study/saved-quizzes-dialog"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile } from "@/models/user"
import { ChallengeFriendDialog } from "./challenge-friend-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


type QuizState = "not_started" | "in_progress" | "submitted"

interface QuizViewProps {
    documentContent: string;
    book?: Book | null;
    onBookUpdate: (book: Book) => void;
}

export function QuizView({ documentContent, book: initialBook, onBookUpdate }: QuizViewProps) {
  const [book, setBook] = useState(initialBook);
  const [activeQuizSet, setActiveQuizSet] = useState<SavedQuizSet | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[] | null>(null);
  
  const [translatedQuiz, setTranslatedQuiz] = useState<QuizQuestion[] | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const quizToDisplay = isTranslated && translatedQuiz ? translatedQuiz : (generatedQuiz ?? activeQuizSet?.questions ?? []);

  const [quizState, setQuizState] = useState<QuizState>("not_started");
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  
  const [currentBookId, setCurrentBookId] = useState(initialBook?.id)
  const [bookTitle, setBookTitle] = useState(initialBook?.title || "")
  const [isSavedSetsOpen, setIsSavedSetsOpen] = useState(false)

  const { toast } = useToast()
  const { user, updateUserProfile } = useAuthContext()
  const router = useRouter()

  const canChallenge = !!book && !!activeQuizSet;

  useEffect(() => {
    setBook(initialBook);
    setIsTranslated(false);
    setTranslatedQuiz(null);

    if (initialBook) {
      const latestSet = initialBook.savedQuizzes?.slice().sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
      setActiveQuizSet(latestSet || null);
      setGeneratedQuiz(null);
      setBookTitle(initialBook.title);
      setCurrentBookId(initialBook.id);
      
      setUserAnswers({});
      setScore(0);
      setQuizState(latestSet ? "in_progress" : "not_started");
      if (latestSet) setQuizStartTime(Date.now());
    } else {
        setBookTitle('');
        setCurrentBookId(undefined);
        setActiveQuizSet(null);
        setGeneratedQuiz(null);
        setQuizState('not_started');
    }
  }, [initialBook]);

  const handleGenerateQuiz = async () => {
    setIsLoading(true)
    setGeneratedQuiz(null);
    setActiveQuizSet(null);
    setTranslatedQuiz(null);
    setIsTranslated(false);
    setUserAnswers({})
    setScore(0)
    setQuizState("in_progress");
    setQuizStartTime(Date.now());

    try {
      const result = await generateQuiz({ documentText: documentContent })
      if (result.quiz.length === 0) {
        toast({
          variant: "destructive",
          title: "Quiz Generation Failed",
          description: "The AI couldn't generate a quiz from this document. Please try a different document.",
        })
        const latestSet = book?.savedQuizzes?.slice().sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
        setQuizState(latestSet ? "in_progress" : "not_started");
        setActiveQuizSet(latestSet || null);
        return
      }
      setGeneratedQuiz(result.quiz)
      setQuizState("in_progress")
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { points: increment(10) });
      }
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
      })
       const latestSet = book?.savedQuizzes?.slice().sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
       setQuizState(latestSet ? "in_progress" : "not_started");
       setActiveQuizSet(latestSet || null);
    } finally {
        setIsLoading(false)
    }
  }

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }))
  }

  const handleSubmit = async () => {
    const originalQuiz = generatedQuiz ?? activeQuizSet?.questions ?? [];
    if (originalQuiz.length === 0) return;

    let newScore = 0
    originalQuiz.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswerIndex) {
        newScore++
      }
    })
    
    setScore(newScore)
    setQuizState("submitted")

    const timeTaken = quizStartTime ? Math.round((Date.now() - quizStartTime) / 1000) : 0;
    const finalScorePercentage = Math.round((newScore / originalQuiz.length) * 100);

    if (user && book && book.id && activeQuizSet && activeQuizSet.id) {
      const attemptData = {
        userId: user.uid,
        bookId: book.id,
        quizSetId: activeQuizSet.id,
        score: finalScorePercentage,
        timeTaken: timeTaken,
      };
      console.log("Attempting to log quiz attempt with data:", attemptData);
      try {
        await logQuizAttempt(attemptData);
        console.log("Quiz attempt logged successfully.");
      } catch (error) {
        console.error("Failed to log quiz attempt from QuizView:", error);
      }
    } else {
        console.log("Skipping quiz attempt log for one of the following reasons:", {
            isUserLoggedIn: !!user,
            isBookSaved: !!book?.id,
            isQuizSetSaved: !!activeQuizSet?.id,
            details: {
                user: user ? user.uid : "no user",
                book: book ? book.id : "no book or book id",
                activeQuizSet: activeQuizSet ? activeQuizSet.id : "no active quiz set or set id",
            }
        });
        if (generatedQuiz) {
            console.log("This was a newly generated quiz. It must be saved before attempts can be logged.");
        }
    }

    const pointsEarned = newScore * 10; // 10 points per correct answer

    if(user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { points: increment(pointsEarned) });

      if (newScore === originalQuiz.length && originalQuiz.length > 0) {
          await awardBadge(user.uid, 'QUIZ_MASTER_1');
          
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
              const userData = userDoc.data() as UserProfile;
              const perfectScoreCount = userData.badges?.filter(b => b === 'QUIZ_MASTER_1' || b === 'QUIZ_MASTER_5').length || 0;
               if (perfectScoreCount >= 4) { // 4 because we award the 5th here.
                  await awardBadge(user.uid, 'QUIZ_MASTER_5');
              }
              const updatedUser = (await getDoc(userRef)).data() as UserProfile;
              updateUserProfile(updatedUser);
          }
          toast({
              title: "Badge Unlocked!",
              description: "You earned the 'Perfect Score' badge and 100 bonus points!",
          })
      } else {
        toast({
          title: "Quiz Submitted!",
          description: `You earned ${pointsEarned} points.`,
        })
      }
      const updatedUser = (await getDoc(userRef)).data() as UserProfile;
      updateUserProfile(updatedUser);
    }
  }

  const handleRetake = () => {
    setUserAnswers({})
    setScore(0)
    setQuizState("in_progress");
    setQuizStartTime(Date.now());
  }
  
  const handleSaveQuiz = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Please sign in to save quizzes." });
        return;
    }
    if (!bookTitle.trim()) {
        toast({ variant: "destructive", title: "Please enter a book title." });
        return;
    }
    
    const quizToSave = generatedQuiz;
    if (!quizToSave || quizToSave.length === 0) {
        toast({ variant: "destructive", title: "Generate a new quiz before saving." });
        return;
    }

    setIsSaving(true);
    try {
        const saveParams: {
          userId: string;
          bookId?: string;
          bookTitle: string;
          quiz: QuizQuestion[];
          saveNewQuizSet: boolean;
          documentContent?: string;
        } = {
            userId: user.uid,
            bookId: currentBookId,
            bookTitle: bookTitle.trim(),
            quiz: quizToSave,
            saveNewQuizSet: true,
        };

        if (!currentBookId) {
            saveParams.documentContent = documentContent;
        }
        
        const updatedBook = await saveBook(saveParams);
        
        onBookUpdate(updatedBook);
        setBook(updatedBook);
        setCurrentBookId(updatedBook.id);
        const newSet = updatedBook.savedQuizzes.slice(-1)[0];
        setActiveQuizSet(newSet);
        setGeneratedQuiz(null);
        setUserAnswers({}); // Clear answers after saving
        setScore(0);
        setQuizState("in_progress");
        setIsTranslated(false);
        setTranslatedQuiz(null);

        if (!currentBookId) {
          router.replace(`/my-books/${updatedBook.id}`, { scroll: false })
        }
        
        toast({
            title: "Quiz Saved!",
            description: `A new quiz set has been saved to "${bookTitle}".`,
        });
    } catch (error) {
        console.error("Error saving quiz:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save quiz." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleChallengeClick = () => {
    if (!canChallenge) {
        toast({ variant: 'destructive', title: 'Cannot Start Challenge', description: 'Please save this quiz as a new set before challenging a friend.' });
        return;
    }
    setIsChallengeDialogOpen(true);
  }

  const handleLoadSet = (set: SavedQuizSet) => {
    setActiveQuizSet(set);
    setGeneratedQuiz(null);
    setTranslatedQuiz(null);
    setIsTranslated(false);
    handleRetake();
    setIsSavedSetsOpen(false);
    toast({
        title: "Quiz Set Loaded",
        description: `Loaded set: "${set.name}".`
    })
  }

  const handleBookUpdateFromDialog = (updatedBook: Book, deletedSetId?: string) => {
    onBookUpdate(updatedBook);
    setBook(updatedBook);
    if (activeQuizSet && activeQuizSet.id === deletedSetId) {
       const latestSet = updatedBook.savedQuizzes?.slice().sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
       setActiveQuizSet(latestSet || null);
       setQuizState(latestSet ? 'in_progress' : 'not_started');
    }
  }

  const handleTranslateQuiz = async () => {
    const originalQuiz = generatedQuiz ?? activeQuizSet?.questions;
    if (!originalQuiz || originalQuiz.length === 0) {
      toast({ variant: 'destructive', title: 'No quiz to translate.' });
      return;
    }

    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedQuiz) {
      setIsTranslated(true);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedQuestions: QuizQuestion[] = [];
      for (const q of originalQuiz) {
        const [questionText, ...options] = await Promise.all([
          translateText({ text: q.questionText, targetLanguage: 'ur' }).then(r => r.translatedText),
          ...q.options.map(opt => translateText({ text: opt, targetLanguage: 'ur' }).then(r => r.translatedText))
        ]);
        translatedQuestions.push({
          ...q,
          questionText,
          options
        });
      }
      setTranslatedQuiz(translatedQuestions);
      setIsTranslated(true);
    } catch (error) {
      console.error("Error translating quiz:", error);
      toast({ variant: 'destructive', title: 'Translation Failed', description: 'Could not translate the entire quiz.' });
    } finally {
      setIsTranslating(false);
    }
  }

  const allQuestionsAnswered = Object.keys(userAnswers).length === quizToDisplay.length;
  const isNewUnsavedContent = !!generatedQuiz;
   
  return (
    <>
    <div className="flex flex-col gap-4 h-full">
       <div className="flex items-center gap-2 text-lg font-semibold">
        <Lightbulb />
        Quiz Generator
       </div>
       {!book?.id && (
        <div className="space-y-1">
            <Label htmlFor="quiz-book-title">Book Title</Label>
            <Input
                id="quiz-book-title"
                placeholder="Enter a title to save your quiz..."
                value={bookTitle}
                onChange={e => {
                    setBookTitle(e.target.value)
                }}
            />
        </div>
       )}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleGenerateQuiz} disabled={isLoading}>
          {isLoading ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          {quizToDisplay.length > 0 ? "Generate New" : "Generate Quiz"}
        </Button>

        {isNewUnsavedContent && (
            <Button
                onClick={handleSaveQuiz}
                disabled={isSaving || !bookTitle.trim()}
            >
                {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save as New Set
            </Button>
        )}
         {book && book.savedQuizzes && book.savedQuizzes.length > 0 && (
          <Button variant="outline" onClick={() => setIsSavedSetsOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              View Saved
          </Button>
         )}
         {quizToDisplay.length > 0 && (
          <Button variant="outline" onClick={handleTranslateQuiz} disabled={isTranslating}>
            {isTranslating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
            {isTranslated ? "Show Original" : "Translate to Urdu"}
          </Button>
         )}
      </div>

      <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm p-4 overflow-hidden min-h-0">
        <ScrollArea className="h-full pr-4">
          {isLoading ? (
            <div className="space-y-6 p-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <div className="space-y-2 pl-4">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
          ) : quizState === "not_started" ? (
            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <Lightbulb className="mx-auto h-12 w-12" />
              <p className="mt-2 font-semibold">Ready to test your knowledge?</p>
              <p className="text-sm">Click the button above to generate a quiz.</p>
            </div>
          ) : (quizState === "in_progress" || quizState === "submitted") && quizToDisplay.length > 0 ? (
             <div className="space-y-6" dir={isTranslated ? "rtl" : "ltr"}>
                {quizState === "submitted" && (
                    <Card className="text-center bg-accent/10 border-accent/50">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2">
                                <Award className="text-yellow-500" />
                                Quiz Completed!
                            </CardTitle>
                            <CardDescription>You scored</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-5xl font-bold">{Math.round((score / quizToDisplay.length) * 100)}%</p>
                           <p className="text-muted-foreground mt-1">({score} out of {quizToDisplay.length} correct)</p>
                           <Progress value={(score / quizToDisplay.length) * 100} className="w-full mt-4 bg-accent" />
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Button onClick={handleRetake} variant="secondary">
                                <Repeat className="mr-2 h-4 w-4" />
                                Retake Quiz
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {quizToDisplay.map((question, qIndex) => {
                    const originalQuestion = (generatedQuiz ?? activeQuizSet?.questions ?? [])[qIndex];
                    return (
                        <Card key={qIndex} className={cn(
                            'transition-colors duration-300',
                            quizState === 'submitted' && (userAnswers[qIndex] === originalQuestion.correctAnswerIndex ? 'border-green-500/50 bg-green-500/10' : 'border-destructive/20 bg-destructive/5')
                        )}>
                            <CardHeader>
                                <CardTitle className="text-base flex justify-between items-start">
                                    <span>Question {qIndex + 1}</span>
                                    {quizState === 'submitted' && (
                                        userAnswers[qIndex] === originalQuestion.correctAnswerIndex ? 
                                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" /> : 
                                        <X className="h-5 w-5 text-destructive flex-shrink-0" />
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
                                    {question.options.map((option, oIndex) => {
                                        const isCorrect = oIndex === originalQuestion.correctAnswerIndex;
                                        const isSelected = userAnswers[qIndex] === oIndex;

                                        return (
                                            <div key={oIndex} className={cn(
                                                "flex items-center space-x-3 p-3 rounded-md transition-colors",
                                                quizState === "submitted" && isCorrect && "bg-green-500/20",
                                                quizState === "submitted" && !isCorrect && isSelected && "bg-destructive/20",
                                                quizState !== "submitted" && "hover:bg-muted/50 cursor-pointer",
                                                quizState === "submitted" && "cursor-default"
                                            )}>
                                                <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}o${oIndex}`} />
                                                <Label htmlFor={`q${qIndex}o${oIndex}`} className={cn("flex-1", quizState !== 'submitted' ? 'cursor-pointer' : 'cursor-default')}>
                                                    {option}
                                                </Label>
                                            </div>
                                        )
                                    })}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    )
                })}


                {quizState === "in_progress" && (
                    <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* The span is necessary to allow the tooltip to show even when the button is disabled */}
                              <span tabIndex={isNewUnsavedContent ? 0 : -1}>
                                <Button onClick={handleSubmit} disabled={!allQuestionsAnswered || isNewUnsavedContent} className="w-full">
                                    Submit Quiz
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {isNewUnsavedContent && (
                              <TooltipContent>
                                <p>Please save the quiz before submitting.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <Button onClick={handleChallengeClick} variant="secondary">
                           <Swords className="mr-2 h-4 w-4" />
                            Challenge Friend
                        </Button>
                    </div>
                )}
             </div>
          ) : null}
        </ScrollArea>
      </div>
    </div>
    <SavedQuizzesDialog
        isOpen={isSavedSetsOpen}
        onClose={() => setIsSavedSetsOpen(false)}
        book={book}
        onLoadSet={handleLoadSet}
        onBookUpdate={handleBookUpdateFromDialog}
    />
     <ChallengeFriendDialog
        isOpen={isChallengeDialogOpen}
        onClose={() => setIsChallengeDialogOpen(false)}
        book={book}
        quizSet={activeQuizSet}
     />
    </>
  )
}
