
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
import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const chartConfig = {
  donations: {
    label: "Donations",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface DonationsChartProps {
  donations: Donation[]
}

type TimeRangeOption = "3" | "6" | "12";

export function DonationsChart({ donations }: DonationsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("6");

  const chartData = useMemo(() => {
    const now = new Date()
    const monthlyTotals: { [key: string]: number } = {}
    const monthsToShow = parseInt(timeRange, 10);

    // Initialize the last N months with 0
    for (let i = monthsToShow - 1; i >= 0; i--) {
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
  }, [donations, timeRange])

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle className="font-headline">Donations Overview</CardTitle>
            <CardDescription>Verified donations from the selected time period.</CardDescription>
        </div>
        <div className="w-[150px]">
             <Select value={timeRange} onValueChange={(value: TimeRangeOption) => setTimeRange(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="3">Last 3 Months</SelectItem>
                    <SelectItem value="6">Last 6 Months</SelectItem>
                    <SelectItem value="12">Last 12 Months</SelectItem>
                </SelectContent>
            </Select>
        </div>
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
