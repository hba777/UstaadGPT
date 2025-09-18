
"use client"

import { useState } from "react"
import { DocumentUpload } from "@/components/study/document-upload"
import { DocumentView } from "@/components/study/document-view"
import { AITools } from "@/components/study/ai-tools"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

export default function StudyPage() {
  const [documentContent, setDocumentContent] = useState<string>("")
  const [documentName, setDocumentName] = useState<string>("")
  const [isDocLoaded, setIsDocLoaded] = useState(false)

  const handleUpload = (content: string, name: string) => {
    setDocumentContent(content)
    setDocumentName(name)
    setIsDocLoaded(true)
  }

  if (!isDocLoaded) {
    return <DocumentUpload onUpload={handleUpload} />
  }

  return (
    <div className="h-[calc(100vh-5rem)]">
       <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
        <ResizablePanel defaultSize={50}>
            <div className="p-6 h-full">
                <DocumentView content={documentContent} />
            </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
            <div className="p-6 h-full">
                <AITools documentContent={documentContent} />
            </div>
        </ResizablePanel>
       </ResizablePanelGroup>
    </div>
  )
}
