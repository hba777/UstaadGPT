"use client"

import { FileUp } from "lucide-react"

import { sampleDocument } from "@/lib/content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DocumentUploadProps {
  onUpload: (content: string) => void
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const handleUpload = () => {
    onUpload(sampleDocument)
  }

  return (
    <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle>Start Your Study Session</CardTitle>
                <CardDescription>Upload a document to begin generating summaries, quizzes, and more.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center gap-6">
                    <FileUp className="w-16 h-16 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        For demonstration purposes, clicking the button will load a sample document about Machine Learning.
                    </p>
                    <Button onClick={handleUpload}>
                        <FileUp className="mr-2" /> Load Sample Document
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
