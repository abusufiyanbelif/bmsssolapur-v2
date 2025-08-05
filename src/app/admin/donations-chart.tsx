
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
import { addDays, format, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

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
    const [date, setDate] = useState<DateRange | undefined>({
        from: subMonths(new Date(), 6),
        to: new Date(),
    });

  const chartData = useMemo(() => {
    if (!date?.from || !date?.to) {
        return [];
    }
    
    // Create a map to hold monthly totals
    const monthlyTotals: { [key: string]: number } = {};

    // Initialize all months within the range with 0
    let currentDate = new Date(date.from.getFullYear(), date.from.getMonth(), 1);
    const endDate = new Date(date.to.getFullYear(), date.to.getMonth(), 1);

    while (currentDate <= endDate) {
        const monthKey = format(currentDate, "MMM yyyy");
        monthlyTotals[monthKey] = 0;
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Filter and aggregate donations that fall within the selected date range
    donations
      .filter(d => {
        const donationDate = d.createdAt.toDate();
        return (d.status === 'Verified' || d.status === 'Allocated') &&
               donationDate >= date.from! &&
               donationDate <= date.to!;
      })
      .forEach(d => {
        const donationDate = d.createdAt.toDate()
        const monthKey = format(donationDate, "MMM yyyy")
        if (monthKey in monthlyTotals) {
          monthlyTotals[monthKey] += d.amount
        }
      })

    return Object.entries(monthlyTotals).map(([month, total]) => ({
      month: month.split(' ')[0], // Keep it short e.g., 'Jan'
      donations: total,
    }))
  }, [donations, date])

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle className="font-headline">Donations Overview</CardTitle>
            <CardDescription>Verified donations from the selected time period.</CardDescription>
        </div>
        <div className="w-[280px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
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
