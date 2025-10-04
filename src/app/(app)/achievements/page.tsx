"use client";

import { useAuthContext } from "@/context/AuthContext";
import { allBadges, type Badge } from "@/lib/badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

function BadgeCard({ badge, isEarned }: { badge: Badge, isEarned: boolean }) {
    const Icon = badge.icon;
    const categoryColor = 
        badge.category === 'Streak' ? 'text-accent bg-accent/10' :
        badge.category === 'Librarian' ? 'text-primary bg-primary/10' :
        'text-secondary bg-secondary/10';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card className={cn("text-center transition-all", isEarned ? 'border-accent/50 bg-accent/5' : 'bg-muted/50')}>
                        <CardContent className="p-6">
                            <div className={cn("mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4", categoryColor, !isEarned && 'grayscale opacity-50')}>
                                <Icon className="h-8 w-8" />
                            </div>
                            <p className={cn("font-semibold", !isEarned && 'text-muted-foreground')}>
                                {badge.name}
                            </p>
                            {!isEarned && <Lock className="h-4 w-4 text-muted-foreground mx-auto mt-1" />}
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-bold">{badge.name}</p>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default function AchievementsPage() {
  const { user } = useAuthContext();
  
  const earnedBadgeIds = new Set(user?.badges || []);
  const earnedCount = earnedBadgeIds.size;
  const totalCount = allBadges.length;
  const progress = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  const groupedBadges = allBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
        acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
            <Award className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        </div>
        <p className="text-muted-foreground">
          Track your progress and celebrate your learning milestones.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>You have unlocked {earnedCount} out of {totalCount} badges.</CardDescription>
        </CardHeader>
        <CardContent>
            <Progress value={progress} className="w-full" />
        </CardContent>
      </Card>

      {Object.entries(groupedBadges).map(([category, badges]) => (
        <div key={category}>
            <h2 className="text-2xl font-bold tracking-tight mb-4">{category} Badges</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {badges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} isEarned={earnedBadgeIds.has(badge.id)} />
                ))}
            </div>
        </div>
      ))}
      
    </div>
  );
}
