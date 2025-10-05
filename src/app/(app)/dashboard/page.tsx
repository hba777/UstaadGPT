
"use client";

import { Award, BookCheck, Flame } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ProgressChart } from '@/components/dashboard/progress-chart'
import { useAuthContext } from '@/context/AuthContext';
import { WeaknessAnalysis } from '@/components/dashboard/weakness-analysis';
import { RecommendationCard } from '@/components/dashboard/recommendation-card';
import { useEffect, useState } from 'react';
import { getQuizHistory } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface CompletedCoursesStats {
    total: number;
    lastMonth: number;
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [completedStats, setCompletedStats] = useState<CompletedCoursesStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
        setIsLoadingStats(true);
        try {
            const history = await getQuizHistory(user.uid);
            
            // Calculate total unique courses completed
            const completedBookIds = new Set(history.map(h => h.bookId));
            const totalCompleted = completedBookIds.size;

            // Calculate courses completed in the last month
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            const lastMonthAttempts = history.filter(h => h.attemptedAt.toDate() > oneMonthAgo);
            const lastMonthBookIds = new Set(lastMonthAttempts.map(h => h.bookId));
            const lastMonthCompleted = lastMonthBookIds.size;

            setCompletedStats({ total: totalCompleted, lastMonth: lastMonthCompleted });

        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
            setCompletedStats({ total: 0, lastMonth: 0 }); // Set to 0 on error
        } finally {
            setIsLoadingStats(false);
        }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a summary of your progress.
        </p>
      </div>

      <RecommendationCard />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Study Streak"
          value={`${user?.loginStreak || 0} Day${(user?.loginStreak || 0) !== 1 ? 's' : ''}`}
          description="Keep it up! Consistency is key."
          icon={<Flame className="h-4 w-4 text-muted-foreground" />}
        />
        {isLoadingStats ? (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
                    <BookCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardContent>
            </Card>
        ) : (
            <StatsCard
              title="Courses Completed"
              value={completedStats?.total.toString() || '0'}
              description={`+${completedStats?.lastMonth || 0} from last month`}
              icon={<BookCheck className="h-4 w-4 text-muted-foreground" />}
            />
        )}
        <StatsCard
          title="Points Earned"
          value={user?.points?.toLocaleString() || '0'}
          description="You're climbing the leaderboard!"
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <WeaknessAnalysis />
        <Card>
          <CardHeader>
            <CardTitle>Learning Activity</CardTitle>
            <CardDescription>A monthly overview of your created books, quizzes, and flashcards.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
