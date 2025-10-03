
"use client"

import { useState } from "react"
import { LoaderCircle, Sparkles, Download } from "lucide-react"
import jsPDF from "jspdf"

import { summarizeDocument } from "@/ai/flows/summarize-document"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface SummaryViewProps {
  documentContent: string
}

export function SummaryView({ documentContent }: SummaryViewProps) {
  const [summary, setSummary] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateSummary = async () => {
    setIsLoading(true)
    setSummary("")
    try {
      const result = await summarizeDocument({ documentText: documentContent })
      setSummary(result.summary)
    } catch (error) {
      console.error("Error generating summary:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate summary. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (!summary) {
        toast({
            variant: "destructive",
            title: "No Summary",
            description: "Please generate a summary before exporting.",
        });
        return;
    }
    
    const doc = new jsPDF();
    doc.text("Summary", 10, 10);
    // Split text into lines that fit the page width
    const splitText = doc.splitTextToSize(summary, 180);
    doc.text(splitText, 10, 20);
    doc.save("summary.pdf");

    toast({ title: "Exported", description: "Summary downloaded as summary.pdf" });
  }

  return (
    <div className="flex flex-col gap-4 h-full">
        <div className="flex gap-2">
            <Button onClick={handleGenerateSummary} disabled={isLoading} className="flex-1">
                {isLoading ? (
                <LoaderCircle className="mr-2 animate-spin" />
                ) : (
                <Sparkles className="mr-2" />
                )}
                Generate Summary
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!summary || isLoading}>
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
            </Button>
      </div>
      <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <ScrollArea className="h-full">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {summary ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
          ) : (
            !isLoading && <p className="text-sm text-center text-muted-foreground pt-10">Click the button to generate a summary.</p>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
