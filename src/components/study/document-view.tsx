import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DocumentViewProps {
  content: string
}

export function DocumentView({ content }: DocumentViewProps) {
  return (
    <Card className="h-[75svh]">
      <CardHeader>
        <CardTitle>Document Content</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)] pb-6">
        <ScrollArea className="h-full pr-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {content}
          </p>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
