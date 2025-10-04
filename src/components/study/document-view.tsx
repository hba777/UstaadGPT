
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText } from "lucide-react"

interface DocumentViewProps {
  content: string
}

export function DocumentView({ content }: DocumentViewProps) {
  return (
    <div className="h-full flex flex-col gap-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText />
            Document Content
        </div>
      <Card className="h-full flex-grow">
        <CardContent className="h-full p-4">
          <ScrollArea className="h-full pr-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {content}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
