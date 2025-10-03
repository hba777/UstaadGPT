"use client"

import { FormEvent, useRef, useState, useEffect } from "react"
import { BrainCircuit, LoaderCircle, MessageCircle, Send, User } from "lucide-react"

import { answerQuestions } from "@/ai/flows/answer-questions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuthContext } from "@/context/AuthContext"

interface ChatbotViewProps {
  documentContent: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatbotView({ documentContent }: ChatbotViewProps) {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const result = await answerQuestions({
        question: input,
        context: documentContent,
      })
      const assistantMessage: Message = { role: "assistant", content: result.answer }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting answer:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get an answer. Please try again.",
      })
      setMessages(prev => prev.slice(0, prev.length -1))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-2">
        <div className="flex items-center gap-2 text-lg font-semibold p-2">
            <MessageCircle />
            AI Tutor Chat
        </div>
      <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm">
        <ScrollArea className="h-full p-4" viewportRef={viewportRef}>
          <div className="flex flex-col gap-4">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-10">
                    <BrainCircuit className="mx-auto h-12 w-12" />
                    <p className="mt-2">Ask me anything about the document!</p>
                </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : ""
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback><BrainCircuit className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xs rounded-lg p-3 text-sm md:max-w-md",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
                 {message.role === "user" && user && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback><BrainCircuit className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  )
}
