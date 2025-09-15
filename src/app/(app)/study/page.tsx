"use client"

import { useState } from "react"
import { AITools } from "@/components/study/ai-tools"
import { DocumentUpload } from "@/components/study/document-upload"
import { DocumentView } from "@/components/study/document-view"

export default function StudyPage() {
  const [documentContent, setDocumentContent] = useState<string>("")
  const [isDocLoaded, setIsDocLoaded] = useState(false)

  const handleUpload = (content: string) => {
    setDocumentContent(content)
    setIsDocLoaded(true)
  }

  return (
    <div>
      {isDocLoaded ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <DocumentView content={documentContent} />
          <AITools documentContent={documentContent} />
        </div>
      ) : (
        <DocumentUpload onUpload={handleUpload} />
      )}
    </div>
  )
}
