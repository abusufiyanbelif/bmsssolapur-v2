// src/app/admin/donations/page.tsx
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
import { getAllDonations, type Donation, type DonationStatus, type DonationType } from "@/services/donation-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, MoreHorizontal, FilterX, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const statusOptions: (DonationStatus | 'all')[] = ["all", "Pending verification", "Verified", "Failed/Incomplete", "Allocated"];
const typeOptions: (DonationType | 'all')[] = ["all", "Zakat", "Sadaqah", "Fitr", "Lillah", "Kaffarah", "Split"];

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'amount-desc' | 'amount-asc';
const sortOptions: { value: SortOption, label: string }[] = [
    { value: 'date-desc', label: 'Date (Newest First)' },
    { value: 'date-asc', label: 'Date (Oldest First)' },
    { value: 'name-asc', label: 'Donor Name (A-Z)' },
    { value: 'name-desc', label: 'Donor Name (Z-A)' },
    { value: 'amount-desc', label: 'Amount (High to Low)' },
    { value: 'amount-asc', label: 'Amount (Low to High)' },
];

const statusColors: Record<DonationStatus, string> = {
    "Pending verification": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Verified": "bg-green-500/20 text-green-700 border-green-500/30",
    "Failed/Incomplete": "bg-red-500/20 text-red-700 border-red-500/30",
    "Allocated": "bg-blue-500/20 text-blue-700 border-blue-500/30",
};

export default function DonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filter and Sort states
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [nameFilter, setNameFilter] = useState<string>('');
    const [sort, setSort] = useState<SortOption>('date-desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { toast } = useToast();
    const isMobile = useIsMobile();

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                setLoading(true);
                const fetchedDonations = await getAllDonations();
                setDonations(fetchedDonations);
                setError(null);
            } catch (e) {
                setError("Failed to fetch donations. Please try again later.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, []);

    const filteredDonations = useMemo(() => {
        let filtered = donations.filter(donation => {
            const statusMatch = statusFilter === 'all' || donation.status === statusFilter;
            const typeMatch = typeFilter === 'all' || donation.type === typeFilter;
            const nameMatch = nameFilter === '' || donation.donorName.toLowerCase().includes(nameFilter.toLowerCase());
            return statusMatch && typeMatch && nameMatch;
        });

        return filtered.sort((a, b) => {
            switch(sort) {
                case 'date-desc': return b.createdAt.toMillis() - a.createdAt.toMillis();
                case 'date-asc': return a.createdAt.toMillis() - b.createdAt.toMillis();
                case 'name-asc': return a.donorName.localeCompare(b.donorName);
                case 'name-desc': return b.donorName.localeCompare(a.donorName);
                case 'amount-desc': return b.amount - a.amount;
                case 'amount-asc': return a.amount - b.amount;
                default: return 0;
            }
        });

    }, [donations, statusFilter, typeFilter, nameFilter, sort]);

    const paginatedDonations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDonations.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDonations, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, typeFilter, nameFilter, itemsPerPage]);


    const handleFeatureInProgress = () => {
        toast({
            title: "In Progress",
            description: "This feature is currently in development and will be available soon.",
        });
    };

    const resetFilters = () => {
        setStatusFilter('all');
        setTypeFilter('all');
        setNameFilter('');
        setSort('date-desc');
        setCurrentPage(1);
    };

    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedDonations.map((donation) => (
                    <TableRow key={donation.id}>
                        <TableCell>{format(donation.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <span>{donation.donorName}</span>
                                {donation.isAnonymous && (
                                    <Badge variant="secondary">Anonymous</Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>₹{donation.amount.toFixed(2)}</TableCell>
                        <TableCell>{donation.type}</TableCell>
                        <TableCell>{donation.purpose || 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("capitalize", statusColors[donation.status])}>
                                {donation.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {renderActions(donation)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedDonations.map(donation => (
                <Card key={donation.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg">₹{donation.amount.toFixed(2)}</CardTitle>
                                <CardDescription>{donation.donorName}</CardDescription>
                            </div>
                             <Badge variant="outline" className={cn("capitalize", statusColors[donation.status])}>
                                {donation.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span>{format(donation.createdAt.toDate(), "dd MMM yyyy")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Category</span>
                            <span>{donation.type}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Purpose</span>
                            <span>{donation.purpose || 'N/A'}</span>
                        </div>
                        {donation.isAnonymous && <Badge variant="secondary">Anonymous</Badge>}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                       {renderActions(donation)}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
    
    const renderActions = (donation: Donation) => {
        if (donation.status === "Pending verification") {
            return <Button variant="outline" size="sm" onClick={handleFeatureInProgress}>Verify</Button>;
        }
        if (donation.status === "Verified") {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleFeatureInProgress}>Allocate to Lead</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleFeatureInProgress}>Split Donation</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
        return null;
    }
    
    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedDonations.length} of {filteredDonations.length} donations.
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
                    <p className="ml-2">Loading donations...</p>
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

        if (donations.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No donations found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/donations/add">
                           <PlusCircle className="mr-2" />
                           Add First Donation
                        </Link>
                    </Button>
                </div>
            )
        }
        
        if (filteredDonations.length === 0) {
             return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No donations match your current filters.</p>
                     <Button variant="outline" onClick={resetFilters} className="mt-4">
                        <FilterX className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </div>
            )
        }

        return (
            <>
                {isMobile ? renderMobileCards() : renderDesktopTable()}
                {totalPages > 1 && renderPaginationControls()}
            </>
        );
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Donation Management</h2>
            <Button asChild>
                <Link href="/admin/donations/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Donation
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Donations</CardTitle>
                <CardDescription>
                    View and manage all received donations. Use the filters below to narrow your search.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="donorName">Donor Name</Label>
                        <Input 
                            id="donorName" 
                            placeholder="Filter by donor name..."
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statusFilter">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger id="statusFilter">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="typeFilter">Donation Type</Label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger id="typeFilter">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                {typeOptions.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="outline" onClick={resetFilters} className="w-full">
                            <FilterX className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="sortOption">Sort By</Label>
                        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                            <SelectTrigger id="sortOption" className="w-full">
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  )
}
