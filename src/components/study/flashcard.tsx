
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

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="w-full h-64 [perspective:1000px] cursor-pointer" onClick={handleCardClick}>
      <div
        className={cn(
          "relative h-full w-full rounded-xl shadow-md transition-transform duration-700 [transform-style:preserve-3d]",
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        )}
      >
        <div className="absolute flex h-full w-full flex-col justify-center items-center rounded-xl bg-primary/20 p-6 text-center [backface-visibility:hidden]">
          <p className="text-lg font-semibold text-card-foreground">{front}</p>
        </div>
        <div className="absolute flex h-full w-full flex-col justify-center items-center rounded-xl bg-accent p-6 text-center text-accent-foreground [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-md">{back}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
            <FlipHorizontal className="h-4 w-4" />
            Click card to flip
        </div>
      </div>
    </div>
  )
}
