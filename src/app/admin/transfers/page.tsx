
// src/app/admin/transfers/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from 'next/navigation'
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
import { getAllLeads, type Lead } from "@/services/lead-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, FilterX, ChevronLeft, ChevronRight, Eye, Search, ArrowUpDown, Banknote, FileUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FundTransfer } from "@/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";


interface EnrichedTransfer extends FundTransfer {
  leadId: string;
  leadName: string; // Beneficiary name
  beneficiaryId: string;
}

type SortableColumn = 'transferredAt' | 'amount' | 'leadName' | 'transferredByUserName';
type SortDirection = 'asc' | 'desc';


function AllTransfersPageContent() {
    const [allTransfers, setAllTransfers] = useState<EnrichedTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMobile = useIsMobile();
    const [selectedTransfers, setSelectedTransfers] = useState<string[]>([]);

    // Input states
    const [searchInput, setSearchInput] = useState('');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
    });

    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortableColumn>('transferredAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        try {
            setLoading(true);
            const fetchedLeads = await getAllLeads();
            const transfers: EnrichedTransfer[] = [];
            
            fetchedLeads.forEach(lead => {
                if (lead.fundTransfers && lead.fundTransfers.length > 0) {
                    lead.fundTransfers.forEach(transfer => {
                        transfers.push({
                            ...transfer,
                            leadId: lead.id!,
                            leadName: lead.name,
                            beneficiaryId: lead.beneficiaryId
                        });
                    });
                }
            });
            
            setAllTransfers(transfers);
            setError(null);
        } catch (e) {
            setError("Failed to fetch transfer data. Please try again later.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    const filteredTransfers = useMemo(() => {
        let filtered = allTransfers.filter(transfer => {
            const searchMatch = appliedFilters.search === '' || 
                              transfer.leadName.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
                              transfer.transferredByUserName.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
                              (transfer.transactionId && transfer.transactionId.toLowerCase().includes(appliedFilters.search.toLowerCase()));

            return searchMatch;
        });

       return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            // Handle date/timestamp objects
            if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            }
             else if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }
            
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [allTransfers, appliedFilters, sortColumn, sortDirection]);
    
    const paginatedTransfers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransfers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransfers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);

    const resetFilters = () => {
        setSearchInput('');
        setAppliedFilters({ search: '' });
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const renderSortIcon = (column: SortableColumn) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('transferredAt')}>
                            Date {renderSortIcon('transferredAt')}
                        </Button>
                    </TableHead>
                    <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('leadName')}>
                            Beneficiary {renderSortIcon('leadName')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('amount')}>
                           Amount {renderSortIcon('amount')}
                        </Button>
                    </TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('transferredByUserName')}>
                           Transferred By {renderSortIcon('transferredByUserName')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedTransfers.map((transfer, index) => {
                    return (
                        <TableRow key={transfer.transactionId + index}>
                            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell>{format(transfer.transferredAt, "dd MMM yyyy, p")}</TableCell>
                            <TableCell>
                                <Link href={`/admin/leads/${transfer.leadId}`} className="hover:underline text-primary font-medium">
                                    {transfer.leadName}
                                </Link>
                            </TableCell>
                            <TableCell>₹{transfer.amount.toLocaleString()}</TableCell>
                            <TableCell className="font-mono text-xs">{transfer.transactionId || 'N/A'}</TableCell>
                            <TableCell>{transfer.transferredByUserName}</TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={transfer.proofUrl} target="_blank" rel="noopener noreferrer">View Proof</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedTransfers.map((transfer, index) => {
                 return (
                    <Card key={transfer.transactionId + index}>
                        <CardHeader>
                             <CardTitle className="text-lg flex justify-between">
                                <span>₹{transfer.amount.toLocaleString()}</span>
                                <span className="text-sm font-normal text-muted-foreground">{format(transfer.transferredAt, "dd MMM yyyy")}</span>
                             </CardTitle>
                             <CardDescription>To: <Link href={`/admin/leads/${transfer.leadId}`} className="hover:underline text-primary font-medium">{transfer.leadName}</Link></CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Transaction ID</span>
                                <span className="font-mono text-xs">{transfer.transactionId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Transferred By</span>
                                <span className="font-semibold">{transfer.transferredByUserName}</span>
                            </div>
                        </CardContent>
                         <CardFooter className="flex justify-end">
                            <Button asChild variant="outline" size="sm">
                                <Link href={transfer.proofUrl} target="_blank" rel="noopener noreferrer">View Proof</Link>
                            </Button>
                         </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
    
    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedTransfers.length} of {filteredTransfers.length} transfers.
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
                    <p className="ml-2">Loading transfers...</p>
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

        if (allTransfers.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No fund transfers have been recorded yet.</p>
                </div>
            )
        }
        
        if (filteredTransfers.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No transfers match your current filters.</p>
                    <Button variant="outline" onClick={resetFilters} className="mt-4">
                        <FilterX className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </div>
            );
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
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">All Fund Transfers</h2>
            <Button asChild>
                <Link href="/admin/leads">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Transfer
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Transfer History</CardTitle>
                <CardDescription>
                    A complete log of all funds transferred to beneficiaries. To add a new transfer, go to the Leads page and select a lead.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                        <Label htmlFor="searchFilter">Search by Beneficiary, Admin, or Transaction ID</Label>
                        <Input 
                            id="searchFilter" 
                            placeholder="Start typing to search..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end gap-4">
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

export default function AllTransfersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AllTransfersPageContent />
        </Suspense>
    )
}
