
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { getAllUsers } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, UserCog, ChevronLeft, ChevronRight, FilterX, Search, PersonStanding, Baby, HeartHandshake, Home, MoreHorizontal, UserCheck, UserX, Trash2, EyeOff, ArrowUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User, UserRole } from "@/services/types";
import { handleDeleteUser, handleToggleUserStatus } from "../user-management/actions";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";


type StatusFilter = 'all' | 'active' | 'inactive';
const statusOptions: StatusFilter[] = ["all", "active", "inactive"];

type AnonymityFilter = 'all' | 'anonymous' | 'not-anonymous';
const anonymityOptions: AnonymityFilter[] = ["all", "anonymous", "not-anonymous"];

type TypeFilter = 'all' | 'Adult' | 'Kid' | 'Old Age' | 'Widow' | 'Family';
const typeOptions: { value: TypeFilter, label: string, icon?: React.ElementType }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'Adult', label: 'Adults', icon: PersonStanding },
    { value: 'Kid', label: 'Kids', icon: Baby },
    { value: 'Family', label: 'Families', icon: Home },
    { value: 'Widow', label: 'Widows', icon: HeartHandshake },
];


type SortableColumn = 'name' | 'createdAt';
type SortDirection = 'asc' | 'desc';

function BeneficiariesPageContent() {
    const searchParams = useSearchParams();
    const typeFromUrl = searchParams.get('type');
    const widowFromUrl = searchParams.get('isWidow');
    
    const [beneficiaries, setBeneficiaries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    
    // Determine initial type filter from URL
    let initialTypeFilter: TypeFilter = 'all';
    if(widowFromUrl === 'true') {
        initialTypeFilter = 'Widow';
    } else if (typeFromUrl && ['Adult', 'Kid', 'Old Age', 'Family'].includes(typeFromUrl)) {
        initialTypeFilter = typeFromUrl as TypeFilter;
    }

    // Input states
    const [nameInput, setNameInput] = useState('');
    const [statusInput, setStatusInput] = useState<StatusFilter>('all');
    const [typeInput, setTypeInput] = useState<TypeFilter>(initialTypeFilter);
    const [anonymityInput, setAnonymityInput] = useState<AnonymityFilter>('all');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: '',
        status: 'all' as StatusFilter,
        type: initialTypeFilter,
        anonymity: 'all' as AnonymityFilter,
    });
    
    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortableColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedFilters({
            name: nameInput,
            status: statusInput,
            type: typeInput,
            anonymity: anonymityInput,
        });
    };
    
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const allUsers = await getAllUsers();
            const beneficiaryUsers = allUsers.filter(u => u.roles.includes('Beneficiary'));
            setBeneficiaries(beneficiaryUsers);
            setError(null);
        } catch (e) {
            setError("Failed to fetch beneficiaries. Please try again later.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchUsers();
        const storedUserId = localStorage.getItem('userId');
        setCurrentUserId(storedUserId);
    }, []);
    
    const onUserDeleted = () => {
        toast({
            title: "User Deleted",
            description: "The user has been successfully removed.",
        });
        fetchUsers();
    }
    
    const onStatusToggled = (newStatus: boolean) => {
        toast({
            variant: "success",
            title: "Status Updated",
            description: `User has been successfully ${newStatus ? 'activated' : 'deactivated'}.`,
        });
        fetchUsers();
    };

    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }

    const filteredBeneficiaries = useMemo(() => {
        let filtered = beneficiaries.filter(user => {
            const nameMatch = appliedFilters.name === '' || user.name.toLowerCase().includes(appliedFilters.name.toLowerCase());
            const statusMatch = appliedFilters.status === 'all' || (appliedFilters.status === 'active' && user.isActive) || (appliedFilters.status === 'inactive' && !user.isActive);
            const typeMatch = appliedFilters.type === 'all' || 
                              (appliedFilters.type === 'Widow' && user.isWidow) || 
                              user.beneficiaryType === appliedFilters.type;
            const anonymityMatch = appliedFilters.anonymity === 'all' ||
                (appliedFilters.anonymity === 'anonymous' && user.isAnonymousAsBeneficiary) ||
                (appliedFilters.anonymity === 'not-anonymous' && !user.isAnonymousAsBeneficiary);
            return nameMatch && statusMatch && typeMatch && anonymityMatch;
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

    }, [beneficiaries, appliedFilters, sortColumn, sortDirection]);

    const paginatedBeneficiaries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredBeneficiaries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredBeneficiaries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredBeneficiaries.length / itemsPerPage);
    
    const resetFilters = () => {
        setNameInput('');
        setStatusInput('all');
        setTypeInput('all');
        setAnonymityInput('all');
        setAppliedFilters({ name: '', status: 'all', type: 'all', anonymity: 'all' });
        setCurrentPage(1);
    };
    
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
    
     const renderActions = (user: User) => {
        const isSystemAdmin = user.userId === 'admin.user';
        const isCurrentUser = user.id === currentUserId;
        const isProtectedUser = isSystemAdmin || isCurrentUser;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {user.isActive ? (
                        <DropdownMenuItem disabled={isProtectedUser} onSelect={async () => {
                            const result = await handleToggleUserStatus(user.id!, false);
                            if (result.success) onStatusToggled(false);
                        }}>
                            <UserX className="mr-2 h-4 w-4" /> Deactivate
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem disabled={isProtectedUser} onSelect={async () => {
                            const result = await handleToggleUserStatus(user.id!, true);
                            if (result.success) onStatusToggled(true);
                        }}>
                            <UserCheck className="mr-2 h-4 w-4" /> Activate
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    
                    <DeleteConfirmationDialog
                        itemType="user"
                        itemName={user.name}
                        onDelete={() => handleDeleteUser(user.id!)}
                        onSuccess={onUserDeleted}
                    >
                         <DropdownMenuItem disabled={isProtectedUser} onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DeleteConfirmationDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        );
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
                        <Button variant="ghost" onClick={() => handleSort('name')}>
                            Name
                            {renderSortIcon('name')}
                        </Button>
                    </TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('createdAt')}>
                            Joined On
                            {renderSortIcon('createdAt')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedBeneficiaries.map((user, index) => (
                    <TableRow key={user.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">
                            <Link href={`/admin/user-management/${user.id}/edit`} className="hover:underline hover:text-primary">
                                {user.name}
                            </Link>
                             {user.isAnonymousAsBeneficiary && <EyeOff className="ml-2 h-4 w-4 inline-block text-muted-foreground" title="This user is anonymous" />}
                        </TableCell>
                        <TableCell>
                            <div className="font-mono text-xs">{user.userId}</div>
                            {user.isAnonymousAsBeneficiary && user.anonymousBeneficiaryId && (
                                <div className="font-mono text-xs text-muted-foreground" title="Anonymous Beneficiary ID">{user.anonymousBeneficiaryId}</div>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span>{user.phone}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </TableCell>
                         <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {user.roles?.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-2">
                               {user.beneficiaryType && <Badge variant="outline">{user.beneficiaryType}</Badge>}
                               {user.isWidow && <Badge variant="outline" className="bg-pink-100 text-pink-800"><HeartHandshake className="mr-1 h-3 w-3" />Widow</Badge>}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(user.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right">
                             {renderActions(user)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedBeneficiaries.map((user, index) => (
                <Card key={user.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <CardTitle className="text-lg flex items-center gap-2">
                                #{ (currentPage - 1) * itemsPerPage + index + 1 }: 
                                <Link href={`/admin/user-management/${user.id}/edit`} className="hover:underline hover:text-primary">
                                    {user.name}
                                </Link>
                                 {user.isAnonymousAsBeneficiary && <EyeOff className="h-4 w-4 inline-block text-muted-foreground" title="This user is anonymous" />}
                            </CardTitle>
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <CardDescription>{user.phone} &middot; {user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">User ID</span>
                            <div className="text-right">
                                <span className="font-mono text-xs">{user.userId}</span>
                                {user.isAnonymousAsBeneficiary && user.anonymousBeneficiaryId && (
                                    <div className="font-mono text-xs text-muted-foreground" title="Anonymous Beneficiary ID">{user.anonymousBeneficiaryId}</div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {user.beneficiaryType && <Badge variant="outline">{user.beneficiaryType}</Badge>}
                            {user.isWidow && <Badge variant="outline" className="bg-pink-100 text-pink-800"><HeartHandshake className="mr-1 h-3 w-3" />Widow</Badge>}
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Roles</h4>
                             <div className="flex flex-wrap gap-1">
                                {user.roles?.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                             <span>Joined On</span>
                             <span>{format(user.createdAt.toDate(), "dd MMM yyyy")}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                       {renderActions(user)}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
    
    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedBeneficiaries.length} of {filteredBeneficiaries.length} beneficiaries.
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
                    <p className="ml-2">Loading beneficiaries...</p>
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

        if (beneficiaries.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No beneficiaries found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/user-management/add">
                           <PlusCircle className="mr-2" />
                           Add First Beneficiary
                        </Link>
                    </Button>
                </div>
            )
        }
        
         if (filteredBeneficiaries.length === 0) {
             return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No beneficiaries match your current filters.</p>
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
        )
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Beneficiary Management</h2>
            <Button asChild>
                <Link href="/admin/user-management/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Beneficiary
                </Link>
            </Button>
        </div>
        
         <Card>
            <CardHeader>
                <CardTitle>All Beneficiaries</CardTitle>
                <CardDescription>
                    A list of all users in the system with the Beneficiary role.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="nameFilter">Beneficiary Name</Label>
                        <Input 
                            id="nameFilter" 
                            placeholder="Filter by name..."
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="typeFilter">Beneficiary Type</Label>
                        <Select value={typeInput} onValueChange={(v) => setTypeInput(v as TypeFilter)}>
                            <SelectTrigger id="typeFilter">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                {typeOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="capitalize">{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statusFilter">Status</Label>
                        <Select value={statusInput} onValueChange={(v) => setStatusInput(v as StatusFilter)}>
                            <SelectTrigger id="statusFilter">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="anonymityFilter">Anonymity</Label>
                        <Select value={anonymityInput} onValueChange={(v) => setAnonymityInput(v as AnonymityFilter)}>
                            <SelectTrigger id="anonymityFilter">
                                <SelectValue placeholder="Filter by anonymity" />
                            </SelectTrigger>
                            <SelectContent>
                                {anonymityOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}
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


export default function BeneficiariesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BeneficiariesPageContent />
        </Suspense>
    )
}
