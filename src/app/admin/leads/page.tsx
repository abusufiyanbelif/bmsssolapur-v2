
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
import type { LeadPriority, LeadPurpose, LeadVerificationStatus, LeadStatus, LeadAction, AppSettings, User, Lead } from "@/services/types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleBulkUpdateLeadStatus, handleBulkDeleteLeads } from "./[id]/actions";
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";
import { updateLeadStatus, updateLeadVerificationStatus, getAllLeads } from "@/services/lead-service";
import { getUser, getAllUsers } from "@/services/user-service";
import { getAppSettings } from "@/services/app-settings-service";


const statusOptions: (LeadStatus | 'all')[] = ["all", "Open", "Pending", "Complete", "On Hold", "Cancelled", "Closed", "Partial"];
const verificationOptions: (LeadVerificationStatus | 'all')[] = ["all", "Pending", "Verified", "Rejected", "More Info Required", "Duplicate", "Other"];

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

interface LeadsPageContentProps {
  initialLeads: EnrichedLead[];
  initialUsers: User[];
  initialSettings: AppSettings | null;
  error?: string;
}

function LeadsPageContent({ initialLeads, initialUsers, initialSettings, error: initialError }: LeadsPageContentProps) {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status');
    const verificationFromUrl = searchParams.get('verification');
    const typeFromUrl = searchParams.get('beneficiaryType');
    const purposeFromUrl = searchParams.get('purpose');

    const [leads, setLeads] = useState<EnrichedLead[]>(initialLeads);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [settings, setSettings] = useState<AppSettings | null>(initialSettings);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
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
    
    const allLeadPurposes = useMemo(() => {
        return (settings?.leadConfiguration?.purposes || [])
            .filter(p => p.enabled)
            .map(p => p.name) || [];
    }, [settings]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { getAllLeads } = await import('@/services/lead-service');
            const { getAllUsers } = await import('@/services/user-service');
            const [fetchedLeads, fetchedUsers] = await Promise.all([
                getAllLeads(),
                getAllUsers(),
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
Acceptable Donation Types: (Zakat, Sadaqah, Fitr, Lillah, Kaffarah, Interest)
Case Details: (The detailed story or reason for the request)

--- BENEFICIARY DETAILS ---
Full Name: 
Father's Name:
Father's Phone:
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
                     <div className="p-4 flex gap-4 items-start">
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
                                    <CardTitle className="text-lg">
                                        <div className="flex items-center gap-2">
                                            {lead.name}
                                        </div>
                                    </CardTitle>
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
                                <CardDescription>
                                    Req: <span className="font-semibold">₹{lead.helpRequested.toLocaleString()}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-3 text-sm">
                                 <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{lead.id}</span></div>
                                 <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{lead.dateCreated ? format(lead.dateCreated, "dd MMM yyyy") : 'N/A'}</span></div>
                            </CardContent>
                        </Link>
                        <div className="flex-shrink-0 -mr-2 -mt-2">
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
                                 <SelectItem value="all">All Purposes</SelectItem>
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

export default function LeadsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LeadsPageDataLoader />
        </Suspense>
    )
}

// Create a new Server Component to fetch the data
async function LeadsPageDataLoader() {
    try {
        const [allLeads, allUsers, settings] = await Promise.all([
            getAllLeads(),
            getAllUsers(),
            getAppSettings(),
        ]);
        return (
            <LeadsPageContent
                initialLeads={JSON.parse(JSON.stringify(allLeads))}
                initialUsers={JSON.parse(JSON.stringify(allUsers))}
                initialSettings={JSON.parse(JSON.stringify(settings))}
            />
        );
    } catch (error) {
        return (
            <LeadsPageContent
                initialLeads={[]}
                initialUsers={[]}
                initialSettings={null}
                error="Failed to load initial data for leads page."
            />
        )
    }
}
