
"use client"

import * as React from "react"
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
import { addDays, format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear, getWeek, startOfWeek, endOfWeek } from "date-fns"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


const chartConfig = {
  donations: {
    label: "Donations",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

type AggregationLevel = 'daily' | 'weekly' | 'monthly';

export function DonationsChart({ donations }: { donations: Donation[] }) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subMonths(new Date(), 6),
        to: new Date(),
    });
    const [selectedTimeframe, setSelectedTimeframe] = useState('half-yearly');
    const [aggregation, setAggregation] = useState<AggregationLevel>('monthly');

    const setTimeframe = (timeframe: string) => {
        const now = new Date();
        setSelectedTimeframe(timeframe);
        switch(timeframe) {
            case 'monthly':
                setDate({ from: startOfMonth(now), to: endOfMonth(now) });
                setAggregation('daily'); // Default to daily for this month view
                break;
            case 'quarterly':
                setDate({ from: subMonths(now, 3), to: now });
                setAggregation('monthly');
                break;
            case 'half-yearly':
                setDate({ from: subMonths(now, 6), to: now });
                setAggregation('monthly');
                break;
            case 'yearly':
                setDate({ from: startOfYear(now), to: endOfYear(now) });
                setAggregation('monthly');
                break;
        }
    }


  const chartData = useMemo(() => {
    if (!date?.from || !date?.to) {
        return [];
    }

    const filteredDonations = donations.filter(d => {
        const donationDate = d.createdAt;
        if (!(donationDate instanceof Date)) return false;
        return (d.status === 'Verified' || d.status === 'Allocated') &&
               donationDate >= date.from! &&
               donationDate <= date.to!;
    });
    
    if (aggregation === 'daily' && selectedTimeframe === 'monthly') {
        const dailyTotals: { [key: string]: number } = {};
        let day = startOfMonth(new Date());
        while (day <= endOfMonth(new Date())) {
            dailyTotals[format(day, 'MMM d')] = 0;
            day = addDays(day, 1);
        }
        filteredDonations.forEach(d => {
            const dayKey = format((d.createdAt as Date), 'MMM d');
            dailyTotals[dayKey] += d.amount;
        });
        return Object.entries(dailyTotals).map(([day, total]) => ({ month: day, donations: total }));

    } else if (aggregation === 'weekly' && selectedTimeframe === 'monthly') {
        const weeklyTotals: { [key: string]: number } = {};
        filteredDonations.forEach(d => {
            const weekStart = startOfWeek((d.createdAt as Date), { weekStartsOn: 1 });
            const weekKey = `Week of ${format(weekStart, 'MMM d')}`;
            if (!weeklyTotals[weekKey]) weeklyTotals[weekKey] = 0;
            weeklyTotals[weekKey] += d.amount;
        });
        return Object.entries(weeklyTotals).map(([week, total]) => ({ month: week, donations: total }));
    
    } else { // monthly aggregation
        const monthlyTotals: { [key: string]: number } = {};
        let currentDate = new Date(date.from.getFullYear(), date.from.getMonth(), 1);
        const endDate = new Date(date.to.getFullYear(), date.to.getMonth(), 1);
        while (currentDate <= endDate) {
            const monthKey = format(currentDate, "MMM yyyy");
            monthlyTotals[monthKey] = 0;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        filteredDonations.forEach(d => {
            const monthKey = format((d.createdAt as Date), "MMM yyyy");
            if (monthKey in monthlyTotals) {
              monthlyTotals[monthKey] += d.amount;
            }
        });
        return Object.entries(monthlyTotals).map(([month, total]) => ({
          month: month.split(' ')[0], // Keep it short e.g., 'Jan'
          donations: total,
        }));
    }

  }, [donations, date, aggregation, selectedTimeframe]);

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
            <CardTitle className="font-headline">Donations Overview</CardTitle>
            <CardDescription>Verified donations from the selected time period.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
             <Select onValueChange={setTimeframe} value={selectedTimeframe}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="monthly">This Month</SelectItem>
                    <SelectItem value="quarterly">Last 3 Months</SelectItem>
                    <SelectItem value="half-yearly">Last 6 Months</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
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
        {selectedTimeframe === 'monthly' && (
            <div className="flex items-center space-x-6 pb-4">
                <Label>Group by:</Label>
                 <RadioGroup value={aggregation} onValueChange={(v) => setAggregation(v as AggregationLevel)} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily">Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly">Weekly</Label>
                    </div>
                </RadioGroup>
            </div>
        )}
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
