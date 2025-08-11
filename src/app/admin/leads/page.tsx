// src/app/admin/leads/page.tsx
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
import { getAllLeads, type Lead, type LeadStatus, type LeadVerificationStatus, updateLeadStatus, updateLeadVerificationStatus } from "@/services/lead-service";
import { getAllUsers, getUser, type User } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, ShieldCheck, ShieldAlert, ShieldX, FilterX, ChevronLeft, ChevronRight, Eye, Search, HeartHandshake, Baby, PersonStanding, Home, ArrowUpDown, Ban, MoreHorizontal, Clock, CheckCircle, Package, Edit, UploadCloud, DownloadCloud, AlertTriangle, ChevronsUpDown, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { LeadPriority } from "@/services/types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";


const statusOptions: (LeadStatus | 'all')[] = ["all", "Pending", "Ready For Help", "Publish", "Partial", "Complete", "Closed", "On Hold", "Cancelled"];
const verificationOptions: (LeadVerificationStatus | 'all')[] = ["all", "Pending", "Verified", "Rejected", "More Info Required", "Duplicate", "Other"];

type BeneficiaryTypeFilter = 'all' | 'Adult' | 'Kid' | 'Family' | 'Widow';
const beneficiaryTypeOptions: { value: BeneficiaryTypeFilter, label: string, icon?: React.ElementType }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'Adult', label: 'Adults', icon: PersonStanding },
    { value: 'Kid', label: 'Kids', icon: Baby },
    { value: 'Family', label: 'Families', icon: Home },
    { value: 'Widow', label: 'Widows', icon: HeartHandshake },
];


type SortableColumn = 'id' | 'name' | 'helpRequested' | 'helpGiven' | 'dateCreated' | 'closedAt';
type SortDirection = 'asc' | 'desc';

const statusColors: Record<LeadStatus, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Ready For Help": "bg-cyan-500/20 text-cyan-700 border-cyan-500/30",
    "Publish": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Complete": "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
    "On Hold": "bg-orange-500/20 text-orange-700 border-orange-500/30",
    "Cancelled": "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

const statusIcons: Record<LeadStatus, React.ElementType> = {
    "Pending": Clock,
    "Ready For Help": Package,
    "Publish": Eye,
    "Partial": Clock,
    "Complete": CheckCircle,
    "Closed": CheckCircle,
    "On Hold": MoreHorizontal,
    "Cancelled": Ban,
};

const verificationStatusConfig: Record<LeadVerificationStatus, { color: string; icon: React.ElementType }> = {
    "Pending": { color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", icon: ShieldAlert },
    "Verified": { color: "bg-green-500/20 text-green-700 border-green-500/30", icon: ShieldCheck },
    "Rejected": { color: "bg-red-500/20 text-red-700 border-red-500/30", icon: ShieldX },
    "More Info Required": { color: "bg-blue-500/20 text-blue-700 border-blue-500/30", icon: MoreHorizontal },
    "Duplicate": { color: "bg-purple-500/20 text-purple-700 border-purple-500/30", icon: Ban },
    "Other": { color: "bg-gray-500/20 text-gray-700 border-gray-500/30", icon: MoreHorizontal },
};

const priorityConfig: Record<LeadPriority, { color: string; icon?: React.ElementType }> = {
    "Urgent": { color: "border-red-500 bg-red-500/10 text-red-700", icon: AlertTriangle },
    "High": { color: "border-orange-500 bg-orange-500/10 text-orange-700" },
    "Medium": { color: "border-blue-500 bg-blue-500/10 text-blue-700" },
    "Low": { color: "border-gray-500 bg-gray-500/10 text-gray-700" },
};


function LeadsPageContent() {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status');
    const verificationFromUrl = searchParams.get('verification');
    const typeFromUrl = searchParams.get('beneficiaryType');

    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    // Input states
    const [nameInput, setNameInput] = useState('');
    const [statusInput, setStatusInput] = useState<string>(statusFromUrl || 'all');
    const [verificationInput, setVerificationInput] = useState<string>(verificationFromUrl || 'all');
    const [beneficiaryTypeInput, setBeneficiaryTypeInput] = useState<BeneficiaryTypeFilter>(typeFromUrl as BeneficiaryTypeFilter || 'all');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: '',
        status: statusFromUrl || 'all',
        verification: verificationFromUrl || 'all',
        beneficiaryType: typeFromUrl as BeneficiaryTypeFilter || 'all',
    });

    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortableColumn>('dateCreated');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedLeads, fetchedUsers] = await Promise.all([
                getAllLeads(),
                getAllUsers()
            ]);
            setLeads(fetchedLeads);
            setUsers(fetchedUsers);
            setError(null);
        } catch (e) {
            setError("Failed to fetch data. Please try again later.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const usersById = useMemo(() => {
        return users.reduce((acc, user) => {
            if (user.id) {
                acc[user.id] = user;
            }
            return acc;
        }, {} as Record<string, User>);
    }, [users]);


    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedFilters({
            name: nameInput,
            status: statusInput,
            verification: verificationInput,
            beneficiaryType: beneficiaryTypeInput,
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

    const filteredLeads = useMemo(() => {
        let filtered = leads.filter(lead => {
            const beneficiary = usersById[lead.beneficiaryId];
            const nameMatch = appliedFilters.name === '' || 
                              lead.name.toLowerCase().includes(appliedFilters.name.toLowerCase()) ||
                              lead.id?.toLowerCase().includes(appliedFilters.name.toLowerCase());
            const statusMatch = appliedFilters.status === 'all' || lead.status === appliedFilters.status;
            const verificationMatch = appliedFilters.verification === 'all' || lead.verifiedStatus === appliedFilters.verification;
            
            let typeMatch = true;
            if (beneficiary && appliedFilters.beneficiaryType !== 'all') {
                if (appliedFilters.beneficiaryType === 'Widow') {
                    typeMatch = !!beneficiary.isWidow;
                } else {
                    typeMatch = beneficiary.beneficiaryType === appliedFilters.beneficiaryType;
                }
            }

            return nameMatch && statusMatch && verificationMatch && typeMatch;
        });

       return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            // Handle date/timestamp objects
            if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }
            
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [leads, appliedFilters, usersById, sortColumn, sortDirection]);
    
    const paginatedLeads = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLeads, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

    const resetFilters = () => {
        setNameInput('');
        setStatusInput('all');
        setVerificationInput('all');
        setBeneficiaryTypeInput('all');
        setAppliedFilters({ name: '', status: 'all', verification: 'all', beneficiaryType: 'all' });
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const renderSortIcon = (column: SortableColumn) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
    };
    
    const handleQuickStatusChange = async (leadId: string, type: 'case' | 'verification', newStatus: LeadStatus | LeadVerificationStatus) => {
        const adminId = localStorage.getItem('userId');
        if (!adminId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not identify administrator.' });
            return;
        }
        
        try {
            const adminUser = await getUser(adminId);
            if (!adminUser) {
                toast({ variant: 'destructive', title: 'Error', description: 'Admin user not found.' });
                return;
            }

            const adminDetails = { id: adminUser.id!, name: adminUser.name, email: adminUser.email };

            if (type === 'case') {
                await updateLeadStatus(leadId, newStatus as LeadStatus, adminDetails);
            } else {
                await updateLeadVerificationStatus(leadId, newStatus as LeadVerificationStatus, adminDetails);
            }
            toast({
                title: "Status Updated",
                description: `Lead status changed to "${newStatus}".`,
                variant: 'success'
            });
            fetchData(); // Refresh data
        } catch (e) {
            toast({
                title: "Error",
                description: "Failed to update lead status.",
                variant: 'destructive'
            });
        }
    };
    
    const renderActions = (lead: Lead) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 <DropdownMenuItem asChild>
                    <Link href={`/admin/leads/${lead.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href={`/admin/leads/${lead.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Lead
                    </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                {lead.verifiedStatus === 'Pending' && (
                    <>
                        <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'verification', 'Verified')}>
                            <ShieldCheck className="mr-2 h-4 w-4 text-green-600" /> Quick Verify
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'verification', 'Rejected')} className="text-destructive focus:text-destructive">
                            <ShieldX className="mr-2 h-4 w-4" /> Quick Reject
                        </DropdownMenuItem>
                    </>
                )}

                {lead.verifiedStatus === 'Verified' && lead.status === 'Ready For Help' && (
                    <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'case', 'Publish')}>
                        <UploadCloud className="mr-2 h-4 w-4 text-blue-600" /> Publish Lead
                    </DropdownMenuItem>
                )}
                
                {lead.status === 'Publish' && (
                    <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'case', 'Ready For Help')}>
                        <DownloadCloud className="mr-2 h-4 w-4 text-gray-600" /> Unpublish Lead
                    </DropdownMenuItem>
                )}

                {lead.status === 'Complete' && (
                    <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'case', 'Closed')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Quick Close Case
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('id')}>
                            Lead ID {renderSortIcon('id')}
                        </Button>
                    </TableHead>
                    <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('name')}>
                            Beneficiary {renderSortIcon('name')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('helpRequested')}>
                           Amount Req. {renderSortIcon('helpRequested')}
                        </Button>
                    </TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Case Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedLeads.map((lead, index) => {
                    const verifConfig = verificationStatusConfig[lead.verifiedStatus];
                    const StatusIcon = statusIcons[lead.status];
                    const priorityConf = priorityConfig[lead.priority || 'Medium'];
                    return (
                        <TableRow key={lead.id}>
                             <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                             <TableCell>
                                <div className="font-mono text-xs">{lead.id}</div>
                                <div className="text-xs text-muted-foreground">{format(lead.dateCreated, "dd MMM yyyy")}</div>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{lead.name}</div>
                            </TableCell>
                            <TableCell>₹{lead.helpRequested.toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", priorityConf.color)}>
                                    {priorityConf.icon && <priorityConf.icon className="mr-1 h-3 w-3" />}
                                    {lead.priority || 'Medium'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {lead.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", verifConfig.color)}>
                                    <verifConfig.icon className="mr-1 h-3 w-3" />
                                    {lead.verifiedStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {renderActions(lead)}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedLeads.map((lead, index) => {
                 const verifConfig = verificationStatusConfig[lead.verifiedStatus];
                 const StatusIcon = statusIcons[lead.status];
                 const priorityConf = priorityConfig[lead.priority || 'Medium'];
                 return (
                    <Card key={lead.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">#{ (currentPage - 1) * itemsPerPage + index + 1 }: {lead.name}</CardTitle>
                                    <CardDescription>Created: {format(lead.dateCreated, "dd MMM yyyy")}</CardDescription>
                                </div>
                                 <Badge variant="outline" className={cn("capitalize", verifConfig.color)}>
                                    <verifConfig.icon className="mr-1 h-3 w-3" />
                                    {lead.verifiedStatus}
                                 </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                           <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Requested</span>
                                <span className="font-semibold">₹{lead.helpRequested.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Priority</span>
                                <Badge variant="outline" className={cn("capitalize", priorityConf.color)}>
                                    {priorityConf.icon && <priorityConf.icon className="mr-1 h-3 w-3" />}
                                    {lead.priority || 'Medium'}
                                </Badge>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Case Status</span>
                                <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {lead.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Lead ID</span>
                                <span className="font-mono text-xs">{lead.id}</span>
                            </div>
                        </CardContent>
                         <CardFooter className="flex justify-end">
                            {renderActions(lead)}
                         </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
    
    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedLeads.length} of {filteredLeads.length} leads.
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
                    <p className="ml-2">Loading leads...</p>
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

        if (leads.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No leads found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/leads/add">
                           <PlusCircle className="mr-2" />
                           Add First Lead
                        </Link>
                    </Button>
                </div>
            )
        }
        
        if (filteredLeads.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No leads match your current filters.</p>
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
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Leads Management</h2>
            <Button asChild>
                <Link href="/admin/leads/add">
                    <PlusCircle className="mr-2" />
                    Add Lead
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>
                    View and manage all help cases and their status.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 xl:col-span-2">
                         <Label htmlFor="nameFilter">Search by Name or Lead ID</Label>
                         <Input
                            id="nameFilter"
                            placeholder="e.g., John Doe or USR01_1_..."
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                         />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="beneficiaryTypeFilter">Beneficiary Type</Label>
                        <Select value={beneficiaryTypeInput} onValueChange={(v) => setBeneficiaryTypeInput(v as BeneficiaryTypeFilter)}>
                            <SelectTrigger id="beneficiaryTypeFilter">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                {beneficiaryTypeOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <div className="flex items-center gap-2">
                                            {opt.icon && <opt.icon className="h-4 w-4" />}
                                            {opt.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statusFilter">Case Status</Label>
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
                        <Label htmlFor="verificationFilter">Verification</Label>
                        <Select value={verificationInput} onValueChange={setVerificationInput}>
                            <SelectTrigger id="verificationFilter">
                                <SelectValue placeholder="Filter by verification" />
                            </SelectTrigger>
                            <SelectContent>
                                {verificationOptions.map(v => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-end gap-4 xl:col-span-full">
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

export default function LeadsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LeadsPageContent />
        </Suspense>
    )
}
