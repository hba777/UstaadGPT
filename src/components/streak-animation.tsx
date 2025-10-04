"use client";

import { useAuthContext } from "@/context/AuthContext";
import { Award, Flame, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function StreakAnimation() {
  const { streakBonus, setStreakBonus } = useAuthContext();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (streakBonus) {
      setShow(true);
      // Automatically hide after the animation duration
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [streakBonus]);

  const handleClose = () => {
    setShow(false);
    // Allow animation to finish before clearing
    setTimeout(() => setStreakBonus(null), 500); 
  };

  if (!streakBonus || !show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500",
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative text-center p-8 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-primary/20 shadow-2xl transition-all duration-500",
          show ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-primary animate-pulse">
          Daily Streak!
        </h2>
        
        <div className="my-6 flex items-center justify-center gap-4 animate-bounce">
            <Flame className="w-16 h-16 text-accent" />
            <span className="text-6xl font-bold text-foreground">{streakBonus.streak}</span>
             <span className="text-2xl font-semibold text-muted-foreground self-end pb-2">Day{streakBonus.streak > 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center justify-center gap-2">
            <Award className="w-8 h-8 text-accent" />
            <p className="text-xl font-semibold">You earned <span className="text-primary font-bold">{streakBonus.points}</span> points!</p>
        </div>

        {[...Array(10)].map((_, i) => (
            <Star
                key={i}
                className="absolute text-accent animate-ping"
                style={{
                    width: `${Math.random() * 15 + 5}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${Math.random() * 2 + 1}s`,
                }}
            />
        ))}

      </div>
    </div>
  );
}
