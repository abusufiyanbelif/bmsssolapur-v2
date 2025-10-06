
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ActivityLog } from "@/services/types"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"

const chartConfig = {
  logins: {
    label: "Logins",
    color: "hsl(var(--primary))",
  },
  password: {
    label: "Password",
    color: "hsl(var(--primary))",
  },
  otp: {
    label: "OTP",
    color: "hsl(var(--accent))",
  },
  'google-oauth': {
    label: "Google",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

export function LoginAnalyticsChart({ allActivityLogs }: { allActivityLogs: ActivityLog[] }) {
    const { loginData, userData, totalLogins } = useMemo(() => {
        const logins = allActivityLogs.filter(log => log.activity === 'User Logged In');
        
        const loginData = [
            { method: 'password', count: logins.filter(l => l.details.method === 'password').length, fill: "var(--color-password)" },
            { method: 'otp', count: logins.filter(l => l.details.method === 'otp').length, fill: "var(--color-otp)" },
            { method: 'google-oauth', count: logins.filter(l => l.details.method === 'google-oauth').length, fill: "var(--color-google-oauth)" },
        ].sort((a,b) => b.count - a.count);

        const userLoginCounts = logins.reduce((acc, log) => {
            if (!acc[log.userId]) {
                acc[log.userId] = { name: log.userName, password: 0, otp: 0, google: 0, total: 0 };
            }
            if (log.details.method === 'password') acc[log.userId].password++;
            if (log.details.method === 'otp') acc[log.userId].otp++;
            if (log.details.method === 'google-oauth') acc[log.userId].google++;
            acc[log.userId].total++;
            return acc;
        }, {} as Record<string, {name: string, password: number, otp: number, google: number, total: number}>);
        
        const userData = Object.entries(userLoginCounts).map(([userId, data]) => {
            let mostFrequent = 'password';
            if (data.otp > data.password && data.otp > data.google) mostFrequent = 'otp';
            if (data.google > data.password && data.google > data.otp) mostFrequent = 'google';
            return { userId, ...data, mostFrequent };
        }).sort((a, b) => b.total - a.total);

        return { loginData, userData, totalLogins: logins.length };
    }, [allActivityLogs]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Login Methods Breakdown</CardTitle>
                <CardDescription>A summary of how users are logging into the application. Total Logins: {totalLogins}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart
                            accessibilityLayer
                            data={loginData}
                            layout="vertical"
                            margin={{ left: 20 }}
                        >
                            <YAxis
                                dataKey="method"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label || value}
                            />
                            <XAxis dataKey="count" type="number" hide />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="line" />}
                            />
                            <Bar dataKey="count" radius={5} />
                        </BarChart>
                    </ChartContainer>
                </div>
                 <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="text-center">Total Logins</TableHead>
                                <TableHead className="text-right">Most Frequent</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userData.map(user => (
                                <TableRow key={user.userId}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell className="text-center">{user.total}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="capitalize">{user.mostFrequent}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
