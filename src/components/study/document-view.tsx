
"use client"

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, ArrowRight } from "lucide-react"

interface DocumentViewProps {
  pages: string[]
}

export function DocumentView({ pages }: DocumentViewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!pages || pages.length === 0) {
    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
                <FileText />
                Document Content
            </div>
          <Card className="h-full flex-grow flex items-center justify-center">
            <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No document content available.</p>
            </CardContent>
          </Card>
        </div>
      )
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
  }

  return (
    <div className="h-full flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 text-lg font-semibold">
            <div className="flex items-center gap-2">
                <FileText />
                Document Content
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-muted-foreground">Page {currentPage + 1} of {pages.length}</span>
                <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 0}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                 <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === pages.length - 1}>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      <Card className="h-full flex-grow">
        <CardContent className="h-full p-4">
          <ScrollArea className="h-full pr-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {pages[currentPage]}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
