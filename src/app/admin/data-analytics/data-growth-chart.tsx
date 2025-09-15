
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts"
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
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import type { User, Lead, Donation } from "@/services/types"
import { useMemo, useState } from "react"
import { addDays, format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Users, FileText, HandHeart, LineChartIcon, BarChart2, AreaChartIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


const chartConfig = {
  users: {
    label: "New Users",
    color: "hsl(var(--primary))",
    icon: Users,
  },
  leads: {
    label: "New Leads",
    color: "hsl(var(--destructive))",
     icon: FileText,
  },
  donations: {
    label: "New Donations",
    color: "hsl(var(--accent))",
    icon: HandHeart,
  },
} satisfies ChartConfig

type ChartType = "line" | "bar" | "area";

export function DataGrowthChart({ users, leads, donations }: { users: User[], leads: Lead[], donations: Donation[] }) {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subMonths(new Date(), 6),
        to: new Date(),
    });
    const [chartType, setChartType] = useState<ChartType>("line");

    const setTimeframe = (timeframe: string) => {
        const now = new Date();
        switch(timeframe) {
            case 'monthly':
                setDate({ from: startOfMonth(now), to: endOfMonth(now) });
                break;
            case 'quarterly':
                setDate({ from: subMonths(now, 3), to: now });
                break;
            case 'half-yearly':
                setDate({ from: subMonths(now, 6), to: now });
                break;
            case 'yearly':
                setDate({ from: startOfYear(now), to: endOfYear(now) });
                break;
        }
    }


  const chartData = useMemo(() => {
    if (!date?.from || !date?.to) {
        return [];
    }

    const monthlyTotals: { [key: string]: { users: number; leads: number; donations: number } } = {};
    let currentDate = new Date(date.from.getFullYear(), date.from.getMonth(), 1);
    const endDate = new Date(date.to.getFullYear(), date.to.getMonth(), 1);

    while (currentDate <= endDate) {
        const monthKey = format(currentDate, "MMM yyyy");
        monthlyTotals[monthKey] = { users: 0, leads: 0, donations: 0 };
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const filterAndCount = (items: (User | Lead | Donation)[], key: 'users' | 'leads' | 'donations') => {
        items.forEach(item => {
            const itemDate = item.createdAt;
            if (itemDate instanceof Date && itemDate >= date.from! && itemDate <= date.to!) {
                 const monthKey = format(itemDate, "MMM yyyy");
                if (monthKey in monthlyTotals) {
                    monthlyTotals[monthKey][key]++;
                }
            }
        });
    }

    filterAndCount(users, 'users');
    filterAndCount(leads, 'leads');
    filterAndCount(donations, 'donations');

    return Object.entries(monthlyTotals).map(([month, totals]) => ({
        month: month.split(' ')[0], // Keep it short e.g., 'Jan'
        ...totals
    }));

  }, [users, leads, donations, date]);

  const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 20, right: 20, left: 0, bottom: 5 },
        };

        const components = (
            <>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                content={
                    <ChartTooltipContent
                    indicator="dot"
                    />
                }
                />
                <ChartLegend content={<ChartLegendContent />} />
            </>
        );

        switch(chartType) {
            case 'bar':
                return (
                    <BarChart accessibilityLayer {...commonProps}>
                        {components}
                        <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                        <Bar dataKey="leads" fill="var(--color-leads)" radius={4} />
                        <Bar dataKey="donations" fill="var(--color-donations)" radius={4} />
                    </BarChart>
                );
            case 'area':
                 return (
                    <AreaChart accessibilityLayer {...commonProps}>
                        {components}
                        <defs>
                            <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.1}/>
                            </linearGradient>
                             <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0.1}/>
                            </linearGradient>
                             <linearGradient id="fillDonations" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-donations)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--color-donations)" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="users" stroke="var(--color-users)" fill="url(#fillUsers)" stackId="a" />
                        <Area type="monotone" dataKey="leads" stroke="var(--color-leads)" fill="url(#fillLeads)" stackId="a" />
                        <Area type="monotone" dataKey="donations" stroke="var(--color-donations)" fill="url(#fillDonations)" stackId="a" />
                    </AreaChart>
                 );
            case 'line':
            default:
                return (
                    <LineChart accessibilityLayer {...commonProps}>
                        {components}
                        <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-users)", stroke: "hsl(var(--background))" }} />
                        <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-leads)", stroke: "hsl(var(--background))" }} />
                        <Line type="monotone" dataKey="donations" stroke="var(--color-donations)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-donations)", stroke: "hsl(var(--background))" }} />
                    </LineChart>
                )
        }
    }

  return (
    <Card>
      <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
            <CardTitle className="font-headline flex items-center gap-2">
                Data Growth Overview
            </CardTitle>
            <CardDescription>New users, leads, and donations created over the selected period.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
             <Select onValueChange={setTimeframe} defaultValue="half-yearly">
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
         <div className="flex justify-end pb-4">
             <RadioGroup value={chartType} onValueChange={(v) => setChartType(v as ChartType)} className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <Label htmlFor="line-data" className={cn("flex h-8 w-8 items-center justify-center rounded-md border text-xs font-normal cursor-pointer", chartType === 'line' && "bg-background text-foreground shadow")}>
                    <LineChartIcon className="h-4 w-4" />
                    <RadioGroupItem value="line" id="line-data" className="sr-only" />
                </Label>
                <Label htmlFor="bar-data" className={cn("flex h-8 w-8 items-center justify-center rounded-md border text-xs font-normal cursor-pointer", chartType === 'bar' && "bg-background text-foreground shadow")}>
                    <BarChart2 className="h-4 w-4" />
                     <RadioGroupItem value="bar" id="bar-data" className="sr-only" />
                </Label>
                 <Label htmlFor="area-data" className={cn("flex h-8 w-8 items-center justify-center rounded-md border text-xs font-normal cursor-pointer", chartType === 'area' && "bg-background text-foreground shadow")}>
                    <AreaChartIcon className="h-4 w-4" />
                    <RadioGroupItem value="area" id="area-data" className="sr-only" />
                </Label>
            </RadioGroup>
        </div>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
