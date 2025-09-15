"use client"

import { useState } from "react"
import { FlipHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FlashcardProps {
  front: string
  back: string
}

export function Flashcard({ front, back }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="w-full h-64 [perspective:1000px]">
      <div
        className={cn(
          "relative h-full w-full rounded-xl shadow-md transition-transform duration-700 [transform-style:preserve-3d]",
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        )}
      >
        <div className="absolute flex h-full w-full flex-col justify-center items-center rounded-xl bg-card p-6 text-center [backface-visibility:hidden]">
          <p className="text-lg font-semibold text-card-foreground">{front}</p>
        </div>
        <div className="absolute flex h-full w-full flex-col justify-center items-center rounded-xl bg-accent p-6 text-center text-accent-foreground [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-md">{back}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <Button variant="outline" onClick={() => setIsFlipped(!isFlipped)}>
            <FlipHorizontal className="mr-2" />
            Flip Card
        </Button>
      </div>
    </div>
  )
}
