
// src/app/admin/donations/page.tsx
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
import { getAllDonations, type Donation, type DonationStatus, type DonationType, type DonationPurpose } from "@/services/donation-service";
import { getAllUsers, type User } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, MoreHorizontal, FilterX, ArrowUpDown, ChevronLeft, ChevronRight, Edit, Trash2, Search, EyeOff, Upload, ScanEye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleDeleteDonation } from "./actions";
import { UploadProofDialog } from "./upload-proof-dialog";
import { CreateFromUploadDialog } from "./create-from-upload-dialog";


const statusOptions: (DonationStatus | 'all')[] = ["all", "Pending verification", "Verified", "Failed/Incomplete", "Allocated"];
const typeOptions: (DonationType | 'all')[] = ["all", "Zakat", "Sadaqah", "Fitr", "Lillah", "Kaffarah", "Split"];
const purposeOptions: (DonationPurpose | 'all')[] = ["all", "Education", "Deen", "Hospital", "Loan and Relief Fund", "To Organization Use", "Loan Repayment"];

type SortableColumn = 'donorName' | 'amount' | 'createdAt';
type SortDirection = 'asc' | 'desc';


const statusColors: Record<DonationStatus, string> = {
    "Pending verification": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Verified": "bg-green-500/20 text-green-700 border-green-500/30",
    "Failed/Incomplete": "bg-red-500/20 text-red-700 border-red-500/30",
    "Allocated": "bg-blue-500/20 text-blue-700 border-blue-500/30",
};

function DonationsPageContent() {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status');
    const typeFromUrl = searchParams.get('type');

    const [donations, setDonations] = useState<Donation[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Input states
    const [statusInput, setStatusInput] = useState<string>(statusFromUrl || 'all');
    const [typeInput, setTypeInput] = useState<string>(typeFromUrl || 'all');
    const [purposeInput, setPurposeInput] = useState<string>('all');
    const [nameInput, setNameInput] = useState<string>('');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        status: statusFromUrl || 'all',
        type: typeFromUrl || 'all',
        purpose: 'all',
        name: '',
    });

    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortableColumn>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { toast } = useToast();
    const isMobile = useIsMobile();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedDonations, fetchedUsers] = await Promise.all([
                getAllDonations(),
                getAllUsers()
            ]);
            setDonations(fetchedDonations);
            setAllUsers(fetchedUsers);
            setError(null);
        } catch (e) {
            setError("Failed to fetch donations. Please try again later.");
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
            status: statusInput,
            type: typeInput,
            purpose: purposeInput,
            name: nameInput,
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

    const filteredDonations = useMemo(() => {
        let filtered = donations.filter(donation => {
            const statusMatch = appliedFilters.status === 'all' || donation.status === appliedFilters.status;
            const typeMatch = appliedFilters.type === 'all' || donation.type === appliedFilters.type;
            const purposeMatch = appliedFilters.purpose === 'all' || donation.purpose === appliedFilters.purpose;
            const nameMatch = appliedFilters.name === '' || donation.donorName.toLowerCase().includes(appliedFilters.name.toLowerCase());
            return statusMatch && typeMatch && nameMatch && purposeMatch;
        });

        return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [donations, appliedFilters, sortColumn, sortDirection]);

    const paginatedDonations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDonations.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDonations, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const resetFilters = () => {
        setStatusInput('all');
        setTypeInput('all');
        setPurposeInput('all');
        setNameInput('');
        setAppliedFilters({ status: 'all', type: 'all', purpose: 'all', name: '' });
        setCurrentPage(1);
    };

    const onDonationDeleted = () => {
        toast({
            title: "Donation Deleted",
            description: "The donation record has been successfully removed.",
        });
        fetchData();
    }
    
    const onUploadSuccess = () => {
        fetchData();
    }

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
                         <Button variant="ghost" onClick={() => handleSort('createdAt')}>
                           Date {renderSortIcon('createdAt')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('donorName')}>
                           Donor {renderSortIcon('donorName')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('amount')}>
                            Amount {renderSortIcon('amount')}
                        </Button>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedDonations.map((donation, index) => (
                    <TableRow key={donation.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell>{format(donation.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <span>{donation.donorName}</span>
                                {donation.isAnonymous && (
                                    <Badge variant="secondary" title="This donation is marked as anonymous for public display">
                                        <EyeOff className="mr-1 h-3 w-3" />
                                        Anonymous
                                    </Badge>
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
            {paginatedDonations.map((donation, index) => (
                <Card key={donation.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg">#{ (currentPage - 1) * itemsPerPage + index + 1 }: ₹{donation.amount.toFixed(2)}</CardTitle>
                                <CardDescription>
                                    <div className="flex items-center gap-2">
                                        <span>{donation.donorName}</span>
                                        {donation.isAnonymous && (
                                            <Badge variant="secondary" title="This donation is marked as anonymous for public display">
                                                <EyeOff className="mr-1 h-3 w-3" />
                                                Anonymous
                                            </Badge>
                                        )}
                                    </div>
                                </CardDescription>
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
                    </CardContent>
                    <CardFooter className="flex justify-end">
                       {renderActions(donation)}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
    
    const renderActions = (donation: Donation) => {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/donations/${donation.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </DropdownMenuItem>
                    
                    <UploadProofDialog donation={donation} onUploadSuccess={onUploadSuccess}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Proof
                        </DropdownMenuItem>
                    </UploadProofDialog>
                    
                    <DropdownMenuSeparator />

                    <DeleteConfirmationDialog
                        itemType="donation"
                        itemName={`from ${donation.donorName} for ₹${donation.amount}`}
                        onDelete={() => handleDeleteDonation(donation.id!)}
                        onSuccess={onDonationDeleted}
                    >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DeleteConfirmationDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        );
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
    
    const donorUsers = allUsers.filter(u => u.roles.includes('Donor'));

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Donation Management</h2>
             <div className="flex gap-2">
                <CreateFromUploadDialog>
                    <Button variant="outline">
                        <ScanEye className="mr-2 h-4 w-4" />
                        Scan Screenshot
                    </Button>
                </CreateFromUploadDialog>
                <Button asChild>
                    <Link href="/admin/donations/add">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Manually
                    </Link>
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Donations</CardTitle>
                <CardDescription>
                    View and manage all received donations. Use the filters below to narrow your search.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="donorName">Donor Name</Label>
                        <Input 
                            id="donorName" 
                            placeholder="Filter by donor name..."
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statusFilter">Status</Label>
                        <Select value={statusInput} onValueChange={setStatusInput}>
                            <SelectTrigger id="statusFilter">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="typeFilter">Category</Label>
                        <Select value={typeInput} onValueChange={setTypeInput}>
                            <SelectTrigger id="typeFilter">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                {typeOptions.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="purposeFilter">Purpose</Label>
                        <Select value={purposeInput} onValueChange={setPurposeInput}>
                            <SelectTrigger id="purposeFilter">
                                <SelectValue placeholder="Filter by purpose" />
                            </SelectTrigger>
                            <SelectContent>
                                {purposeOptions.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end gap-4 lg:col-span-full">
                        <Button onClick={handleSearch} className="w-full">
                            <Search className="mr-2 h-4 w-4" />
                            Apply Filters
                        </Button>
                         <Button variant="outline" onClick={resetFilters} className="w-full">
                            <FilterX className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                </div>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  )
}

export default function DonationsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DonationsPageContent />
        </Suspense>
    )
}
