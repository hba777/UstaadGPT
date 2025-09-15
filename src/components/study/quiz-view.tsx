"use client"

import { useState } from "react"
import { Lightbulb, LoaderCircle } from "lucide-react"

import { generateQuiz } from "@/ai/flows/generate-quiz"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface QuizViewProps {
  documentContent: string
}

export function QuizView({ documentContent }: QuizViewProps) {
  const [quiz, setQuiz] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateQuiz = async () => {
    setIsLoading(true)
    setQuiz("")
    try {
      const result = await generateQuiz({ documentText: documentContent })
      setQuiz(result.quiz)
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <Button onClick={handleGenerateQuiz} disabled={isLoading}>
        {isLoading ? (
          <LoaderCircle className="mr-2 animate-spin" />
        ) : (
          <Lightbulb className="mr-2" />
        )}
        Generate Quiz
      </Button>
      <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <ScrollArea className="h-full">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2 ml-4" />
              <Skeleton className="h-4 w-1/2 ml-4" />
              <Skeleton className="h-4 w-1/2 ml-4" />
              <Skeleton className="h-4 w-3/4 mt-4" />
              <Skeleton className="h-4 w-1/2 ml-4" />
              <Skeleton className="h-4 w-1/2 ml-4" />
            </div>
          )}
          {quiz ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quiz}</p>
          ) : (
            !isLoading && <p className="text-sm text-center text-muted-foreground pt-10">Click the button to generate a quiz.</p>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
