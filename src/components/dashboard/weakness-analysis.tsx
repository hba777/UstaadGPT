
"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { getQuizHistory } from "@/lib/firestore";
import { type QuizHistory } from "@/models/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingDown, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface TopicStats {
  topic: string; // Book title
  bookId: string;
  averageScore: number;
  attempts: number;
}

const WEAKNESS_THRESHOLD = 70; // score < 70% is a weakness

export function WeaknessAnalysis() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [weakTopics, setWeakTopics] = useState<TopicStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const analyzeHistory = async () => {
      setIsLoading(true);
      try {
        const history = await getQuizHistory(user.uid);
        
        const topicMap = new Map<string, { scores: number[], count: number, bookId: string }>();

        history.forEach(attempt => {
          if (!topicMap.has(attempt.bookTitle)) {
            topicMap.set(attempt.bookTitle, { scores: [], count: 0, bookId: attempt.bookId });
          }
          const entry = topicMap.get(attempt.bookTitle)!;
          entry.scores.push(attempt.score);
          entry.count++;
        });

        const allTopicStats: TopicStats[] = [];
        topicMap.forEach((stats, topic) => {
          const averageScore = stats.scores.reduce((a, b) => a + b, 0) / stats.count;
          allTopicStats.push({
            topic,
            bookId: stats.bookId,
            averageScore: Math.round(averageScore),
            attempts: stats.count,
          });
        });
        
        const identifiedWeaknesses = allTopicStats
          .filter(stat => stat.averageScore < WEAKNESS_THRESHOLD)
          .sort((a, b) => a.averageScore - b.averageScore); // Sort by lowest score first
        
        setWeakTopics(identifiedWeaknesses);

      } catch (error) {
        console.error("Error analyzing quiz history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeHistory();
  }, [user]);

  const handleTopicClick = (bookId: string) => {
    router.push(`/my-books/${bookId}`);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target /> Focus Areas</CardTitle>
          <CardDescription>Analyzing your quiz performance...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (weakTopics.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target /> Focus Areas</CardTitle>
                <CardDescription>Here are topics you could work on based on your quiz scores.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground p-8">
                    <TrendingDown className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">No Weaknesses Detected!</p>
                    <p className="text-sm">Keep up the great work. All your recent quiz scores are above {WEAKNESS_THRESHOLD}%.</p>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target /> Focus Areas</CardTitle>
            <CardDescription>Based on your quiz history, you might want to review these topics.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="space-y-3">
                {weakTopics.map(topic => (
                    <li 
                        key={topic.bookId}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <TrendingDown className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <p className="font-semibold">{topic.topic}</p>
                                <p className="text-sm text-muted-foreground">
                                    Avg. Score: <span className="font-bold text-destructive">{topic.averageScore}%</span> over {topic.attempts} attempt{topic.attempts > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleTopicClick(topic.bookId)}
                            className="w-full sm:w-auto"
                        >
                            Study this topic
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
  );
}
