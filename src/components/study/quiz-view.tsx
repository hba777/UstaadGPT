
"use client"

import { useState, useEffect } from "react"
import { Lightbulb, LoaderCircle, Check, X, Repeat, Award, Save, History } from "lucide-react"
import { generateQuiz } from "@/ai/flows/generate-quiz"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { saveBook, type QuizQuestion, type Book, SavedQuizSet } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { SavedQuizzesDialog } from "./saved-quizzes-dialog"

type QuizState = "not_started" | "in_progress" | "submitted"

interface QuizViewProps {
    documentContent: string;
    book?: Book | null;
    onBookUpdate: (book: Book) => void;
}

export function QuizView({ documentContent, book: initialBook, onBookUpdate }: QuizViewProps) {
  const [book, setBook] = useState(initialBook);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[]>(initialBook?.quiz || []);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[] | null>(null);
  
  const quizToDisplay = generatedQuiz ?? activeQuiz;

  const [quizState, setQuizState] = useState<QuizState>(activeQuiz && activeQuiz.length > 0 ? "in_progress" : "not_started")
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false);
  const [currentBookId, setCurrentBookId] = useState(initialBook?.id)
  const [bookTitle, setBookTitle] = useState(initialBook?.title || "")
  const [isSavedSetsOpen, setIsSavedSetsOpen] = useState(false)

  const { toast } = useToast()
  const { user } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    setBook(initialBook);
    if (initialBook) {
      const savedQuiz = initialBook.quiz || [];
      setActiveQuiz(savedQuiz);
      setGeneratedQuiz(null);
      setBookTitle(initialBook.title);
      setCurrentBookId(initialBook.id);
      setUserAnswers({});
      setScore(0);
      setQuizState(savedQuiz.length > 0 ? "in_progress" : "not_started");
      setJustSaved(false);
    }
  }, [initialBook]);


  const handleGenerateQuiz = async () => {
    setIsLoading(true)
    setGeneratedQuiz(null);
    setUserAnswers({})
    setScore(0)
    setJustSaved(false);

    try {
      const result = await generateQuiz({ documentText: documentContent })
      if (result.quiz.length === 0) {
        toast({
          variant: "destructive",
          title: "Quiz Generation Failed",
          description: "The AI couldn't generate a quiz from this document. Please try a different document.",
        })
        setQuizState(activeQuiz.length > 0 ? "in_progress" : "not_started");
        return
      }
      setGeneratedQuiz(result.quiz)
      setActiveQuiz(result.quiz);
      setQuizState("in_progress")
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
      })
      setQuizState(activeQuiz.length > 0 ? "in_progress" : "not_started");
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

  const handleSubmit = () => {
    let newScore = 0
    quizToDisplay.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswerIndex) {
        newScore++
      }
    })
    setScore(newScore)
    setQuizState("submitted")
  }

  const handleRetake = () => {
    setUserAnswers({})
    setScore(0)
    setQuizState("in_progress")
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
    
    if (quizToDisplay.length === 0) {
        toast({ variant: "destructive", title: "Generate a quiz before saving." });
        return;
    }

    setIsSaving(true);
    try {
        const updatedBook = await saveBook({
            userId: user.uid,
            bookId: currentBookId,
            bookTitle: bookTitle.trim(),
            quiz: quizToDisplay,
            documentContent: documentContent,
            saveNewQuizSet: true
        });

        onBookUpdate(updatedBook);

        if (!currentBookId) {
            router.replace(`/my-books/${updatedBook.id}`, { scroll: false })
        }
        
        setGeneratedQuiz(null);
        setJustSaved(true);
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

  const handleLoadSet = (set: SavedQuizSet) => {
    setActiveQuiz(set.questions);
    setGeneratedQuiz(null);
    handleRetake();
    setJustSaved(false);
    setIsSavedSetsOpen(false);
    toast({
        title: "Quiz Set Loaded",
        description: `Loaded set from ${new Date(set.createdAt.seconds * 1000).toLocaleString()}.`
    })
  }

  const allQuestionsAnswered = Object.keys(userAnswers).length === quizToDisplay.length;
  const isSaveButtonDisabled = isSaving || justSaved || quizToDisplay.length === 0 || !bookTitle.trim();


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
                    setJustSaved(false);
                }}
            />
        </div>
       )}
      <div className="flex gap-2">
        <Button onClick={handleGenerateQuiz} disabled={isLoading} className="flex-1">
          {isLoading ? (
            <LoaderCircle className="mr-2 animate-spin" />
          ) : (
            <Lightbulb className="mr-2" />
          )}
          {activeQuiz.length > 0 ? "Generate New Quiz" : "Generate Quiz"}
        </Button>

        {quizToDisplay.length > 0 && (
            <Button
                onClick={handleSaveQuiz}
                disabled={isSaveButtonDisabled}
                variant={justSaved ? "secondary" : "default"}
                className="flex-1"
            >
                {isSaving ? <LoaderCircle className="mr-2 animate-spin" /> : justSaved ? <Check className="mr-2"/> : <Save className="mr-2" />}
                {justSaved ? "Saved" : "Save as New Set"}
            </Button>
        )}

         {book && (
            <Button variant="outline" onClick={() => setIsSavedSetsOpen(true)} disabled={!book.savedQuizzes || book.savedQuizzes.length === 0}>
                <History className="mr-2 h-4 w-4" />
                View Saved
            </Button>
        )}
      </div>

      <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm p-4 overflow-hidden min-h-0">
        <ScrollArea className="h-full pr-4">
          {isLoading && (
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
          )}

          {quizState === "not_started" && !isLoading && (
            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <Lightbulb className="mx-auto h-12 w-12" />
              <p className="mt-2 font-semibold">Ready to test your knowledge?</p>
              <p className="text-sm">Click the button above to generate a quiz.</p>
            </div>
          )}

          {(quizState === "in_progress" || quizState === "submitted") && quizToDisplay.length > 0 && (
             <div className="space-y-6">
                {quizState === "submitted" && (
                    <Card className="text-center bg-primary/10 border-primary/50">
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
                           <Progress value={(score / quizToDisplay.length) * 100} className="w-full mt-4" />
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Button onClick={handleRetake} variant="secondary">
                                <Repeat className="mr-2 h-4 w-4" />
                                Retake Quiz
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {quizToDisplay.map((question, qIndex) => (
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
                                {question.options.map((option, oIndex) => {
                                    const isCorrect = oIndex === question.correctAnswerIndex;
                                    const isSelected = userAnswers[qIndex] === oIndex;

                                    return (
                                        <div key={oIndex} className={cn(
                                            "flex items-center space-x-3 p-3 rounded-md transition-colors",
                                            quizState === "submitted" && isCorrect && "bg-green-500/20",
                                            quizState === "submitted" && !isCorrect && isSelected && "bg-red-500/20",
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
                ))}

                {quizState === "in_progress" && (
                    <Button onClick={handleSubmit} disabled={!allQuestionsAnswered} className="w-full">
                        Submit Quiz
                    </Button>
                )}
             </div>
          )}
        </ScrollArea>
      </div>
    </div>
    <SavedQuizzesDialog
        isOpen={isSavedSetsOpen}
        onClose={() => setIsSavedSetsOpen(false)}
        savedSets={book?.savedQuizzes || []}
        onLoadSet={handleLoadSet}
        bookTitle={book?.title || ""}
    />
    </>
  )
}
