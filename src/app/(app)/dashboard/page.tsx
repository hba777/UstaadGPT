
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
import { getUserBooks } from '@/lib/firestore';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [booksCount, setBooksCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      getUserBooks(user.uid).then(books => setBooksCount(books.length));
    }
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
        <StatsCard
          title="Books Created"
          value={booksCount.toString()}
          description="Total number of books in your library."
          icon={<BookCheck className="h-4 w-4 text-muted-foreground" />}
        />
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
