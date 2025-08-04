
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Donation } from "@/services/types"
import { useMemo } from "react"
import { format } from "date-fns"

const chartConfig = {
  donations: {
    label: "Donations",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface DonationsChartProps {
  donations: Donation[]
}

export function DonationsChart({ donations }: DonationsChartProps) {
  const chartData = useMemo(() => {
    const now = new Date()
    const monthlyTotals: { [key: string]: number } = {}

    // Initialize the last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = format(d, "MMM yyyy")
      monthlyTotals[monthKey] = 0
    }
    
    // Filter and aggregate donations
    donations
      .filter(d => d.status === 'Verified' || d.status === 'Allocated')
      .forEach(d => {
        const donationDate = d.createdAt.toDate()
        const monthKey = format(donationDate, "MMM yyyy")
        if (monthKey in monthlyTotals) {
          monthlyTotals[monthKey] += d.amount
        }
      })

    return Object.entries(monthlyTotals).map(([month, total]) => ({
      month: month.split(' ')[0],
      donations: total,
    }))
  }, [donations])

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="font-headline">Donations Overview</CardTitle>
        <CardDescription>Verified donations from the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
             <YAxis
                tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  indicator="dot"
                />
              }
            />
            <Bar
              dataKey="donations"
              fill="var(--color-donations)"
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
