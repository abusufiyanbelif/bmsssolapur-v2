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
import { Button, buttonVariants } from "@/components/ui/button";
import { getAllLeads, type Lead, updateLeadStatus, updateLeadVerificationStatus } from "@/services/lead-service";
import { getAllUsers, getUser, type User } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, ShieldCheck, ShieldAlert, ShieldX, FilterX, ChevronLeft, ChevronRight, Eye, Search, HeartHandshake, Baby, PersonStanding, Home, ArrowUpDown, Ban, MoreHorizontal, Clock, CheckCircle, Package, Edit, UploadCloud, DownloadCloud, AlertTriangle, ChevronsUpDown, Check, Trash2, Share2, Clipboard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import type { LeadPriority, LeadPurpose, LeadVerificationStatus, LeadStatus, LeadAction } from "@/services/types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleBulkUpdateLeadStatus, handleBulkDeleteLeads } from "./[id]/actions";
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";


const statusOptions: (LeadStatus | 'all')[] = ["all", "Open", "Pending", "Complete", "On Hold", "Cancelled", "Closed", "Partial"];
const verificationOptions: (LeadVerificationStatus | 'all')[] = ["all", "Pending", "Verified", "Rejected", "More Info Required", "Duplicate", "Other"];
const allLeadPurposes: (LeadPurpose | 'all')[] = ['all', 'Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'Other'];
const categoryOptions: Record<string, string[]> = {
    'Education': ['School Fees', 'College Fees', 'Tuition Fees', 'Exam Fees', 'Hostel Fees', 'Books & Uniforms', 'Educational Materials', 'Other'],
    'Medical': ['Hospital Bill', 'Medication', 'Doctor Consultation', 'Surgical Procedure', 'Medical Tests', 'Medical Equipment', 'Other'],
    'Relief Fund': ['Ration Kit', 'Financial Aid', 'Disaster Relief', 'Shelter Assistance', 'Utility Bill Payment', 'Other'],
    'Deen': ['Masjid Maintenance', 'Madrasa Support', 'Da\'wah Activities', 'Other'],
    'Loan': ['Business Loan', 'Emergency Loan', 'Education Loan', 'Personal Loan', 'Other'],
};


type BeneficiaryTypeFilter = 'all' | 'Adult' | 'Kid' | 'Family' | 'Widow';
const beneficiaryTypeOptions: { value: BeneficiaryTypeFilter, label: string, icon?: React.ElementType }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'Adult', label: 'Adults', icon: PersonStanding },
    { value: 'Kid', label: 'Kids', icon: Baby },
    { value: 'Family', label: 'Families', icon: Home },
    { value: 'Widow', label: 'Widows', icon: HeartHandshake },
];


type SortableColumn = 'id' | 'name' | 'helpRequested' | 'helpGiven' | 'dateCreated' | 'closedAt' | 'verifiedAt' | 'lastAllocatedAt';
type SortDirection = 'asc' | 'desc';

const statusColors: Record<LeadStatus, string> = {
    "Open": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Complete": "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
    "On Hold": "bg-orange-500/20 text-orange-700 border-orange-500/30",
    "Cancelled": "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

const statusIcons: Record<LeadStatus, React.ElementType> = {
    "Open": Eye,
    "Pending": Clock,
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

const defaultVerificationConfig = { color: "bg-gray-500/20 text-gray-700 border-gray-500/30", icon: MoreHorizontal };


const priorityConfig: Record<LeadPriority, { color: string; icon?: React.ElementType }> = {
    "Urgent": { color: "border-red-500 bg-red-500/10 text-red-700", icon: AlertTriangle },
    "High": { color: "border-orange-500 bg-orange-500/10 text-orange-700" },
    "Medium": { color: "border-blue-500 bg-blue-500/10 text-blue-700" },
    "Low": { color: "border-gray-500 bg-gray-500/10 text-gray-700" },
};

interface EnrichedLead extends Lead {
    verifiedAt?: Date;
    lastAllocatedAt?: Date;
}


function LeadsPageContent() {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status');
    const verificationFromUrl = searchParams.get('verification');
    const typeFromUrl = searchParams.get('beneficiaryType');
    const purposeFromUrl = searchParams.get('purpose');

    const [leads, setLeads] = useState<EnrichedLead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [adminUserId, setAdminUserId] = useState<string | null>(null);

    // Input states
    const [nameInput, setNameInput] = useState('');
    const [statusInput, setStatusInput] = useState<string>(statusFromUrl || 'all');
    const [verificationInput, setVerificationInput] = useState<string>(verificationFromUrl || 'all');
    const [beneficiaryTypeInput, setBeneficiaryTypeInput] = useState<BeneficiaryTypeFilter>(typeFromUrl as BeneficiaryTypeFilter || 'all');
    const [purposeInput, setPurposeInput] = useState<string>(purposeFromUrl || 'all');
    const [categoryInput, setCategoryInput] = useState<string>('all');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: '',
        status: statusFromUrl || 'all',
        verification: verificationFromUrl || 'all',
        beneficiaryType: typeFromUrl as BeneficiaryTypeFilter || 'all',
        purpose: purposeFromUrl || 'all',
        category: 'all',
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
        const storedAdminId = localStorage.getItem('userId');
        setAdminUserId(storedAdminId);
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
            purpose: purposeInput,
            category: categoryInput,
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
            const statusMatch = appliedFilters.status === 'all' || lead.caseStatus === appliedFilters.status;
            const verificationMatch = appliedFilters.verification === 'all' || lead.caseVerification === appliedFilters.verification;
            const purposeMatch = appliedFilters.purpose === 'all' || lead.purpose === appliedFilters.purpose;
            const categoryMatch = appliedFilters.category === 'all' || lead.category === appliedFilters.category;

            
            let typeMatch = true;
            if (beneficiary && appliedFilters.beneficiaryType !== 'all') {
                if (appliedFilters.beneficiaryType === 'Widow') {
                    typeMatch = !!beneficiary.isWidow;
                } else {
                    typeMatch = beneficiary.beneficiaryType === appliedFilters.beneficiaryType;
                }
            }

            return nameMatch && statusMatch && verificationMatch && typeMatch && purposeMatch && categoryMatch;
        });

       return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
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
        setPurposeInput('all');
        setCategoryInput('all');
        setAppliedFilters({ name: '', status: 'all', verification: 'all', beneficiaryType: 'all', purpose: 'all', category: 'all' });
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
    
    const onBulkActionSuccess = () => {
        toast({
            title: "Success",
            description: "The selected leads have been updated.",
            variant: 'success',
        });
        setSelectedLeads([]);
        fetchData();
    }
    
    const handleBulkStatusUpdate = async (type: 'caseStatus' | 'verificationStatus', newStatus: LeadStatus | LeadVerificationStatus) => {
        if (selectedLeads.length === 0 || !adminUserId) return;
        const result = await handleBulkUpdateLeadStatus(selectedLeads, type, newStatus, adminUserId);
        if (result.success) {
            onBulkActionSuccess();
        } else {
            toast({ variant: 'destructive', title: "Update Failed", description: result.error });
        }
    }


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
    
    const handleShare = async (lead: Lead) => {
        const leadUrl = `${window.location.origin}/public-leads#${lead.id}`;
        let message = `*Help Needed for ${lead.name}*\n\nThis individual requires assistance for *${lead.purpose} (${lead.category})*.\n\n*Amount Required:* ₹${lead.helpRequested.toLocaleString()}\n\nYour contribution can make a significant difference. Please donate and share this message.\n\nView more details here:\n${leadUrl}`;
        
        try {
            const quotes = await getInspirationalQuotes(1);
            if (quotes.length > 0) {
                const quoteText = `_"${quotes[0].text}"_\n- ${quotes[0].source}\n\n`;
                message = quoteText + message;
            }
        } catch (e) {
            console.error("Could not fetch quote for share message", e);
        }

        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const handleCopyTemplate = () => {
        const template = `
--- LEAD DETAILS ---
Headline: 
Purpose: (Education, Medical, Relief Fund, Deen, Loan, Other)
Category: (e.g., School Fees, Hospital Bill, Ration Kit)
Amount Requested: 
Due Date: (DD-MM-YYYY)
Acceptable Donation Types: (Zakat, Sadaqah, Fitr, Lillah, Kaffarah)
Case Details: (The detailed story or reason for the request)

--- BENEFICIARY DETAILS ---
Full Name: 
Father's Name:
Beneficiary Type: (e.g., Adult, Family, Kid, Widow)
Phone: 
Email:
Address:
Occupation:
Aadhaar Number:
PAN Number:
Bank Account Name:
Bank Account Number:
Bank IFSC Code:
UPI IDs: (Comma-separated, e.g., user@upi, 9876543210@ybl)

--- REFERRAL DETAILS (IF ANY) ---
Referral Name: 
Referral Phone: 
`.trim();
        navigator.clipboard.writeText(template);
        toast({
            title: "Template Copied!",
            description: "The lead details template has been copied to your clipboard.",
        });
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
                 <DropdownMenuItem onClick={() => handleShare(lead)}>
                    <Share2 className="mr-2 h-4 w-4" /> Share on WhatsApp
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                {lead.caseVerification === 'Pending' && (
                    <>
                        <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'verification', 'Verified')}>
                            <ShieldCheck className="mr-2 h-4 w-4 text-green-600" /> Quick Verify
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'verification', 'Rejected')} className="text-destructive focus:text-destructive">
                            <ShieldX className="mr-2 h-4 w-4" /> Quick Reject
                        </DropdownMenuItem>
                    </>
                )}

                {lead.caseVerification === 'Verified' && lead.caseAction === 'Ready For Help' && (
                    <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'case', 'Publish')}>
                        <UploadCloud className="mr-2 h-4 w-4 text-blue-600" /> Publish Lead
                    </DropdownMenuItem>
                )}
                
                {lead.caseAction === 'Publish' && (
                    <DropdownMenuItem onSelect={() => handleQuickStatusChange(lead.id!, 'case', 'Ready For Help')}>
                        <DownloadCloud className="mr-2 h-4 w-4 text-gray-600" /> Unpublish Lead
                    </DropdownMenuItem>
                )}
                
                {lead.caseStatus === 'Complete' && (
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
                    <TableHead padding="checkbox">
                        <Checkbox
                            checked={paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length}
                            onCheckedChange={(checked) => {
                                const pageLeadIds = paginatedLeads.map(l => l.id!);
                                if (checked) {
                                     setSelectedLeads(prev => [...new Set([...prev, ...pageLeadIds])]);
                                } else {
                                    setSelectedLeads(prev => prev.filter(id => !pageLeadIds.includes(id)));
                                }
                            }}
                            aria-label="Select all on current page"
                        />
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('name')}>
                            Beneficiary {renderSortIcon('name')}
                        </Button>
                    </TableHead>
                    <TableHead>Case Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('helpRequested')}>
                           Amount Req. {renderSortIcon('helpRequested')}
                        </Button>
                    </TableHead>
                    <TableHead>Summary</TableHead>
                     <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('dateCreated')}>
                            Created {renderSortIcon('dateCreated')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('verifiedAt')}>
                            Verified {renderSortIcon('verifiedAt')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('lastAllocatedAt')}>
                            Last Allocated {renderSortIcon('lastAllocatedAt')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('closedAt')}>
                            Closed {renderSortIcon('closedAt')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedLeads.map((lead) => {
                    const verifConfig = verificationStatusConfig[lead.caseVerification] || defaultVerificationConfig;
                    const StatusIcon = statusIcons[lead.caseStatus];
                    return (
                        <TableRow key={lead.id} data-state={selectedLeads.includes(lead.id!) ? 'selected' : ''}>
                             <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectedLeads.includes(lead.id!)}
                                    onCheckedChange={(checked) => {
                                        setSelectedLeads(prev => 
                                            checked ? [...prev, lead.id!] : prev.filter(id => id !== lead.id!)
                                        );
                                    }}
                                    aria-label="Select row"
                                />
                            </TableCell>
                            <TableCell>
                                <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline text-primary">{lead.name}</Link>
                                 <div className="font-mono text-xs text-muted-foreground">{lead.id}</div>
                            </TableCell>
                            <TableCell>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="capitalize h-auto p-1">
                                            <Badge variant="outline" className={cn("capitalize pointer-events-none", statusColors[lead.caseStatus])}>
                                                {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                                                {lead.caseStatus}
                                            </Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Change Case Status</DropdownMenuLabel>
                                        {statusOptions.filter(s => s !== 'all').map(s => (
                                            <DropdownMenuItem key={s} onSelect={() => handleQuickStatusChange(lead.id!, 'case', s)} disabled={lead.caseStatus === s}>
                                                {lead.caseStatus === s && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                                                {s}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                            </TableCell>
                            <TableCell>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="capitalize h-auto p-1">
                                            <Badge variant="outline" className={cn("capitalize pointer-events-none", verifConfig.color)}>
                                                <verifConfig.icon className="mr-1 h-3 w-3" />
                                                {lead.caseVerification}
                                            </Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Change Verification</DropdownMenuLabel>
                                        {verificationOptions.filter(v => v !== 'all').map(v => (
                                            <DropdownMenuItem key={v} onSelect={() => handleQuickStatusChange(lead.id!, 'verification', v)} disabled={lead.caseVerification === v}>
                                                 {lead.caseVerification === v && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                                                {v}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                 </DropdownMenu>
                            </TableCell>
                            <TableCell>₹{lead.helpRequested.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{lead.headline || 'N/A'}</TableCell>
                            <TableCell>{lead.dateCreated ? format(lead.dateCreated, "dd MMM yyyy") : 'N/A'}</TableCell>
                            <TableCell>{lead.verifiedAt ? format(lead.verifiedAt, "dd MMM yyyy") : 'N/A'}</TableCell>
                            <TableCell>{lead.lastAllocatedAt ? format(lead.lastAllocatedAt, "dd MMM yyyy") : 'N/A'}</TableCell>
                            <TableCell>{lead.closedAt ? format(lead.closedAt, "dd MMM yyyy") : 'N/A'}</TableCell>
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
        {paginatedLeads.map((lead) => {
            const verifConfig = verificationStatusConfig[lead.caseVerification] || defaultVerificationConfig;
            const StatusIcon = statusIcons[lead.caseStatus];
            return (
                <Card key={lead.id} className={cn("flex flex-col", selectedLeads.includes(lead.id!) && "ring-2 ring-primary")}>
                    <div className="p-4 flex gap-4">
                        <Checkbox
                            className="mt-1.5 flex-shrink-0"
                            checked={selectedLeads.includes(lead.id!)}
                            onCheckedChange={(checked) => {
                                setSelectedLeads(prev => checked ? [...prev, lead.id!] : prev.filter(id => id !== lead.id!));
                            }}
                            aria-label="Select card"
                        />
                        <Link href={`/admin/leads/${lead.id}`} className="flex-grow space-y-3">
                            <CardHeader className="p-0">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant="outline" className={cn("capitalize", statusColors[lead.caseStatus])}>
                                            {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                                            {lead.caseStatus}
                                        </Badge>
                                        <Badge variant="outline" className={cn("capitalize", verifConfig.color)}>
                                            <verifConfig.icon className="mr-1 h-3 w-3" />
                                            {lead.caseVerification}
                                        </Badge>
                                    </div>
                                </div>
                                <CardDescription>Req: <span className="font-semibold">₹{lead.helpRequested.toLocaleString()}</span></CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-3 text-sm">
                                 <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{lead.id}</span></div>
                                 <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{lead.dateCreated ? format(lead.dateCreated, "dd MMM yyyy") : 'N/A'}</span></div>
                            </CardContent>
                        </Link>
                        <div className="flex-shrink-0">
                           {renderActions(lead)}
                        </div>
                    </div>
                </Card>
            );
        })}
    </div>
);
    
    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                {selectedLeads.length > 0 ? (
                    `${selectedLeads.length} of ${filteredLeads.length} row(s) selected.`
                ) : (
                    `Showing ${paginatedLeads.length} of ${filteredLeads.length} leads.`
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
                 {selectedLeads.length > 0 && adminUserId && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium flex-shrink-0">
                            {selectedLeads.length} item(s) selected.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {isMobile && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const pageLeadIds = paginatedLeads.map(l => l.id!);
                                        if (selectedLeads.length === paginatedLeads.length) {
                                            setSelectedLeads(prev => prev.filter(id => !pageLeadIds.includes(id)));
                                        } else {
                                            setSelectedLeads(prev => [...new Set([...prev, ...pageLeadIds])]);
                                        }
                                    }}
                                >
                                    <Check className="mr-2 h-4 w-4"/>
                                    {selectedLeads.length === paginatedLeads.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            )}
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button>Change Status</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>Case Status</DropdownMenuSubTrigger>
                                        <DropdownMenuContent>
                                            {statusOptions.filter(s => s !== 'all').map(s => (
                                                <DropdownMenuItem key={s} onSelect={() => handleBulkStatusUpdate('caseStatus', s)}>{s}</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenuSub>
                                     <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>Verification Status</DropdownMenuSubTrigger>
                                        <DropdownMenuContent>
                                             {verificationOptions.filter(v => v !== 'all').map(v => (
                                                <DropdownMenuItem key={v} onSelect={() => handleBulkStatusUpdate('verificationStatus', v)}>{v}</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenuSub>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DeleteConfirmationDialog
                                itemType={`${selectedLeads.length} lead(s)`}
                                itemName="the selected items"
                                onDelete={() => handleBulkDeleteLeads(selectedLeads, adminUserId)}
                                onSuccess={onBulkActionSuccess}
                            >
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </Button>
                            </DeleteConfirmationDialog>
                        </div>
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
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Leads Management</h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCopyTemplate}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy Template
                </Button>
                <Link href="/admin/leads/add" className={cn(buttonVariants())}>
                    <PlusCircle className="mr-2" />
                    Add Lead
                </Link>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>
                    View and manage all help cases and their status.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                         <Label htmlFor="nameFilter">Search by Name or Lead ID</Label>
                         <Input
                            id="nameFilter"
                            placeholder="e.g., John Doe or USR01_1_..."
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                         />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="purposeFilter">Purpose</Label>
                        <Select value={purposeInput} onValueChange={(v) => { setPurposeInput(v); setCategoryInput('all'); }}>
                            <SelectTrigger id="purposeFilter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {allLeadPurposes.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="categoryFilter">Category</Label>
                        <Select value={categoryInput} onValueChange={setCategoryInput} disabled={purposeInput === 'all' || !categoryOptions[purposeInput]}>
                            <SelectTrigger id="categoryFilter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {(categoryOptions[purposeInput] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
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
                     <div className="flex items-end gap-4 lg:col-start-3 lg:col-span-1">
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

function LeadsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LeadsPageContent />
        </Suspense>
    )
}

export { LeadsPageContent };
export default LeadsPage;
```
  </change>
  <change>
    <file>src/ai/schemas.ts</file>
    <content><![CDATA[

/**
 * @fileOverview Centralized Zod schemas and TypeScript types for Genkit flows.
 */

import { z } from 'zod';

// Schema for sending an OTP
export const SendOtpInputSchema = z.object({
  phoneNumber: z.string().describe('The phone number to send the OTP to.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

export const SendOtpOutputSchema = z.object({
  success: z.boolean().describe('Whether the OTP was sent successfully.'),
  error: z.string().optional().describe('The error message if the OTP failed to send.'),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

// Schema for verifying an OTP
export const VerifyOtpInputSchema = z.object({
    phoneNumber: z.string().describe('The phone number the OTP was sent to.'),
    code: z.string().describe('The OTP code to verify.'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;

export const VerifyOtpOutputSchema = z.object({
  success: z.boolean().describe('Whether the OTP was verified successfully.'),
  error: z.string().optional().describe('The error message if verification failed.'),
});
export type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;

// Schema for sending an email
export const SendEmailInputSchema = z.object({
  to: z.string().describe('The recipient email address.'),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The body of the email (can be plain text or HTML).'),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export const SendEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  error: z.string().optional().describe('The error message if the email failed to send.'),
});
export type SendEmailOutput = z.infer<typeof SendEmailOutputSchema>;

// Schema for sending a WhatsApp message
export const SendWhatsappInputSchema = z.object({
  to: z.string().describe('The recipient phone number in E.164 format.'),
  body: z.string().describe('The body of the WhatsApp message.'),
});
export type SendWhatsappInput = z.infer<typeof SendWhatsappInputSchema>;

export const SendWhatsappOutputSchema = z.object({
  success: z.boolean().describe('Whether the message was sent successfully.'),
  error: z.string().optional().describe('The error message if the message failed to send.'),
});
export type SendWhatsappOutput = z.infer<typeof SendWhatsappOutputSchema>;


// Schema for Configuration Validator
export const ValidateConfigurationInputSchema = z.object({
  firebaseConfig: z
    .string()
    .describe('The Firebase configuration as a JSON string.'),
  externalServiceConfigs: z
    .string()
    .describe('The external services configurations as a JSON string.'),
});
export type ValidateConfigurationInput = z.infer<typeof ValidateConfigurationInputSchema>;

export const ValidateConfigurationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the configuration is valid or not.'),
  errors: z.array(z.string()).describe('A list of potential misconfigurations or security vulnerabilities.'),
});
export type ValidateConfigurationOutput = z.infer<typeof ValidateConfigurationOutputSchema>;


// Schema for Quotes
export const QuoteSchema = z.object({
  text: z.string().describe('The text of the quote.'),
  source: z.string().describe('The source of the quote (e.g., Quran 2:261, Sahih al-Bukhari, Imam Al-Ghazali).'),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const QuotesOutputSchema = z.object({
  quotes: z.array(QuoteSchema).describe('An array of inspirational quotes.'),
});
export type QuotesOutput = z.infer<typeof QuotesOutputSchema>;


// Schema for extracting donation details from an image
export const ExtractDonationDetailsInputSchema = z.object({
    photoDataUri: z
    .string()
    .describe(
      "A photo of a payment screenshot, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractDonationDetailsInput = z.infer<typeof ExtractDonationDetailsInputSchema>;

export const ExtractDonationDetailsOutputSchema = z.object({
  rawText: z.string().optional().describe("The full, raw text extracted from the image."),
  amount: z.number().optional().describe('The primary transaction amount. It must be a number.'),
  transactionId: z.string().optional().describe("The primary Transaction ID, Order ID, or UPI Reference No. For Google Pay, this should be the 'UPI transaction ID'."),
  utrNumber: z.string().optional().describe("The UTR number if it is explicitly visible. It's often a long number."),
  googlePayTransactionId: z.string().optional().describe("The Google Pay specific transaction ID."),
  phonePeTransactionId: z.string().optional().describe("The PhonePe specific transaction ID."),
  paytmUpiReferenceNo: z.string().optional().describe("The Paytm specific UPI Reference No."),
  date: z.string().optional().describe('The date of the transaction. Format it as YYYY-MM-DD.'),
  time: z.string().optional().describe('The time of the transaction. Format it as hh:mm am/pm.'),
  type: z.enum(['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah']).optional().describe("The category of donation if mentioned (e.g., Zakat, Sadaqah)."),
  purpose: z.enum(['Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use']).optional().describe("The specific purpose of the donation if mentioned (e.g., Education, Hospital)."),
  
  paymentApp: z.string().optional().describe('The primary method or app of payment (e.g., GPay, PhonePe, Paytm). Infer this from the UI, especially logos like "पे" for PhonePe or "Paytm Bank".'),
  senderPaymentApp: z.string().optional().describe("The app the sender used (e.g., 'PhonePe')."),
  recipientPaymentApp: z.string().optional().describe("The app the recipient received money on, if specified (e.g., 'Google Pay')."),
  
  paymentMethod: z.string().optional().describe('The specific payment method used, e.g., UPI, Bank Transfer. Often found near the transaction ID.'),
  
  senderName: z.string().optional().describe("The full name of the person who sent the money, often found under a 'FROM' or 'Debited From' heading."),
  phonePeSenderName: z.string().optional().describe("The sender's name specifically from a PhonePe receipt."),
  googlePaySenderName: z.string().optional().describe("The sender's name specifically from a Google Pay receipt."),
  paytmSenderName: z.string().optional().describe("The sender's name specifically from a Paytm receipt."),

  senderUpiId: z.string().optional().describe("The sender's UPI ID if visible (e.g., 'username@okaxis'). This is often found directly under or on the next line after the sender's name and contains an '@' symbol."),
  senderAccountNumber: z.string().optional().describe("The sender's bank account number, even if partial. Look for labels like 'A/c No.', 'From account ...1234', or a phone number explicitly linked to the account like '...linked to 1234567890'. Do NOT extract a standalone phone number here."),
  
  recipientName: z.string().optional().describe("The full name of the person who received the money, often found under a 'TO' heading."),
  phonePeRecipientName: z.string().optional().describe("The recipient's name specifically from a PhonePe receipt."),
  googlePayRecipientName: z.string().optional().describe("The recipient's name specifically from a Google Pay receipt."),
  paytmRecipientName: z.string().optional().describe("The recipient's name specifically from a Paytm receipt."),

  donorPhone: z.string().optional().describe("The sender's phone number, especially if it is specified as the linked account (e.g., '...linked to 1234567890')."),
  recipientPhone: z.string().optional().describe("The recipient's phone number if visible, often near the recipient's name."),
  recipientUpiId: z.string().optional().describe("The recipient's UPI ID if visible (e.g., 'username@okhdfc'). This is often found directly under the recipient's name."),
  recipientAccountNumber: z.string().optional().describe("The recipient's bank account number, even if partial (e.g., 'To account ...5678')."),
  status: z.string().optional().describe('The status of the transaction (e.g., Successful, Completed, Received).'),
  notes: z.string().optional().describe('Any user-added comments, remarks, or descriptions found in the payment details. Also labeled as "Message".'),
  recipientId: z.string().optional().describe("The internal user ID of the recipient, if found in the system."),
  recipientRole: z.enum(['Beneficiary', 'Referral', 'Organization Member']).optional().describe("The role of the recipient, if found in the system."),
});

export type ExtractDonationDetailsOutput = z.infer<typeof ExtractDonationDetailsOutputSchema>;


// Schema for extracting raw text from an image
export const ExtractRawTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractRawTextInput = z.infer<typeof ExtractRawTextInputSchema>;

export const ExtractRawTextOutputSchema = z.object({
    rawText: z.string().describe("The full, raw text extracted from the image.")
});
export type ExtractRawTextOutput = z.infer<typeof ExtractRawTextOutputSchema>;


// Schema for extracting details from raw text
export const ExtractDetailsFromTextInputSchema = z.object({
  rawText: z.string().describe("A block of raw text from a payment receipt to be parsed."),
});
export type ExtractDetailsFromTextInput = z.infer<typeof ExtractDetailsFromTextInputSchema>;

// Schema for extracting lead details from text
export const ExtractLeadDetailsFromTextInputSchema = z.object({
  rawText: z.string().describe("A block of raw text containing lead details to be parsed."),
});
export type ExtractLeadDetailsFromTextInput = z.infer<typeof ExtractLeadDetailsFromTextInputSchema>;

export const ExtractLeadDetailsOutputSchema = z.object({
    // Lead fields
    headline: z.string().optional().describe("A short, one-sentence summary of the case."),
    purpose: z.string().optional().describe("The main purpose of the request (e.g., Education, Medical)."),
    category: z.string().optional().describe("The specific category for the purpose (e.g., School Fees, Hospital Bill)."),
    amount: z.number().optional().describe("The amount requested."),
    dueDate: z.string().optional().describe("The date by which the funds are needed (YYYY-MM-DD)."),
    acceptableDonationTypes: z.array(z.string()).optional().describe("A list of donation types, e.g., ['Zakat', 'Sadaqah']."),
    caseDetails: z.string().optional().describe("The detailed reason or story for the help request."),
    // Beneficiary fields
    beneficiaryName: z.string().optional().describe("The full name of the beneficiary."),
    beneficiaryPhone: z.string().optional().describe("The 10-digit phone number of the beneficiary."),
    fatherName: z.string().optional().describe("The beneficiary's father's name."),
    beneficiaryEmail: z.string().email().optional().describe("The beneficiary's email address."),
    beneficiaryType: z.string().optional().describe("The type of beneficiary (e.g., Adult, Family, Kid, Widow)."),
    address: z.string().optional().describe("The full address of the beneficiary."),
    occupation: z.string().optional().describe("The beneficiary's occupation."),
    aadhaarNumber: z.string().optional().describe("The beneficiary's Aadhaar card number."),
    panNumber: z.string().optional().describe("The beneficiary's PAN card number."),
    bankAccountName: z.string().optional().describe("The name on the beneficiary's bank account."),
    bankAccountNumber: z.string().optional().describe("The beneficiary's bank account number."),
    bankIfscCode: z.string().optional().describe("The beneficiary's bank IFSC code."),
    upiIds: z.string().optional().describe("A comma-separated list of the beneficiary's UPI IDs."),
    // Referral fields
    referralName: z.string().optional().describe("The name of the person who referred the case."),
    referralPhone: z.string().optional().describe("The phone number of the person who referred the case."),
});
export type ExtractLeadDetailsOutput = z.infer<typeof ExtractLeadDetailsOutputSchema>;
