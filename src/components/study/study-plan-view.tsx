"use client";

import { useState } from "react";
import { generateStudyPlan, type GenerateStudyPlanOutput } from "@/ai/flows/generate-study-plan";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, LoaderCircle, Sparkles, CheckCircle2 } from "lucide-react";

interface StudyPlanViewProps {
  documentContent: string;
}

export function StudyPlanView({ documentContent }: StudyPlanViewProps) {
  const { toast } = useToast();
  const [userGoal, setUserGoal] = useState("");
  const [studyPlan, setStudyPlan] = useState<GenerateStudyPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePlan = async () => {
    if (!userGoal.trim()) {
      toast({ variant: "destructive", title: "Goal Required", description: "Please enter your study goal." });
      return;
    }
    setIsLoading(true);
    setStudyPlan(null);
    try {
      const result = await generateStudyPlan({ documentContent, userGoal });
      setStudyPlan(result);
    } catch (error) {
      console.error("Error generating study plan:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate study plan. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <CalendarCheck />
        AI Study Plan Generator
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder='e.g., "Learn this chapter by next Friday"'
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={handleGeneratePlan} disabled={isLoading || !userGoal.trim()}>
          {isLoading ? <LoaderCircle className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
          Generate Plan
        </Button>
      </div>

      <div className="flex-grow rounded-lg border bg-card text-card-foreground shadow-sm p-4 overflow-hidden min-h-0">
        <ScrollArea className="h-full pr-4">
            {isLoading && (
                <div className="space-y-6 p-2">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-2/5" />
                                <Skeleton className="h-4 w-3/5 mt-2" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
          {!isLoading && !studyPlan && (
            <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <CalendarCheck className="mx-auto h-12 w-12" />
              <p className="mt-2 font-semibold">Ready to get organized?</p>
              <p className="text-sm">Enter your goal above to generate a personalized study plan.</p>
            </div>
          )}
          {!isLoading && studyPlan && (
            <div className="space-y-4">
                {studyPlan.plan.map((dayPlan) => (
                    <Card key={dayPlan.day}>
                        <CardHeader>
                            <CardTitle className="text-lg">Day {dayPlan.day}: {dayPlan.topic}</CardTitle>
                            <CardDescription>Focus on understanding the core concepts of {dayPlan.topic.toLowerCase()}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {dayPlan.activities.map((activity, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{activity}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
