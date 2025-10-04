
"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { getUserBooks, type Book, type SavedFlashcardSet, type SavedQuizSet } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext"
import { Skeleton } from "../ui/skeleton"
import type { Timestamp } from "firebase/firestore"

type ChartData = {
  name: string;
  total: number;
}

const getDateFromTimestamp = (timestamp: Timestamp): Date | null => {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
}

export function ProgressChart() {
  const { user } = useAuthContext();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const books = await getUserBooks(user.uid);
        const monthlyData: { [key: number]: number } = {};

        for(let i = 0; i < 12; i++) {
          monthlyData[i] = 0;
        }

        const currentYear = new Date().getFullYear();

        books.forEach((book: Book) => {
          // Count book creation
          const bookCreationDate = getDateFromTimestamp(book.createdAt);
          if (bookCreationDate && bookCreationDate.getFullYear() === currentYear) {
            const month = bookCreationDate.getMonth();
            monthlyData[month]++;
          }

          // Count saved flashcard sets
          (book.savedFlashcards || []).forEach((set: SavedFlashcardSet) => {
            const setCreationDate = getDateFromTimestamp(set.createdAt);
            if(setCreationDate && setCreationDate.getFullYear() === currentYear) {
              const month = setCreationDate.getMonth();
              monthlyData[month]++;
            }
          });

          // Count saved quiz sets
          (book.savedQuizzes || []).forEach((set: SavedQuizSet) => {
             const setCreationDate = getDateFromTimestamp(set.createdAt);
            if(setCreationDate && setCreationDate.getFullYear() === currentYear) {
              const month = setCreationDate.getMonth();
              monthlyData[month]++;
            }
          });
        });
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartData = monthNames.map((name, index) => ({
          name,
          total: monthlyData[index] || 0
        }));

        setData(chartData);
      } catch (error) {
        console.error("Failed to fetch book data for chart:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [user]);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          contentStyle={{ 
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)"
          }}
          labelStyle={{
            color: "hsl(var(--foreground))"
          }}
          formatter={(value: number) => [value, 'Activities']}
        />
        <Bar
          dataKey="total"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
