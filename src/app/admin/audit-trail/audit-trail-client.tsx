
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { ActivityLog } from "@/services/activity-log-service";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, AlertCircle, FilterX, ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type SortableColumn = 'timestamp' | 'userName' | 'activity';
type SortDirection = 'asc' | 'desc';

interface AuditTrailPageClientProps {
    initialLogs: ActivityLog[];
    error?: string;
}


export function AuditTrailClient({ initialLogs, error: initialError }: AuditTrailPageClientProps) {
    const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
    const [loading, setLoading] = useState(false); // Initially false as we have initial data
    const [error, setError] = useState<string | null>(initialError || null);

    // Input states
    const [searchInput, setSearchInput] = useState('');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
    });
    
    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortableColumn>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedFilters({
            search: searchInput,
        });
    };
    
     const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }

    const filteredLogs = useMemo(() => {
        let filtered = logs.filter(log => {
            const searchMatch = appliedFilters.search === '' || 
                              log.userName.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
                              log.activity.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
                              (log.details.donationId && log.details.donationId.toLowerCase().includes(appliedFilters.search.toLowerCase())) ||
                              (log.details.leadId && log.details.leadId.toLowerCase().includes(appliedFilters.search.toLowerCase()));
            
            return searchMatch;
        });

        return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else if (String(aValue) > String(bValue)) {
                comparison = 1;
            } else if (String(aValue) < String(bValue)) {
                comparison = -1;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [logs, appliedFilters, sortColumn, sortDirection]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const resetFilters = () => {
        setSearchInput('');
        setAppliedFilters({ search: '' });
        setCurrentPage(1);
    };

    const renderSortIcon = (column: SortableColumn) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const renderDetails = (log: ActivityLog) => {
        const details = log.details || {};
        switch(log.activity) {
            case 'User Logged In': return `Logged in via ${details.method}.`;
            case 'Switched Role': return `Switched role from ${details.from} to ${details.to}.`;
            case 'Donation Created': return `Created donation of ₹${details.amount} from ${details.donorName}.`;
            case 'Donation Verified (Razorpay)': return `Verified donation of ₹${details.amount} from ${details.donorName} via Razorpay.`;
            case 'Donation Allocated': return `Allocated ₹${details.amount} to ${details.allocations?.length} lead(s).`;
            case 'Lead Created': return `Created lead for ${details.leadName}.`;
            case 'Status Changed': return `Status changed from "${details.from}" to "${details.to}".`;
            default: return JSON.stringify(details);
        }
    };
    
    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('timestamp')}>
                           Timestamp {renderSortIcon('timestamp')}
                        </Button>
                    </TableHead>
                     <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('userName')}>
                           User {renderSortIcon('userName')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('activity')}>
                           Activity {renderSortIcon('activity')}
                        </Button>
                    </TableHead>
                    <TableHead>Details</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedLogs.map((log) => {
                    return (
                        <TableRow key={log.id}>
                            <TableCell>
                                <p className="font-medium">{format(new Date(log.timestamp), "dd MMM yyyy, p")}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p>
                            </TableCell>
                            <TableCell>
                                <p className="font-semibold">{log.userName}</p>
                                <p className="text-sm text-muted-foreground">{log.role}</p>
                            </TableCell>
                             <TableCell>
                                <Badge variant="outline">{log.activity}</Badge>
                            </TableCell>
                             <TableCell className="text-sm text-muted-foreground">
                                {renderDetails(log)}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );

    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedLogs.length} of {filteredLogs.length} log entries.
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${itemsPerPage}`}
                        onValueChange={(value) => {
                            setItemsPerPage(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                        {[10, 25, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next</span>
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading audit trail...</p>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }
        
        if (filteredLogs.length === 0) {
             return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No logs match your current filters.</p>
                     <Button variant="outline" onClick={resetFilters} className="mt-4">
                        <FilterX className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </div>
            )
        }

        return (
            <>
                {renderTable()}
                {totalPages > 1 && renderPaginationControls()}
            </>
        );
    }
    
  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Audit Trail</h2>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>User Activity Logs</CardTitle>
                <CardDescription>
                    A chronological record of all significant actions taken by users across the application.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label htmlFor="searchFilter">Search by User, Activity, or ID</Label>
                        <Input 
                            id="searchFilter" 
                            placeholder="Start typing to search..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end gap-4 md:col-span-2">
                        <Button onClick={handleSearch} className="w-full">
                           <Search className="mr-2 h-4 w-4" />
                            Search
                        </Button>
                        <Button variant="outline" onClick={resetFilters} className="w-full">
                            <FilterX className="mr-2 h-4 w-4" />
                            Clear
                        </Button>
                    </div>
                </div>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  )
}
