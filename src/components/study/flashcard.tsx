
"use client"

import { useState } from "react"
import { FlipHorizontal, Volume2, LoaderCircle, Languages } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { textToSpeech } from "@/ai/flows/text-to-speech"
import { translateText } from "@/ai/flows/translate-text"
import { useToast } from "@/hooks/use-toast"

interface FlashcardProps {
  front: string
  back: string
}

export function Flashcard({ front, back }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedFront, setTranslatedFront] = useState("");
  const [translatedBack, setTranslatedBack] = useState("");
  const { toast } = useToast();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't flip the card if a button was clicked
    if ((e.target as HTMLElement).closest('button')) {
        return;
    }
    setIsFlipped(!isFlipped)
  }

  const handlePlaySound = async () => {
    const textToSay = isFlipped ? (isTranslated ? translatedBack : back) : (isTranslated ? translatedFront : front);
    if (!textToSay) return;

    setIsSpeaking(true);
    try {
        const result = await textToSpeech(textToSay);
        const audio = new Audio(result.media);
        audio.play();
        audio.onended = () => setIsSpeaking(false);
    } catch (error) {
        console.error("Error generating speech:", error);
        toast({
            variant: "destructive",
            title: "Text-to-Speech Error",
            description: "Could not generate audio for this card."
        });
        setIsSpeaking(false);
    }
  }

  const handleTranslate = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }
    
    if (translatedFront && translatedBack) {
      setIsTranslated(true);
      return;
    }

    setIsTranslating(true);
    try {
      const [frontResult, backResult] = await Promise.all([
        translateText({ text: front, targetLanguage: 'ur' }),
        translateText({ text: back, targetLanguage: 'ur' })
      ]);
      setTranslatedFront(frontResult.translatedText);
      setTranslatedBack(backResult.translatedText);
      setIsTranslated(true);
    } catch (error) {
      console.error("Error translating card:", error);
      toast({ variant: 'destructive', title: 'Translation Failed' });
    } finally {
      setIsTranslating(false);
    }
  }

  const currentFront = isTranslated ? translatedFront : front;
  const currentBack = isTranslated ? translatedBack : back;

  return (
    <div>
        <div className="w-full h-64 [perspective:1000px] cursor-pointer" onClick={handleCardClick}>
        <div
            className={cn(
            "relative h-full w-full rounded-xl shadow-md transition-transform duration-700 [transform-style:preserve-3d]",
            isFlipped ? "[transform:rotateY(180deg)]" : ""
            )}
        >
            <div className="absolute flex h-full w-full flex-col justify-center items-center rounded-xl bg-primary/20 p-6 text-center [backface-visibility:hidden]">
              <p className="text-lg font-semibold text-card-foreground" dir={isTranslated ? "rtl" : "ltr"}>{currentFront}</p>
            </div>
            <div className="absolute flex h-full w-full flex-col justify-center items-center rounded-xl bg-secondary p-6 text-center text-secondary-foreground [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <p className="text-md" dir={isTranslated ? "rtl" : "ltr"}>{currentBack}</p>
            </div>
        </div>
        </div>
        <div className="mt-4 flex justify-center items-center gap-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
                <FlipHorizontal className="h-4 w-4" />
                Click card to flip
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlaySound}
              disabled={isSpeaking || isTranslating}
              aria-label="Read card text aloud"
            >
            {isSpeaking ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
                <Volume2 className="h-5 w-5" />
            )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleTranslate}
              disabled={isSpeaking || isTranslating}
              aria-label="Translate card"
            >
              {isTranslating ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Languages className="h-5 w-5" />
              )}
            </Button>
        </div>
    </div>
  )
}
