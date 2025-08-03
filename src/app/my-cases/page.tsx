
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FilePlus2, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lead, LeadStatus } from "@/services/types";

const statusColors: Record<LeadStatus, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
};


export default function MyCasesPage() {
    const [cases, setCases] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string |null>(null);
    const isMobile = useIsMobile();
    const [userId, setUserId] = useState<string | null>(null);

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
    }, []);

    useEffect(() => {
        if (!userId) return;

        const fetchCases = async () => {
            try {
                setLoading(true);
                const userCases = await getLeadsByBeneficiaryId(userId);
                // Sort by most recent first
                userCases.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                setCases(userCases);
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
    
    const paginatedCases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return cases.slice(startIndex, startIndex + itemsPerPage);
    }, [cases, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(cases.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
    

    const renderDesktopTable = () => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[30%]">Funding Progress</TableHead>
                    <TableHead className="text-right">Amount Requested</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedCases.map((caseItem, index) => {
                    const progress = caseItem.helpRequested > 0 ? (caseItem.helpGiven / caseItem.helpRequested) * 100 : 100;
                    return (
                        <TableRow key={caseItem.id}>
                            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell>{format(caseItem.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                            <TableCell>{caseItem.purpose}{caseItem.subCategory && ` (${caseItem.subCategory})`}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[caseItem.status])}>
                                    {caseItem.status}
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

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedCases.map((caseItem, index) => {
                const progress = caseItem.helpRequested > 0 ? (caseItem.helpGiven / caseItem.helpRequested) * 100 : 100;
                return (
                    <Card key={caseItem.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">#{(currentPage - 1) * itemsPerPage + index + 1}: For: {caseItem.purpose}</CardTitle>
                                    <CardDescription>Submitted: {format(caseItem.createdAt.toDate(), "dd MMM yyyy")}</CardDescription>
                                </div>
                                <Badge variant="outline" className={cn("capitalize", statusColors[caseItem.status])}>
                                    {caseItem.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-semibold">Funding Goal</span>
                                    <span className="font-semibold">₹{caseItem.helpRequested.toLocaleString()}</span>
                                </div>
                                <Progress value={progress} />
                                <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                                    <span>Raised: ₹{caseItem.helpGiven.toLocaleString()}</span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
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
        if (loading) {
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
                </div>
            )
        }

        return (
            <>
                {isMobile ? renderMobileCards() : renderDesktopTable()}
                {totalPages > 1 && renderPaginationControls()}
            </>
        )
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">My Help Requests</h2>
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
