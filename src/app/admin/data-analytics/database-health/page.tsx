'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, Database, CheckCircle, AlertTriangle, FileWarning, BarChart2, List, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDatabaseHealthStats, getDatabaseDetails, CollectionStat } from "./actions";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';


const chartConfig = {
  count: { label: "Records", color: "hsl(var(--primary))" },
  orphans: { label: "Orphans", color: "hsl(var(--destructive))" },
} as const;

export default function DatabaseHealthPage() {
    const [stats, setStats] = useState<CollectionStat[]>([]);
    const [dbDetails, setDbDetails] = useState<{ projectId: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [fetchedStats, fetchedDetails] = await Promise.all([
                    getDatabaseHealthStats(),
                    getDatabaseDetails()
                ]);
                setStats(fetchedStats);
                setDbDetails(fetchedDetails);
            } catch (e) {
                setError(e instanceof Error ? e.message : "An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const chartData = stats.map(s => ({
        name: s.name,
        count: s.count,
        orphans: s.orphanCheck?.orphanCount || 0,
    }));

    const renderContent = () => {
        if (loading) {
            return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
        }

        if (error) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }
        
        if (viewMode === 'chart') {
            return (
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                            <Bar dataKey="orphans" fill="var(--color-orphans)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Collection</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Record Count</TableHead>
                        <TableHead className="text-center">Last Modified</TableHead>
                        <TableHead className="text-center">Orphan Check</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.map(stat => (
                        <TableRow key={stat.name}>
                            <TableCell className="font-semibold">{stat.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{stat.description}</TableCell>
                            <TableCell className="text-right font-mono">{stat.count.toLocaleString()}</TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">
                                {stat.lastModified ? (
                                    <div title={format(stat.lastModified, 'PPP p')}>
                                        {formatDistanceToNow(stat.lastModified, { addSuffix: true })}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                {!stat.orphanCheck ? (
                                    <span className="text-xs text-muted-foreground">-</span>
                                ) : stat.orphanCheck.orphanCount > 0 ? (
                                    <div className="flex items-center justify-center gap-2 text-destructive font-semibold">
                                        <FileWarning className="h-4 w-4" /> {stat.orphanCheck.orphanCount} Found
                                    </div>
                                ) : (
                                     <div className="flex items-center justify-center gap-2 text-green-600">
                                        <CheckCircle className="h-4 w-4" /> Clean
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Database Health</h2>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Server />
                        Database Details
                    </CardTitle>
                </CardHeader>
                 <CardContent>
                    {loading ? (
                        <Skeleton className="h-8 w-1/2" />
                    ) : dbDetails ? (
                         <div className="text-sm">
                            <span className="text-muted-foreground">Project ID: </span>
                            <span className="font-mono bg-muted px-2 py-1 rounded-md">{dbDetails.projectId}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Could not load database details.</p>
                    )}
                 </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                             <CardTitle className="flex items-center gap-2 text-primary">
                                <Database />
                                Firestore Collections
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                An overview of your database collections, record counts, and data integrity checks.
                            </CardDescription>
                        </div>
                        <RadioGroup defaultValue="table" value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'chart')} className="flex items-center gap-1 rounded-lg bg-muted p-1">
                            <Label htmlFor="table-view" className="flex h-9 items-center justify-center rounded-md border text-xs font-normal cursor-pointer px-3 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow">
                                <List className="mr-2 h-4 w-4" />Table
                                <RadioGroupItem value="table" id="table-view" className="sr-only" />
                            </Label>
                             <Label htmlFor="chart-view" className="flex h-9 items-center justify-center rounded-md border text-xs font-normal cursor-pointer px-3 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow">
                                <BarChart2 className="mr-2 h-4 w-4" />Chart
                                <RadioGroupItem value="chart" id="chart-view" className="sr-only" />
                            </Label>
                        </RadioGroup>
                    </div>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
