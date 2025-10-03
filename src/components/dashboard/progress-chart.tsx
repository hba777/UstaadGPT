"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { getUserBooks, type Book } from "@/lib/firestore"
import { useAuthContext } from "@/context/AuthContext"
import { Skeleton } from "../ui/skeleton"

type ChartData = {
  name: string;
  total: number;
}

export function ProgressChart() {
  const { user } = useAuthContext();
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookData = async () => {
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
          if (book.createdAt?.toDate) {
            const date = book.createdAt.toDate();
            if (date.getFullYear() === currentYear) {
              const month = date.getMonth();
              monthlyData[month]++;
            }
          }
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

    fetchBookData();
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
