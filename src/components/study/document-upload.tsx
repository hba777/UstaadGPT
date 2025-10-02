
"use client"

import { useState, useRef, DragEvent } from "react"
import { FileUp, LoaderCircle } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Set worker path
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

interface DocumentUploadProps {
  onUpload: (content: string, name: string) => void;
  disabled?: boolean;
}

export function DocumentUpload({ onUpload, disabled = false }: DocumentUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFile = async (file: File) => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a PDF file to upload.",
      })
      return
    }

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file.",
      })
      return
    }

    setIsLoading(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      let fullText = ""

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n"
      }
      
      const fileName = file.name.replace(/\.pdf$/i, '')
      onUpload(fullText, fileName)
    } catch (error) {
      console.error("Error processing PDF:", error)
      toast({
        variant: "destructive",
        title: "PDF Processing Error",
        description: "Could not read the PDF file. It might be corrupted or protected.",
      })
    } finally {
        setIsLoading(false)
    }
  }

  const handleManualUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFile(event.target.files[0])
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0])
      event.dataTransfer.clearData()
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }
  
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>Start Your Study Session</CardTitle>
          <CardDescription>
            Upload a PDF document to create a new book in your library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
                "flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg transition-colors",
                isDragging ? "border-primary bg-primary/10" : "border-border",
                (isLoading || disabled) && "opacity-50 pointer-events-none"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isLoading ? (
                <>
                    <LoaderCircle className="w-16 h-16 text-primary animate-spin" />
                    <p className="text-muted-foreground">Analyzing your document...</p>
                </>
            ) : (
                <>
                    <FileUp className="w-16 h-16 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        Drag & drop a PDF here, or click to select a file.
                    </p>
                    <Button onClick={triggerFileSelect} disabled={isLoading || disabled}>
                        <FileUp className="mr-2 h-4 w-4" /> Choose a PDF
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleManualUpload}
                        accept="application/pdf"
                        className="sr-only"
                        disabled={isLoading || disabled}
                    />
                </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
