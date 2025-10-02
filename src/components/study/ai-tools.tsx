
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
  import { SummaryView } from "./summary-view"
  import { QuizView } from "./quiz-view"
  import { FlashcardView } from "./flashcard-view"
  import { ChatbotView } from "./chatbot-view"
  import type { Book } from "@/lib/firestore"
  
  interface AIToolsProps {
    documentContent: string;
    book?: Book | null;
    onBookUpdate: (book: Book) => void;
  }
  
  export function AITools({ documentContent, book, onBookUpdate }: AIToolsProps) {
    return (
      <Tabs defaultValue="summary" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="chat">Chatbot</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="flex-grow overflow-auto">
          <SummaryView documentContent={documentContent} />
        </TabsContent>
        <TabsContent value="quiz" className="flex-grow overflow-auto">
          <QuizView 
            documentContent={documentContent} 
            book={book}
            onBookUpdate={onBookUpdate}
          />
        </TabsContent>
        <TabsContent value="flashcards" className="flex-grow overflow-auto">
          <FlashcardView 
            documentContent={documentContent} 
            book={book}
            onBookUpdate={onBookUpdate}
          />
        </TabsContent>
        <TabsContent value="chat" className="flex-grow overflow-auto">
          <ChatbotView documentContent={documentContent} />
        </TabsContent>
      </Tabs>
    )
  }
  
