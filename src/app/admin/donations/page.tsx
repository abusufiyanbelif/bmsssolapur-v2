

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
import { Button, buttonVariants } from "@/components/ui/button";
import { getAllDonations, type Donation, type DonationStatus, type DonationType, type DonationPurpose, type PaymentMethod } from "@/services/donation-service";
import { getAllUsers, type User } from "@/services/user-service";
import { getAllLeads, type Lead } from "@/services/lead-service";
import { getAllCampaigns, type Campaign } from "@/services/campaign-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, MoreHorizontal, FilterX, ArrowUpDown, ChevronLeft, ChevronRight, Edit, Trash2, Search, EyeOff, Upload, ScanEye, CheckCircle, Link2, Link2Off, ChevronDown, ChevronUp, Download, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleBulkDeleteDonations, handleUpdateDonationStatus, handleDeleteDonation } from "./actions";
import { UploadProofDialog } from "./upload-proof-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AllocateToLeadDialog } from './allocate-to-lead-dialog';
import { AllocateToCampaignDialog } from './allocate-to-campaign-dialog';
import { DonationReceiptDialog } from "@/components/donation-receipt-dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


const statusOptions: (DonationStatus | 'all')[] = ["all", "Pending verification", "Verified", "Partially Allocated", "Allocated", "Failed/Incomplete"];
const typeOptions: (DonationType | 'all')[] = ["all", "Zakat", "Sadaqah", "Fitr", "Lillah", "Kaffarah", "Interest", "Split", "Any"];
const purposeOptions: (DonationPurpose | 'all')[] = ["all", "Education", "Medical", "Deen", "Loan", "Relief Fund", "To Organization Use", "Loan Repayment", "Other"];

type SortableColumn = 'id' | 'donorName' | 'amount' | 'donationDate' | 'type' | 'status';
type SortDirection = 'asc' | 'desc';

const MIN_DONATION_THRESHOLD = 10;
const MAX_DONATION_THRESHOLD = 50000;


const statusColors: Record<DonationStatus, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Pending verification": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Verified": "bg-green-500/20 text-green-700 border-green-500/30",
    "Partially Allocated": "bg-orange-500/20 text-orange-700 border-orange-500/30",
    "Allocated": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Failed/Incomplete": "bg-red-500/20 text-red-700 border-red-500/30",
};

interface DonationsPageContentProps {
  initialDonations: Donation[];
  initialUsers: User[];
  initialLeads: Lead[];
  initialCampaigns: Campaign[];
  error?: string;
}

function DonationsPageContent({ initialDonations, initialUsers, initialLeads, initialCampaigns, error: initialError }: DonationsPageContentProps) {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status');
    const typeFromUrl = searchParams.get('type');

    const [donations, setDonations] = useState<Donation[]>(initialDonations);
    const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
    const [allLeads, setAllLeads] = useState<Lead[]>(initialLeads);
    const [allCampaigns, setAllCampaigns] = useState<Campaign[]>(initialCampaigns);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
    const [selectedDonations, setSelectedDonations] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [adminUserId, setAdminUserId] = useState<string | null>(null);
    
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
    const [sortColumn, setSortColumn] = useState<SortableColumn>('donationDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { toast } = useToast();
    const isMobile = useIsMobile();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [fetchedDonations, fetchedUsers, fetchedLeads, fetchedCampaigns] = await Promise.all([
                getAllDonations(),
                getAllUsers(),
                getAllLeads(),
                getAllCampaigns(),
            ]);

            if (fetchedDonations) setDonations(fetchedDonations);
            else setError("Failed to load donations.");
            
            if (fetchedUsers) setAllUsers(fetchedUsers);
            else setError(prev => prev ? `${prev} Failed to load users.` : "Failed to load users.");

            if (fetchedLeads) setAllLeads(fetchedLeads);
             else setError(prev => prev ? `${prev} Failed to load leads.` : "Failed to load leads.");

            if (fetchedCampaigns) setAllCampaigns(fetchedCampaigns);
             else setError(prev => prev ? `${prev} Failed to load campaigns.` : "Failed to load campaigns.");

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(`Failed to fetch data for Donations page: ${errorMessage}`);
            console.error(e);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const storedAdminId = localStorage.getItem('userId');
        setAdminUserId(storedAdminId);
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
    
    const handleDonationIdClick = (donationId: string) => {
        // Reset other filters in the UI
        setStatusInput('all');
        setTypeInput('all');
        setPurposeInput('all');
        // Set the name/ID filter
        setNameInput(donationId);
        // Apply the filters immediately
        setAppliedFilters({
            status: 'all',
            type: 'all',
            purpose: 'all',
            name: donationId
        });
        setCurrentPage(1);
    };


    const filteredDonations = useMemo(() => {
        if (!donations) return [];
        let filtered = donations.filter(donation => {
            const statusMatch = appliedFilters.status === 'all' || donation.status === appliedFilters.status;
            const typeMatch = appliedFilters.type === 'all' || donation.type === appliedFilters.type;
            const purposeMatch = appliedFilters.purpose === 'all' || donation.purpose === appliedFilters.purpose;
            const nameMatch = appliedFilters.name === '' || 
                              donation.donorName.toLowerCase().includes(appliedFilters.name.toLowerCase()) ||
                              donation.id?.toLowerCase().includes(appliedFilters.name.toLowerCase());
            return statusMatch && typeMatch && nameMatch && purposeMatch;
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
            } else if (String(aValue) > String(bValue)) {
                comparison = 1;
            } else if (String(aValue) < String(bValue)) {
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
    
    const onBulkDonationDeleted = () => {
        toast({
            title: "Donations Deleted",
            description: `${selectedDonations.length} donation(s) have been successfully removed.`,
        });
        setSelectedDonations([]);
        fetchData();
    }
    
    const onAllocationSuccess = () => {
        toast({ variant: 'success', title: "Donation Allocated", description: "The donation has been successfully linked." });
        fetchData();
    };

    const handleQuickStatusChange = async (donationId: string, newStatus: DonationStatus) => {
        const adminUserId = localStorage.getItem('userId');
        if (!adminUserId) {
            toast({ variant: 'destructive', title: "Error", description: "Could not identify administrator. Please log in again." });
            return;
        }

        const result = await handleUpdateDonationStatus(donationId, newStatus, adminUserId);
        if (result.success) {
            toast({
                title: "Status Updated",
                description: `Donation status changed to "${newStatus}".`,
                variant: 'success'
            });
            fetchData();
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to update status.",
                variant: 'destructive'
            });
        }
    }

    const renderSortIcon = (column: SortableColumn) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const toggleRow = (id: string) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const leadsById = useMemo(() => {
        if (!allLeads) return {};
        return allLeads.reduce((acc, lead) => {
            acc[lead.id] = lead;
            return acc;
        }, {} as Record<string, Lead>);
    }, [allLeads]);


    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead padding="checkbox">
                        <Checkbox
                            checked={paginatedDonations.length > 0 && selectedDonations.length === paginatedDonations.length}
                            onCheckedChange={(checked) => {
                                const currentPageIds = paginatedDonations.map(d => d.id!);
                                if (checked) {
                                    setSelectedDonations(prev => [...new Set([...prev, ...currentPageIds])]);
                                } else {
                                    setSelectedDonations(prev => prev.filter(id => !currentPageIds.includes(id)));
                                }
                            }}
                            aria-label="Select all on current page"
                        />
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('id')}>
                            Donation ID {renderSortIcon('id')}
                        </Button>
                    </TableHead>
                    <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('donationDate')}>
                           Date {renderSortIcon('donationDate')}
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
                    <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('type')}>
                           Type {renderSortIcon('type')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('status')}>
                           Status {renderSortIcon('status')}
                        </Button>
                    </TableHead>
                    <TableHead>Linked To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedDonations.map((donation, index) => {
                    const isExpanded = expandedRows.includes(donation.id!);
                    const hasAllocations = donation.allocations && donation.allocations.length > 0;
                    const allocatedAmount = hasAllocations ? donation.allocations!.reduce((sum, alloc) => sum + alloc.amount, 0) : 0;
                    const isAmountAnomaly = donation.amount < MIN_DONATION_THRESHOLD || donation.amount > MAX_DONATION_THRESHOLD;
                    
                    return (
                    <>
                    <TableRow key={donation.id} data-state={selectedDonations.includes(donation.id!) ? 'selected' : ''}>
                        <TableCell padding="checkbox">
                            <Checkbox
                                checked={selectedDonations.includes(donation.id!)}
                                onCheckedChange={(checked) => {
                                    setSelectedDonations(prev => 
                                        checked ? [...prev, donation.id!] : prev.filter(id => id !== donation.id!)
                                    );
                                }}
                                aria-label="Select row"
                            />
                        </TableCell>
                        <TableCell>
                            {hasAllocations && (
                                <Button variant="ghost" size="icon" onClick={() => toggleRow(donation.id!)} className="h-8 w-8">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            )}
                        </TableCell>
                        <TableCell>
                            <Link href={`/admin/donations/${encodeURIComponent(donation.id!)}/edit`} className="font-mono text-xs hover:underline text-primary">
                                {donation.id}
                            </Link>
                            <div className="text-xs text-muted-foreground">{donation.source || 'Manual Entry'}</div>
                        </TableCell>
                        <TableCell>{format(new Date(donation.donationDate), "dd MMM yyyy")}</TableCell>
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
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {donation.status === 'Partially Allocated' && hasAllocations ? (
                                    <div className="flex flex-col">
                                        <span className="font-semibold">₹{donation.amount.toFixed(2)}</span>
                                        <span className="text-xs text-muted-foreground">
                                            (Allocated: ₹{allocatedAmount.toFixed(2)})
                                        </span>
                                    </div>
                                ) : (
                                    `₹${donation.amount.toFixed(2)}`
                                )}
                                {isAmountAnomaly && (
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>This amount is unusually {donation.amount < MIN_DONATION_THRESHOLD ? 'low' : 'high'}. Please verify.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>{donation.type}</TableCell>
                        <TableCell>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="capitalize">
                                        <Badge variant="outline" className={cn("capitalize pointer-events-none", statusColors[donation.status])}>
                                            {donation.status}
                                        </Badge>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {statusOptions.filter(s => s !== 'all').map(status => (
                                         <DropdownMenuItem
                                            key={status}
                                            onSelect={() => handleQuickStatusChange(donation.id!, status)}
                                            disabled={donation.status === status}
                                        >
                                            {donation.status === status && <CheckCircle className="mr-2 h-4 w-4" />}
                                            {status}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                         <TableCell className="space-y-1">
                            {donation.allocations && donation.allocations.length > 0 ? (
                                <Badge variant="outline" className="text-xs">{donation.allocations.length} Allocation(s)</Badge>
                            ) : donation.campaignId ? (
                                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                                    Campaign: {donation.campaignName || donation.campaignId}
                                </Badge>
                            ) : (
                               <Badge variant="destructive" className="text-xs font-normal">Unallocated</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            {renderActions(donation)}
                        </TableCell>
                    </TableRow>
                     {isExpanded && hasAllocations && (
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={10} className="p-0">
                                <div className="p-4">
                                    <h4 className="font-semibold text-sm mb-2">Allocation Details</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Allocation ID</TableHead>
                                                <TableHead>Allocated To</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Allocated By</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {donation.allocations?.map((alloc, i) => {
                                                const lead = leadsById[alloc.leadId];
                                                const allocationId = `${donation.id}-${i + 1}`;
                                                return (
                                                <TableRow key={alloc.leadId + i}>
                                                     <TableCell>
                                                        <Link href={`/admin/donations/${encodeURIComponent(donation.id!)}/edit`} className="font-mono text-xs hover:underline text-primary">
                                                            {allocationId}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p>{lead?.name || 'N/A'}</p>
                                                        <p className="font-mono text-xs text-muted-foreground">{alloc.leadId}</p>
                                                    </TableCell>
                                                    <TableCell>₹{alloc.amount.toLocaleString()}</TableCell>
                                                     <TableCell>
                                                        <p>{alloc.allocatedByUserName}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-xs">{format(alloc.allocatedAt as Date, "dd MMM, p")}</p>
                                                    </TableCell>
                                                </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TableCell>
                        </TableRow>
                     )}
                     </>
                )})}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedDonations.map((donation, index) => {
                const hasAllocations = donation.allocations && donation.allocations.length > 0;
                const allocatedAmount = hasAllocations ? donation.allocations!.reduce((sum, alloc) => sum + alloc.amount, 0) : 0;
                const isAmountAnomaly = donation.amount < MIN_DONATION_THRESHOLD || donation.amount > MAX_DONATION_THRESHOLD;
                return (
                    <Card key={donation.id} className={cn("flex flex-col", selectedDonations.includes(donation.id!) && "ring-2 ring-primary")}>
                         <div className="p-4 flex gap-4">
                            <Checkbox
                                className="mt-1.5 flex-shrink-0"
                                checked={selectedDonations.includes(donation.id!)}
                                onCheckedChange={checked => {
                                    setSelectedDonations(prev => checked ? [...prev, donation.id!] : prev.filter(id => id !== donation.id!))
                                }}
                                aria-label="Select card"
                            />
                            <Link href={`/admin/donations/${encodeURIComponent(donation.id!)}/edit`} className="flex-grow space-y-3">
                                <CardHeader className="p-0">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">
                                            <div className="flex items-center gap-2">
                                                {donation.status === 'Partially Allocated' && hasAllocations ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <span>₹{donation.amount.toFixed(2)}</span>
                                                        <span className="text-sm text-muted-foreground font-normal">(Allocated: ₹{allocatedAmount.toFixed(2)})</span>
                                                    </div>
                                                ) : (
                                                    `₹${donation.amount.toFixed(2)}`
                                                )}
                                                {isAmountAnomaly && (
                                                    <TooltipProvider>
                                                        <Tooltip><TooltipTrigger><AlertTriangle className="h-4 w-4 text-amber-500" /></TooltipTrigger><TooltipContent><p>Amount anomaly</p></TooltipContent></Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </CardTitle>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="capitalize -mr-2 -mt-2">
                                                    <Badge variant="outline" className={cn("capitalize pointer-events-none", statusColors[donation.status])}>
                                                        {donation.status}
                                                    </Badge>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                {statusOptions.filter(s => s !== 'all').map(status => (
                                                    <DropdownMenuItem
                                                        key={status}
                                                        onSelect={() => handleQuickStatusChange(donation.id!, status)}
                                                        disabled={donation.status === status}
                                                    >
                                                        {status}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription>
                                        <div className="flex items-center gap-2">
                                            <span>{donation.donorName}</span>
                                            {donation.isAnonymous && <Badge variant="secondary" title="Anonymous"><EyeOff className="h-3 w-3" /></Badge>}
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 space-y-3 text-sm">
                                     <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{donation.id}</span></div>
                                     <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(donation.donationDate), "dd MMM yyyy")}</span></div>
                                     <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{donation.type}</span></div>
                                     <div>
                                        <span className="text-muted-foreground">Linked To: </span>
                                        {hasAllocations ? <Badge variant="outline">{donation.allocations!.length} Allocation(s)</Badge> : 
                                         donation.campaignId ? <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">Campaign</Badge>
                                        : <Badge variant="destructive" className="text-xs font-normal">Unallocated</Badge>}
                                     </div>
                                </CardContent>
                            </Link>
                            <div className="flex-shrink-0 -mr-2 -mt-2">
                                {renderActions(donation)}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );

    
    const renderActions = (donation: Donation) => {
        const canAllocate = donation.status === 'Verified' || donation.status === 'Partially Allocated';
        const donorUser = allUsers.find(u => u.id === donation.donorId);
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canAllocate && (
                        <>
                            <DropdownMenuLabel>Allocate Funds</DropdownMenuLabel>
                             <DropdownMenuItem asChild onSelect={e=>e.preventDefault()}>
                                <AllocateToLeadDialog donation={donation} allLeads={allLeads} allCampaigns={allCampaigns} onAllocation={onAllocationSuccess} />
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild onSelect={e=>e.preventDefault()}>
                               <AllocateToCampaignDialog donation={donation} allCampaigns={allCampaigns} onAllocation={onAllocationSuccess} />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    <DropdownMenuItem asChild>
                        <Link href={`/admin/donations/${encodeURIComponent(donation.id!)}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Donation
                        </Link>
                    </DropdownMenuItem>
                    
                    <UploadProofDialog donation={donation} onUploadSuccess={fetchData}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Proof
                        </DropdownMenuItem>
                    </UploadProofDialog>

                    {donorUser && (
                         <DonationReceiptDialog donation={donation} user={donorUser} />
                    )}
                    
                    <DropdownMenuSeparator />

                    <DeleteConfirmationDialog
                        itemType="donation"
                        itemName={`from ${donation.donorName} for ₹${donation.amount}`}
                        onDelete={() => handleDeleteDonation(donation.id!, adminUserId!)}
                        onSuccess={onDonationDeleted}
                    >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Donation
                        </DropdownMenuItem>
                    </DeleteConfirmationDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    
    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                {selectedDonations.length > 0 ? (
                    `${selectedDonations.length} of ${filteredDonations.length} row(s) selected.`
                ) : (
                    `Showing ${paginatedDonations.length} of ${filteredDonations.length} donations.`
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
                    <AlertTitle>Error Loading Donations Page</AlertTitle>
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
                {selectedDonations.length > 0 && (
                    <div className="flex items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">
                            {selectedDonations.length} item(s) selected.
                        </p>
                         {isMobile && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const pageIds = paginatedDonations.map(d => d.id!);
                                    const allSelectedOnPage = pageIds.every(id => selectedDonations.includes(id));

                                    if (allSelectedOnPage) {
                                        setSelectedDonations(prev => prev.filter(id => !pageIds.includes(id)));
                                    } else {
                                        setSelectedDonations(prev => [...new Set([...prev, ...pageIds])]);
                                    }
                                }}
                            >
                                <Check className="mr-2 h-4 w-4"/>
                                { paginatedDonations.every(d => selectedDonations.includes(d.id!)) ? 'Deselect All' : 'Select All on Page'}
                            </Button>
                        )}
                         <DeleteConfirmationDialog
                            itemType={`${selectedDonations.length} donation(s)`}
                            itemName="the selected items"
                            onDelete={() => handleBulkDeleteDonations(selectedDonations, adminUserId!)}
                            onSuccess={onBulkDonationDeleted}
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
        );
    }
    
    const donorUsers = allUsers.filter(u => u.roles.includes('Donor'));

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Donation Management</h2>
             <div className="flex gap-2">
                <Button asChild>
                    <Link href="/admin/donations/add">
                        <PlusCircle className="mr-2" />
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
                        <Label htmlFor="donorName">Search by Donor Name or Donation ID</Label>
                        <Input 
                            id="donorName" 
                            placeholder="Filter by donor or donation ID..."
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

function DonationsPageDataLoader() {
  const [data, setData] = useState<{
    donations: Donation[];
    users: User[];
    leads: Lead[];
    campaigns: Campaign[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [donations, users, leads, campaigns] = await Promise.all([
          getAllDonations(),
          getAllUsers(),
          getAllLeads(),
          getAllCampaigns()
        ]);
        setData({ donations, users, leads, campaigns });
      } catch (e) {
        setData({ donations: [], users: [], leads: [], campaigns: [], error: "Failed to load initial data." });
        console.error(e);
      }
    }
    loadData();
  }, []);

  if (!data) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return <DonationsPageContent initialDonations={data.donations} initialUsers={data.users} initialLeads={data.leads} initialCampaigns={data.campaigns} error={data.error} />;
}

export default function DonationsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <DonationsPageDataLoader />
        </Suspense>
    )
}
