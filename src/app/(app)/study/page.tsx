
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DocumentUpload } from "@/components/study/document-upload"
import { SaveBookDialog } from "@/components/study/save-book-dialog"
import { useAuthContext } from "@/context/AuthContext"
import { saveBook } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"

export default function StudyPage() {
  const [documentPages, setDocumentPages] = useState<string[]>([])
  const [documentName, setDocumentName] = useState<string>("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuthContext()
  const { toast } = useToast()
  const router = useRouter()

  const handleUpload = (pages: string[], name: string) => {
    setDocumentPages(pages)
    setDocumentName(name)
    setShowSaveDialog(true)
  }

  const handleSaveBook = async (title: string) => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to save a book." });
        return;
    }
    setIsSaving(true)
    try {
      await saveBook({
        userId: user.uid,
        bookTitle: title,
        documentContent: documentPages,
      })
      toast({
        title: "Book Saved!",
        description: `"${title}" has been added to your library.`,
      })
      router.push(`/my-books`)
    } catch (error) {
      console.error("Error saving book:", error)
      toast({ variant: "destructive", title: "Error", description: "Could not save the book." })
      setIsSaving(false)
    }
  }

  const handleCloseDialog = () => {
    setShowSaveDialog(false)
    setDocumentPages([])
    setDocumentName("")
  }

  return (
    <>
      <DocumentUpload onUpload={handleUpload} />
      <SaveBookDialog
        isOpen={showSaveDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveBook}
        initialTitle={documentName}
        isSaving={isSaving}
      />
    </>
  )
}
