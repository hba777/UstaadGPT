"use client"

import { useState } from "react"
import { Lightbulb, LoaderCircle, Check, X, Repeat, Award } from "lucide-react"
import { generateQuiz, type GenerateQuizOutput } from "@/ai/flows/generate-quiz"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type QuizState = "not_started" | "loading" | "in_progress" | "submitted"
type QuizQuestion = GenerateQuizOutput["quiz"][0]

interface QuizViewProps {
    documentContent: string
}

export function QuizView({ documentContent }: QuizViewProps) {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [quizState, setQuizState] = useState<QuizState>("not_started")
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [score, setScore] = useState(0)
  const { toast } = useToast()

  const handleGenerateQuiz = async () => {
    setQuizState("loading")
    setQuiz([])
    setUserAnswers({})
    setScore(0)
    try {
      const result = await generateQuiz({ documentText: documentContent })
      if (result.quiz.length === 0) {
        toast({
          variant: "destructive",
          title: "Quiz Generation Failed",
          description: "The AI couldn't generate a quiz from this document. Please try a different document.",
        })
        setQuizState("not_started");
        return
      }
      setQuiz(result.quiz)
      setQuizState("in_progress")
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
      })
      setQuizState("not_started")
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
    quiz.forEach((question, index) => {
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

  const handleNewQuiz = () => {
    setQuizState("not_started")
    setQuiz([])
    setUserAnswers({})
    setScore(0)
  }

  const allQuestionsAnswered = Object.keys(userAnswers).length === quiz.length;

  return (
    <div className="flex flex-col gap-4 h-full">
       <div className="flex items-center gap-2 text-lg font-semibold">
        <Lightbulb />
        Quiz Generator
       </div>
      <div className="flex gap-2">
        <Button onClick={handleGenerateQuiz} disabled={quizState === "loading"} className="flex-1">
          {quizState === "loading" ? (
            <LoaderCircle className="mr-2 animate-spin" />
          ) : (
            <Lightbulb className="mr-2" />
          )}
          {quiz.length > 0 ? "Generate New Quiz" : "Generate Quiz"}
        </Button>

        {quizState === "in_progress" && (
            <Button onClick={handleSubmit} disabled={!allQuestionsAnswered} className="flex-1">
                Submit Quiz
            </Button>
        )}
        {quizState === "submitted" && (
             <Button onClick={handleRetake} variant="secondary" className="flex-1">
                <Repeat className="mr-2 h-4 w-4" />
                Retake Quiz
            </Button>
        )}
      </div>
      <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {quizState === "loading" && (
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

          {quizState === "not_started" && (
            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <Lightbulb className="mx-auto h-12 w-12" />
              <p className="mt-2 font-semibold">Ready to test your knowledge?</p>
              <p className="text-sm">Click the button above to generate a quiz.</p>
            </div>
          )}

          {(quizState === "in_progress" || quizState === "submitted") && quiz.length > 0 && (
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
                           <p className="text-5xl font-bold">{Math.round((score / quiz.length) * 100)}%</p>
                           <p className="text-muted-foreground mt-1">({score} out of {quiz.length} correct)</p>
                           <Progress value={(score / quiz.length) * 100} className="w-full mt-4" />
                        </CardContent>
                    </Card>
                )}

                {quiz.map((question, qIndex) => (
                    <Card key={qIndex} className={cn(
                        quizState === 'submitted' && (userAnswers[qIndex] === question.correctAnswerIndex ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10')
                    )}>
                        <CardHeader>
                            <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
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
                                            "flex items-center space-x-3 p-3 rounded-md",
                                            quizState === "submitted" && isCorrect && "bg-green-500/20",
                                            quizState === "submitted" && !isCorrect && isSelected && "bg-red-500/20",
                                        )}>
                                            <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}o${oIndex}`} />
                                            <Label htmlFor={`q${qIndex}o${oIndex}`} className="flex-1 cursor-pointer">
                                                {option}
                                            </Label>
                                            {quizState === "submitted" && (
                                                <>
                                                    {isCorrect && <Check className="h-5 w-5 text-green-700" />}
                                                    {!isCorrect && isSelected && <X className="h-5 w-5 text-red-700" />}
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </RadioGroup>
                        </CardContent>
                    </Card>
                ))}
             </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
