'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, HardDrive, BarChart2, List, File, Box, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getStorageAnalytics, type StorageAnalytics, type StorageFile } from "./actions";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const chartConfig = {
  size: { label: "Size (MB)", color: "hsl(var(--primary))" },
  count: { label: "File Count", color: "hsl(var(--accent))" },
} as const;

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function StorageAnalyticsPage() {
    const [analytics, setAnalytics] = useState<StorageAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const fetchedAnalytics = await getStorageAnalytics();
                setAnalytics(fetchedAnalytics);
            } catch (e) {
                setError(e instanceof Error ? e.message : "An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const paginatedFiles = useMemo(() => {
        if (!analytics?.files) return [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        return analytics.files.slice(startIndex, startIndex + itemsPerPage);
    }, [analytics, currentPage, itemsPerPage]);

    const totalPages = analytics ? Math.ceil(analytics.files.length / itemsPerPage) : 0;

    const chartData = useMemo(() => {
        return analytics?.folderSummary.map(folder => ({
            name: folder.name,
            size: parseFloat((folder.size / (1024 * 1024)).toFixed(2)), // Size in MB
            count: folder.count,
        })) || [];
    }, [analytics]);

    const renderFileTable = () => (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>File Name / Path</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Content Type</TableHead>
                        <TableHead>Last Modified</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedFiles.map(file => (
                        <TableRow key={file.name}>
                            <TableCell className="font-mono text-xs">
                                <Link href={file.publicUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                    {file.name}
                                </Link>
                            </TableCell>
                            <TableCell>{formatBytes(file.size)}</TableCell>
                            <TableCell>{file.contentType}</TableCell>
                            <TableCell>{format(file.updatedAt, "dd MMM yyyy, p")}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end gap-4 pt-4">
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select value={`${itemsPerPage}`} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                        <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
                        <SelectContent side="top">
                        {[10, 25, 50, 100].map(pageSize => <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">Page {currentPage} of {totalPages}</div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>
        </>
    );

    const renderChart = () => (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="hsl(var(--primary))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `${value} MB`} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent formatter={(value, name) => `${value.toLocaleString()}${name === 'size' ? ' MB' : ' files'}`} />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="size" fill="var(--color-size)" radius={4} />
                    <Bar yAxisId="right" dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );

    const renderContent = () => {
        if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
        if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
        if (!analytics || analytics.totalCount === 0) return <p className="text-center text-muted-foreground p-8">No files found in Firebase Storage.</p>;

        return (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                            <Box className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatBytes(analytics.totalSize)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                            <File className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{analytics.totalCount.toLocaleString()}</div></CardContent>
                    </Card>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-xl font-bold tracking-tight font-headline text-primary">Usage Breakdown</h3>
                    <RadioGroup defaultValue="chart" value={viewMode} onValueChange={(v) => setViewMode(v as 'chart' | 'table')} className="flex items-center gap-1 rounded-lg bg-muted p-1">
                        <Label htmlFor="chart-view" className="flex h-9 items-center justify-center rounded-md border text-xs font-normal cursor-pointer px-3 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow">
                            <BarChart2 className="mr-2 h-4 w-4" />Chart
                            <RadioGroupItem value="chart" id="chart-view" className="sr-only" />
                        </Label>
                        <Label htmlFor="table-view" className="flex h-9 items-center justify-center rounded-md border text-xs font-normal cursor-pointer px-3 data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow">
                            <List className="mr-2 h-4 w-4" />Table
                            <RadioGroupItem value="table" id="table-view" className="sr-only" />
                        </Label>
                    </RadioGroup>
                </div>
                {viewMode === 'chart' ? renderChart() : renderFileTable()}
            </>
        );
    };

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Storage Analytics</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <HardDrive />
                        Firebase Storage
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        An overview of your file storage usage, including total size, file count, and breakdown by folder.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
