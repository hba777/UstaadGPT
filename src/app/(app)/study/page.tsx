"use client"

import { useState } from "react"
import { DocumentUpload } from "@/components/study/document-upload"
import { DocumentView } from "@/components/study/document-view"
import { BooksSidebar } from "@/components/study/books-sidebar"
import { BookFlashcardsView } from "@/components/study/book-flashcards-view"
import { FlashcardView } from "@/components/study/flashcard-view"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { type Book } from "@/lib/firestore"

type ViewMode = 'upload' | 'document' | 'view-book' | 'edit-book'

export default function StudyPage() {
  const [documentContent, setDocumentContent] = useState<string>("")
  const [isDocLoaded, setIsDocLoaded] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('upload')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const handleUpload = (content: string) => {
    setDocumentContent(content)
    setIsDocLoaded(true)
    setViewMode('document')
  }

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book)
    setViewMode('view-book')
  }

  const handleBackToDocument = () => {
    setSelectedBook(null)
    setViewMode('document')
  }

  const handleEditBook = (book: Book) => {
    setSelectedBook(book)
    setViewMode('edit-book')
  }

  const renderMainContent = () => {
    switch (viewMode) {
      case 'upload':
        return <DocumentUpload onUpload={handleUpload} />
      
      case 'view-book':
        return selectedBook ? (
          <BookFlashcardsView
            book={selectedBook}
            onBack={handleBackToDocument}
            onEdit={handleEditBook}
          />
        ) : null

      case 'edit-book':
        return selectedBook ? (
          <FlashcardView
            documentContent={selectedBook.documentContent || documentContent}
            bookId={selectedBook.id}
            bookName={selectedBook.title}
          />
        ) : null

      default: // 'document'
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <DocumentView content={documentContent} />
            <FlashcardView documentContent={documentContent} />
          </div>
        )
    }
  }

  // If no document loaded, show upload
  if (!isDocLoaded && viewMode === 'upload') {
    return <DocumentUpload onUpload={handleUpload} />
  }

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Sidebar */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <BooksSidebar
            onBookSelect={handleBookSelect}
            selectedBookId={selectedBook?.id}
            className="h-full border-r"
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main content */}
        <ResizablePanel defaultSize={75}>
          <div className="h-full p-6">
            {renderMainContent()}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}