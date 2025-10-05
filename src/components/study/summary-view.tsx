
"use client"

import { useState } from "react"
import { LoaderCircle, Sparkles, Download, Languages } from "lucide-react"
import jsPDF from "jspdf"

import { summarizeDocument } from "@/ai/flows/summarize-document"
import { translateText } from "@/ai/flows/translate-text"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface SummaryViewProps {
  documentContent: string
}

export function SummaryView({ documentContent }: SummaryViewProps) {
  const [summary, setSummary] = useState<string>("")
  const [translatedSummary, setTranslatedSummary] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isTranslated, setIsTranslated] = useState(false)
  const { toast } = useToast()

  const handleGenerateSummary = async () => {
    setIsLoading(true)
    setSummary("")
    setTranslatedSummary("")
    setIsTranslated(false)
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

  const handleTranslate = async () => {
    if (!summary) {
        toast({ variant: 'destructive', title: 'No summary to translate.' });
        return;
    }
    setIsTranslating(true);
    try {
        if (translatedSummary) {
            // If already translated, just toggle the view
            setIsTranslated(true);
        } else {
            // Otherwise, fetch translation
            const result = await translateText({ text: summary, targetLanguage: 'ur' });
            setTranslatedSummary(result.translatedText);
            setIsTranslated(true);
        }
    } catch (error) {
        console.error("Error translating summary:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to translate summary.' });
    } finally {
        setIsTranslating(false);
    }
  };

  const handleExport = () => {
    const textToExport = isTranslated ? translatedSummary : summary;
    const defaultFileName = isTranslated ? "summary-urdu.pdf" : "summary.pdf";

    if (!textToExport) {
        toast({
            variant: "destructive",
            title: "No Content",
            description: "Please generate a summary before exporting.",
        });
        return;
    }
    
    const doc = new jsPDF();
    
    // Add the Urdu font to the PDF
    // This is a simplified way to handle it, for full support, a custom font file would be needed.
    doc.setFont('Helvetica'); // jsPDF has limited default support for non-Latin scripts.
                                // For full Urdu support, a font like Noto Sans Arabic would be embedded.

    doc.text("Summary", 10, 10);
    
    // The text needs to be split to fit the page width.
    // The RTL direction is tricky in jsPDF. For simple cases, we can align right.
    const splitText = doc.splitTextToSize(textToExport, 180);
    doc.text(splitText, doc.internal.pageSize.getWidth() - 10, 20, { align: 'right' });
    
    doc.save(defaultFileName);

    toast({ title: "Exported", description: `Summary downloaded as ${defaultFileName}` });
  }

  const textToShow = isTranslated ? translatedSummary : summary;

  return (
    <div className="flex flex-col gap-4 h-full">
        <div className="flex gap-2 flex-wrap">
            <Button onClick={handleGenerateSummary} disabled={isLoading} className="flex-1">
                {isLoading ? (
                <LoaderCircle className="mr-2 animate-spin" />
                ) : (
                <Sparkles className="mr-2" />
                )}
                {summary ? "Regenerate" : "Generate Summary"}
            </Button>

            {summary && !isTranslated && (
                 <Button variant="outline" onClick={handleTranslate} disabled={isTranslating} className="flex-1">
                    {isTranslating ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Languages className="mr-2 h-4 w-4" />
                    )}
                    Translate to Urdu
                </Button>
            )}

            {isTranslated && (
                 <Button variant="outline" onClick={() => setIsTranslated(false)} className="flex-1">
                    Show Original
                </Button>
            )}

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
          {textToShow ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap" dir={isTranslated ? "rtl" : "ltr"}>
                {textToShow}
            </p>
          ) : (
            !isLoading && <p className="text-sm text-center text-muted-foreground pt-10">Click the button to generate a summary.</p>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
