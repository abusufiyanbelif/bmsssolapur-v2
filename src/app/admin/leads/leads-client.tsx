// src/app/admin/leads/leads-client.tsx
"use client";

import { useState, useEffect, useMemo, Suspense, Fragment } from "react";
import { useSearchParams, useRouter } from 'next/navigation'
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
import type { Lead, LeadStatus, LeadAction, LeadVerificationStatus, LeadPurpose, AppSettings, User } from "@/services/types";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, MoreHorizontal, FilterX, ArrowUpDown, ChevronLeft, ChevronRight, Edit, Trash2, Search, EyeOff, Upload, ScanSearch, CheckCircle, Link2, Link2Off, ChevronUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleBulkDeleteLeads, handleDeleteLead, handleBulkUpdateLeadStatus } from "./[id]/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


const statusOptions: (LeadStatus | 'all')[] = ["all", "Open", "Pending", "Complete", "On Hold", "Cancelled", "Closed", "Partial"];
const verificationOptions: (LeadVerificationStatus | 'all')[] = ["all", "Pending", "Verified", "Rejected", "More Info Required", "Duplicate"];
const actionOptions: (LeadAction | 'all')[] = ["all", "Pending", "Ready For Help", "Publish", "Partial", "Complete", "Closed", "On Hold", "Cancelled"];

type SortableColumn = 'name' | 'helpRequested' | 'createdAt' | 'status' | 'verification';
type SortDirection = 'asc' | 'desc';


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

interface LeadsPageClientProps {
  initialLeads: Lead[];
  initialUsers: User[];
  initialSettings: AppSettings | null;
  error?: string;
}

export function LeadsPageClient({ initialLeads, initialUsers, initialSettings, error: initialError }: LeadsPageClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const statusFromUrl = searchParams.get('status');
    const verificationFromUrl = searchParams.get('verification');
    const purposeFromUrl = searchParams.get('purpose');

    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [adminUserId, setAdminUserId] = useState<string | null>(null);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<string[]>([]);

    // Input states
    const [nameInput, setNameInput] = useState('');
    const [purposeInput, setPurposeInput] = useState<string>(purposeFromUrl || 'all');
    const [statusInput, setStatusInput] = useState<string>(statusFromUrl || 'all');
    const [verificationInput, setVerificationInput] = useState<string>(verificationFromUrl || 'all');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: '',
        purpose: purposeFromUrl || 'all',
        status: statusFromUrl || 'all',
        verification: verificationFromUrl || 'all',
    });

    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortableColumn>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
     const fetchData = async () => {
        router.refresh();
    };

    useEffect(() => {
        const storedAdminId = localStorage.getItem('userId');
        setAdminUserId(storedAdminId);
        setLoading(false);
    }, []);

    const onLeadDeleted = () => {
        toast({
            title: "Lead Deleted",
            description: "The lead has been successfully removed.",
        });
        fetchData();
    }
    
    const onBulkLeadsDeleted = () => {
        toast({
            title: "Leads Deleted",
            description: `${selectedLeads.length} lead(s) have been successfully removed.`,
        });
        setSelectedLeads([]);
        fetchData();
    }
    
    const handleBulkStatusUpdate = async (statusType: 'caseStatus' | 'verificationStatus', newStatus: LeadStatus | LeadVerificationStatus) => {
        if (selectedLeads.length === 0 || !adminUserId) return;
        const result = await handleBulkUpdateLeadStatus(selectedLeads, statusType, newStatus, adminUserId);
        if (result.success) {
            toast({ variant: 'success', title: "Bulk Update Successful", description: `Updated ${selectedLeads.length} lead(s).` });
            setSelectedLeads([]);
            fetchData();
        } else {
            toast({ variant: 'destructive', title: "Bulk Update Failed", description: result.error });
        }
    }
    
    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedFilters({
            name: nameInput,
            purpose: purposeInput,
            status: statusInput,
            verification: verificationInput,
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
            // Ensure lead has a name property before calling toLowerCase
            const nameMatch = appliedFilters.name === '' || (lead.name && lead.name.toLowerCase().includes(appliedFilters.name.toLowerCase()));
            const purposeMatch = appliedFilters.purpose === 'all' || lead.purpose === appliedFilters.purpose;
            const statusMatch = appliedFilters.status === 'all' || lead.caseStatus === appliedFilters.status;
            const verificationMatch = appliedFilters.verification === 'all' || lead.caseVerification === appliedFilters.verification;
            
            return nameMatch && purposeMatch && statusMatch && verificationMatch;
        });
    
        return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];
    
            let comparison = 0;
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
    }, [leads, appliedFilters, sortColumn, sortDirection]);
    
    
    const paginatedLeads = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLeads, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
    
    const resetFilters = () => {
        setNameInput('');
        setPurposeInput('all');
        setStatusInput('all');
        setVerificationInput('all');
        setAppliedFilters({ name: '', purpose: 'all', status: 'all', verification: 'all' });
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
    
    const renderSortIcon = (column: SortableColumn) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
    };
    
    const renderContent = () => {
        if (loading || !initialSettings) {
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
                    <AlertTitle>Error Loading Leads</AlertTitle>
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
        
        if (paginatedLeads.length === 0) {
             return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No leads match your current filters.</p>
                     <Button variant="outline" onClick={resetFilters} className="mt-4">
                        <FilterX className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </div>
            )
        }
    
        return <div>Table of leads...</div>
    }
    
    if(!initialSettings) {
        return (
             <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading configuration...</p>
             </div>
        )
    }

  const purposeOptions = initialSettings.leadConfiguration?.purposes.map(p => p.name) || [];

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Lead Management</h2>
             <div className="flex gap-2">
                 <Button asChild variant="secondary">
                    <Link href="/admin/leads/create-from-document">
                        <ScanSearch className="mr-2 h-4 w-4" />
                        Scan Document
                    </Link>
                </Button>
                <Button asChild>
                    <Link href="/admin/leads/add">
                        <PlusCircle className="mr-2" />
                        Add Lead
                    </Link>
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>
                    View and manage all help requests (leads).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="nameFilter">Search by Beneficiary Name</Label>
                        <Input id="nameFilter" placeholder="Filter by name..." value={nameInput} onChange={e => setNameInput(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="purposeFilter">Purpose</Label>
                        <Select value={purposeInput} onValueChange={setPurposeInput}>
                            <SelectTrigger id="purposeFilter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Purposes</SelectItem>
                                {purposeOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statusFilter">Status</Label>
                        <Select value={statusInput} onValueChange={setStatusInput}>
                            <SelectTrigger id="statusFilter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {actionOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="verificationFilter">Verification</Label>
                        <Select value={verificationInput} onValueChange={setVerificationInput}>
                            <SelectTrigger id="verificationFilter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {verificationOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-end gap-4 lg:col-span-full">
                        <Button onClick={handleSearch} className="w-full"><Search className="mr-2 h-4 w-4" />Apply Filters</Button>
                        <Button variant="outline" onClick={resetFilters} className="w-full"><FilterX className="mr-2 h-4 w-4" />Clear Filters</Button>
                    </div>
                </div>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  )
}
