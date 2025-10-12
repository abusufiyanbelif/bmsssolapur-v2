
// src/app/my-cases/page.tsx
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FilePlus2, Loader2, AlertCircle, ChevronLeft, ChevronRight, HandHeart, ArrowUpDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lead, LeadAction, AppSettings } from "@/services/types";
import { getAppSettings } from "@/services/app-settings-service";

const statusColors: Record<LeadAction, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Ready For Help": "bg-cyan-500/20 text-cyan-700 border-cyan-500/30",
    "Publish": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Complete": "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
    "On Hold": "bg-orange-500/20 text-orange-700 border-orange-500/30",
    "Cancelled": "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

type SortableColumn = 'createdAt' | 'helpRequested' | 'caseAction';
type SortDirection = 'asc' | 'desc';


export default function MyCasesPage() {
    const [cases, setCases] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string |null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortableColumn>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        } else {
            setError("You must be logged in to view your cases.");
            setLoading(false);
        }
        
        getAppSettings().then(s => setSettings(JSON.parse(JSON.stringify(s)))).catch(() => setError("Could not load app settings."));
    }, []);

    useEffect(() => {
        if (!userId) return;

        const fetchCases = async () => {
            try {
                setLoading(true);
                const userCases = await getLeadsByBeneficiaryId(userId);
                // Serialize the data immediately after fetching
                setCases(JSON.parse(JSON.stringify(userCases)));
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(`Failed to load your cases: ${errorMessage}`);
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchCases();
    }, [userId]);
    
    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }

    const sortedCases = useMemo(() => {
        return [...cases].sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];
            
            let comparison = 0;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else if (aValue instanceof Date && bValue instanceof Date) {
                comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [cases, sortColumn, sortDirection]);

    const paginatedCases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedCases.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedCases, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(cases.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
    
    const renderSortIcon = (column: SortableColumn) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const renderTable = () => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('createdAt')}>
                            Date Submitted {renderSortIcon('createdAt')}
                        </Button>
                    </TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('caseAction')}>
                           Status {renderSortIcon('caseAction')}
                        </Button>
                    </TableHead>
                    <TableHead className="w-[30%]">Funding Progress</TableHead>
                    <TableHead className="text-right">
                         <Button variant="ghost" onClick={() => handleSort('helpRequested')}>
                            Amount Req. {renderSortIcon('helpRequested')}
                        </Button>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedCases.map((caseItem, index) => {
                    const progress = caseItem.helpRequested > 0 ? (caseItem.helpGiven / caseItem.helpRequested) * 100 : 100;
                    const caseAction = caseItem.caseAction || 'Pending';
                    return (
                        <TableRow key={caseItem.id}>
                            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell>{format(new Date(caseItem.dateCreated), "dd MMM yyyy")}</TableCell>
                            <TableCell>{caseItem.purpose}{caseItem.category && ` (${caseItem.category})`}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[caseAction])}>
                                    {caseAction}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    <Progress value={progress}  />
                                    <span className="text-xs text-muted-foreground">
                                        ₹{caseItem.helpGiven.toLocaleString()} / ₹{caseItem.helpRequested.toLocaleString()}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">₹{caseItem.helpRequested.toLocaleString()}</TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    );
    
     const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedCases.length} of {cases.length} cases.
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
                        {[10, 25, 50].map((pageSize) => (
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
        if (loading || !settings) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading your cases...</p>
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

        if (cases.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">You have not submitted any help requests.</p>
                     {settings?.leadConfiguration?.allowBeneficiaryRequests && (
                        <Button asChild className="mt-4">
                            <Link href="/request-help">Request Help Now</Link>
                        </Button>
                    )}
                </div>
            )
        }

        return (
            <>
                {renderTable()}
                {totalPages > 1 && renderPaginationControls()}
            </>
        )
    }
  
  const allowBeneficiaryRequests = settings?.leadConfiguration?.allowBeneficiaryRequests ?? false;

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">My Help Requests</h2>
             {allowBeneficiaryRequests && (
                <Button asChild>
                    <Link href="/request-help">
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Request Help
                    </Link>
                </Button>
            )}
        </div>
      <Card>
        <CardHeader>
          <CardTitle>My Cases</CardTitle>
          <CardDescription>
            Here is a list of all the help requests you have submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
