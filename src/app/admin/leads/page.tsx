
// src/app/admin/leads/page.tsx
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
import { getAllLeads, type Lead, type LeadStatus, type LeadVerificationStatus } from "@/services/lead-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, ShieldCheck, ShieldAlert, ShieldX, FilterX, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const statusOptions: (LeadStatus | 'all')[] = ["all", "Pending", "Partial", "Closed"];
const verificationOptions: (LeadVerificationStatus | 'all')[] = ["all", "Pending", "Verified", "Rejected"];

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'amount-desc' | 'amount-asc';
const sortOptions: { value: SortOption, label: string }[] = [
    { value: 'date-desc', label: 'Date Created (Newest First)' },
    { value: 'date-asc', label: 'Date Created (Oldest First)' },
    { value: 'name-asc', label: 'Beneficiary Name (A-Z)' },
    { value: 'name-desc', label: 'Beneficiary Name (Z-A)' },
    { value: 'amount-desc', label: 'Amount Requested (High-Low)' },
    { value: 'amount-asc', label: 'Amount Requested (Low-High)' },
];

const statusColors: Record<LeadStatus, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
};

const verificationStatusConfig: Record<LeadVerificationStatus, { color: string; icon: React.ElementType }> = {
    "Pending": { color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", icon: ShieldAlert },
    "Verified": { color: "bg-green-500/20 text-green-700 border-green-500/30", icon: ShieldCheck },
    "Rejected": { color: "bg-red-500/20 text-red-700 border-red-500/30", icon: ShieldX },
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    // Filter and Sort states
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [verificationFilter, setVerificationFilter] = useState<string>('all');
    const [sort, setSort] = useState<SortOption>('date-desc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [leadsPerPage, setLeadsPerPage] = useState(10);

    const handleFeatureInProgress = () => {
        toast({
            title: "In Progress",
            description: "This feature is currently in development and will be available soon.",
        });
    };

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                setLoading(true);
                const fetchedLeads = await getAllLeads();
                setLeads(fetchedLeads);
                setError(null);
            } catch (e) {
                setError("Failed to fetch leads. Please try again later.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, []);

    const filteredLeads = useMemo(() => {
        let filtered = leads.filter(lead => {
            const nameMatch = nameFilter === '' || lead.name.toLowerCase().includes(nameFilter.toLowerCase());
            const statusMatch = statusFilter === 'all' || lead.status === statusFilter;
            const verificationMatch = verificationFilter === 'all' || lead.verifiedStatus === verificationFilter;
            return nameMatch && statusMatch && verificationMatch;
        });

        return filtered.sort((a, b) => {
             switch(sort) {
                case 'date-desc': return b.dateCreated.toMillis() - a.dateCreated.toMillis();
                case 'date-asc': return a.dateCreated.toMillis() - b.dateCreated.toMillis();
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'amount-desc': return b.helpRequested - a.helpRequested;
                case 'amount-asc': return a.helpRequested - b.helpRequested;
                default: return 0;
            }
        });
    }, [leads, nameFilter, statusFilter, verificationFilter, sort]);
    
    const paginatedLeads = useMemo(() => {
        const startIndex = (currentPage - 1) * leadsPerPage;
        return filteredLeads.slice(startIndex, startIndex + leadsPerPage);
    }, [filteredLeads, currentPage, leadsPerPage]);

    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

    const resetFilters = () => {
        setNameFilter('');
        setStatusFilter('all');
        setVerificationFilter('all');
        setSort('date-desc');
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [nameFilter, statusFilter, verificationFilter, leadsPerPage]);
    
    const renderActionButton = (lead: Lead) => (
        <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/leads/${lead.id}`}>
                <Eye className="mr-2 h-3 w-3" /> View
            </Link>
        </Button>
    );

    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount Requested</TableHead>
                    <TableHead>Amount Given</TableHead>
                    <TableHead>Case Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedLeads.map((lead) => {
                    const verifConfig = verificationStatusConfig[lead.verifiedStatus];
                    return (
                        <TableRow key={lead.id}>
                            <TableCell>{format(lead.dateCreated.toDate(), "dd MMM yyyy")}</TableCell>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell>{lead.purpose || lead.category}</TableCell>
                            <TableCell>₹{lead.helpRequested.toFixed(2)}</TableCell>
                            <TableCell>₹{lead.helpGiven.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
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
                                {renderActionButton(lead)}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedLeads.map((lead) => {
                 const verifConfig = verificationStatusConfig[lead.verifiedStatus];
                return (
                    <Card key={lead.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                                    <CardDescription>For: {lead.purpose || lead.category}</CardDescription>
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
                                <span>₹{lead.helpRequested.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Given</span>
                                <span>₹{lead.helpGiven.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Case Status</span>
                                <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
                                    {lead.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date Created</span>
                                <span>{format(lead.dateCreated.toDate(), "dd MMM yyyy")}</span>
                            </div>
                        </CardContent>
                         <CardFooter className="flex justify-end">
                            {renderActionButton(lead)}
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
                        value={`${leadsPerPage}`}
                        onValueChange={(value) => {
                            setLeadsPerPage(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={leadsPerPage} />
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
                    <PlusCircle className="mr-2 h-4 w-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="nameFilter">Beneficiary Name</Label>
                        <Input 
                            id="nameFilter" 
                            placeholder="Filter by name..."
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statusFilter">Case Status</Label>
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
                        <Label htmlFor="verificationFilter">Verification</Label>
                        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                            <SelectTrigger id="verificationFilter">
                                <SelectValue placeholder="Filter by verification" />
                            </SelectTrigger>
                            <SelectContent>
                                {verificationOptions.map(v => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}
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

    