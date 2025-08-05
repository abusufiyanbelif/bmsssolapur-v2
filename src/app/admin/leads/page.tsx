

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
import { getAllLeads, type Lead, type LeadStatus, type LeadVerificationStatus } from "@/services/lead-service";
import { getAllUsers, type User } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, ShieldCheck, ShieldAlert, ShieldX, FilterX, ChevronLeft, ChevronRight, Eye, Search, HeartHandshake, Baby, PersonStanding, Home } from "lucide-react";
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

type BeneficiaryTypeFilter = 'all' | 'Adult' | 'Kid' | 'Family' | 'Widow';
const beneficiaryTypeOptions: { value: BeneficiaryTypeFilter, label: string, icon?: React.ElementType }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'Adult', label: 'Adults', icon: PersonStanding },
    { value: 'Kid', label: 'Kids', icon: Baby },
    { value: 'Family', label: 'Families', icon: Home },
    { value: 'Widow', label: 'Widows', icon: HeartHandshake },
];


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


function LeadsPageContent() {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status');
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
    const [verificationInput, setVerificationInput] = useState<string>('all');
    const [beneficiaryTypeInput, setBeneficiaryTypeInput] = useState<BeneficiaryTypeFilter>(typeFromUrl as BeneficiaryTypeFilter || 'all');
    const [sortInput, setSortInput] = useState<SortOption>('date-desc');

    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: '',
        status: statusFromUrl || 'all',
        verification: 'all',
        beneficiaryType: typeFromUrl as BeneficiaryTypeFilter || 'all',
        sort: 'date-desc' as SortOption
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
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
            sort: sortInput
        });
    };
    
    const filteredLeads = useMemo(() => {
        let filtered = leads.filter(lead => {
            const beneficiary = usersById[lead.beneficiaryId];
            const nameMatch = appliedFilters.name === '' || lead.name.toLowerCase().includes(appliedFilters.name.toLowerCase());
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
             switch(appliedFilters.sort) {
                case 'date-desc': return b.dateCreated.toMillis() - a.dateCreated.toMillis();
                case 'date-asc': return a.dateCreated.toMillis() - b.dateCreated.toMillis();
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'amount-desc': return b.helpRequested - a.helpRequested;
                case 'amount-asc': return a.helpRequested - b.helpRequested;
                default: return 0;
            }
        });
    }, [leads, appliedFilters, usersById]);
    
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
        setSortInput('date-desc');
        setAppliedFilters({ name: '', status: 'all', verification: 'all', beneficiaryType: 'all', sort: 'date-desc' });
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
    
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
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Amount Req.</TableHead>
                    <TableHead>Amount Given</TableHead>
                    <TableHead>Amount Pending</TableHead>
                    <TableHead>Case Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Date Closed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedLeads.map((lead, index) => {
                    const verifConfig = verificationStatusConfig[lead.verifiedStatus];
                    const pendingAmount = lead.helpRequested - lead.helpGiven;
                    return (
                        <TableRow key={lead.id}>
                            <TableCell>
                                <div className="font-medium">{lead.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    Created: {format(lead.dateCreated.toDate(), "dd MMM yyyy")}
                                </div>
                            </TableCell>
                            <TableCell>₹{lead.helpRequested.toLocaleString()}</TableCell>
                            <TableCell className="font-semibold text-green-600">₹{lead.helpGiven.toLocaleString()}</TableCell>
                             <TableCell className="font-semibold text-destructive">₹{pendingAmount.toLocaleString()}</TableCell>
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
                            <TableCell>
                                {lead.closedAt ? format(lead.closedAt.toDate(), "dd MMM yyyy") : 'N/A'}
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
            {paginatedLeads.map((lead, index) => {
                 const verifConfig = verificationStatusConfig[lead.verifiedStatus];
                 const pendingAmount = lead.helpRequested - lead.helpGiven;
                return (
                    <Card key={lead.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">#{ (currentPage - 1) * itemsPerPage + index + 1 }: {lead.name}</CardTitle>
                                    <CardDescription>Created: {format(lead.dateCreated.toDate(), "dd MMM yyyy")}</CardDescription>
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
                                <span className="text-muted-foreground">Amount Given</span>
                                <span className="font-semibold text-green-600">₹{lead.helpGiven.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Pending</span>
                                <span className="font-semibold text-destructive">₹{pendingAmount.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Case Status</span>
                                <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
                                    {lead.status}
                                </Badge>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 xl:col-span-2">
                        <Label htmlFor="nameFilter">Beneficiary Name</Label>
                        <Input 
                            id="nameFilter" 
                            placeholder="Filter by name..."
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
                    <div className="space-y-2 xl:col-span-1">
                        <Label htmlFor="sortOption">Sort By</Label>
                        <Select value={sortInput} onValueChange={(v) => setSortInput(v as SortOption)}>
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
