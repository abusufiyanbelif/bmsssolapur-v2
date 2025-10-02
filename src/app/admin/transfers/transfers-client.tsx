

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
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, FilterX, ChevronLeft, ChevronRight, Eye, Search, ArrowUpDown, Banknote, FileUp, Download, Trash2, Check, MoreHorizontal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FundTransfer } from "@/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleBulkDeleteTransfers } from "./actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAllLeads, Lead } from "@/services/lead-service";


export interface EnrichedTransfer extends FundTransfer {
  leadId: string;
  leadName: string; // Beneficiary name
  beneficiaryId?: string;
  uniqueId: string; // A unique identifier for the transfer itself
}

type SortableColumn = 'transferredAt' | 'amount' | 'leadName' | 'transferredByUserName';
type SortDirection = 'asc' | 'desc';


export function AllTransfersPageClient({ initialTransfers, error: initialError }: { initialTransfers: EnrichedTransfer[], error?: string }) {
    const [allTransfers, setAllTransfers] = useState<EnrichedTransfer[]>(initialTransfers);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
    const [selectedTransfers, setSelectedTransfers] = useState<string[]>([]);
    const isMobile = useIsMobile();
    const { toast } = useToast();

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
                    lead.fundTransfers.forEach((transfer, index) => {
                        transfers.push({
                            ...transfer,
                            leadId: lead.id!,
                            leadName: lead.name,
                            beneficiaryId: lead.beneficiaryId,
                            uniqueId: `${lead.id!}_${index}` // Create a unique key for selection
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

    const onBulkDeleteSuccess = () => {
        toast({
            title: "Transfers Deleted",
            description: `${selectedTransfers.length} transfer(s) have been successfully removed.`,
        });
        setSelectedTransfers([]);
        fetchData();
    };

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
             else if (String(aValue) > String(bValue)) {
                comparison = 1;
            } else if (String(aValue) < String(bValue)) {
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
    
    const renderActions = (transfer: EnrichedTransfer) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/admin/leads/${transfer.leadId}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Lead
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <a href={transfer.proofUrl} target="_blank" rel="noopener noreferrer">
                         <Download className="mr-2 h-4 w-4" /> View Proof
                    </a>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead padding="checkbox">
                        <Checkbox
                            checked={paginatedTransfers.length > 0 && selectedTransfers.length === paginatedTransfers.length}
                            onCheckedChange={(checked) => {
                                const currentPageIds = paginatedTransfers.map(t => t.uniqueId);
                                if (checked) {
                                    setSelectedTransfers(prev => [...new Set([...prev, ...currentPageIds])]);
                                } else {
                                    setSelectedTransfers(prev => prev.filter(id => !currentPageIds.includes(id)));
                                }
                            }}
                            aria-label="Select all on current page"
                        />
                    </TableHead>
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
                        <TableRow key={transfer.uniqueId} data-state={selectedTransfers.includes(transfer.uniqueId) ? 'selected' : ''}>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedTransfers.includes(transfer.uniqueId)}
                                    onCheckedChange={(checked) => {
                                        setSelectedTransfers(prev => 
                                            checked ? [...prev, transfer.uniqueId] : prev.filter(id => id !== transfer.uniqueId)
                                        );
                                    }}
                                    aria-label="Select row"
                                />
                            </TableCell>
                            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell>{format(transfer.transferredAt, "dd MMM yyyy, p")}</TableCell>
                            <TableCell>
                                <Link href={`/admin/leads/${transfer.leadId}`} className="hover:underline text-primary font-medium">
                                    {transfer.leadName}
                                </Link>
                                <div className="text-xs text-muted-foreground">{transfer.leadId}</div>
                            </TableCell>
                            <TableCell>₹{transfer.amount.toLocaleString()}</TableCell>
                            <TableCell className="font-mono text-xs">{transfer.transactionId || 'N/A'}</TableCell>
                            <TableCell>{transfer.transferredByUserName}</TableCell>
                            <TableCell className="text-right">
                                {renderActions(transfer)}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedTransfers.map((transfer) => (
                <Card key={transfer.uniqueId} data-state={selectedTransfers.includes(transfer.uniqueId) && 'selected'}>
                    <div className="p-4 flex gap-4 items-start">
                        <Checkbox
                            className="mt-1.5 flex-shrink-0"
                            checked={selectedTransfers.includes(transfer.uniqueId)}
                            onCheckedChange={(checked) => {
                                setSelectedTransfers(prev => 
                                    checked ? [...prev, transfer.uniqueId] : prev.filter(id => id !== transfer.uniqueId)
                                );
                            }}
                            aria-label="Select card"
                        />
                        <div className="flex-grow space-y-3">
                            <CardHeader className="p-0">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">
                                        ₹{transfer.amount.toLocaleString()}
                                    </CardTitle>
                                     <div className="-mt-2 -mr-2">
                                        {renderActions(transfer)}
                                    </div>
                                </div>
                                <CardDescription>
                                    To: <Link href={`/admin/leads/${transfer.leadId}`} className="hover:underline text-primary font-medium">{transfer.leadName}</Link>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(transfer.transferredAt, "dd MMM yyyy, p")}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">By</span><span>{transfer.transferredByUserName}</span></div>
                                <div className="flex justify-between items-center"><span className="text-muted-foreground">Txn ID</span><span className="font-mono text-xs">{transfer.transactionId || 'N/A'}</span></div>
                            </CardContent>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );

    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
                 <div className="text-sm text-muted-foreground">
                 {selectedTransfers.length > 0 ? (
                    `${selectedTransfers.length} of ${filteredTransfers.length} row(s) selected.`
                ) : (
                    `Showing ${paginatedTransfers.length} of ${filteredTransfers.length} transfers.`
                )}
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
                        <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={itemsPerPage} /></SelectTrigger>
                        <SelectContent side="top">
                        {[10, 25, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" /><span className="sr-only">Previous</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" /><span className="sr-only">Next</span>
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
                {selectedTransfers.length > 0 && (
                    <div className="flex items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                         <p className="text-sm font-medium">
                            {selectedTransfers.length} item(s) selected.
                        </p>
                        {isMobile && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (selectedTransfers.length === paginatedTransfers.length) {
                                        const pageIds = paginatedTransfers.map(d => d.uniqueId);
                                        setSelectedTransfers(prev => prev.filter(id => !pageIds.includes(id)));
                                    } else {
                                        const pageIds = paginatedTransfers.map(d => d.uniqueId);
                                        setSelectedTransfers(prev => [...new Set([...prev, ...pageIds])]);
                                    }
                                }}
                            >
                                <Check className="mr-2 h-4 w-4"/>
                                {selectedTransfers.length === paginatedTransfers.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        )}
                         <DeleteConfirmationDialog
                            itemType={`${selectedTransfers.length} transfer(s)`}
                            itemName="the selected items. This will also update the 'Help Given' amount on the corresponding leads."
                            onDelete={() => handleBulkDeleteTransfers(selectedTransfers)}
                            onSuccess={onBulkDeleteSuccess}
                        >
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected
                            </Button>
                        </DeleteConfirmationDialog>
                    </div>
                )}
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
                    Record New Transfer
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="text-primary">Transfer History</CardTitle>
                <CardDescription className="text-muted-foreground">
                    A complete log of all funds transferred to beneficiaries.
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
