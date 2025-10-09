// src/app/admin/donors/donors-client.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
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
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, UserCog, ChevronLeft, ChevronRight, FilterX, Search, MoreHorizontal, UserCheck, UserX, Trash2, EyeOff, ArrowUpDown, ChevronsUpDown, Check, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User, UserRole } from "@/services/types";
import { handleDeleteUser, handleToggleUserStatus, handleBulkDeleteUsers, getAllUsersAction } from "../user-management/actions";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';


type StatusFilter = 'all' | 'active' | 'inactive';
const statusOptions: StatusFilter[] = ["all", "active", "inactive"];

type AnonymityFilter = 'all' | 'anonymous' | 'not-anonymous';
const anonymityOptions: AnonymityFilter[] = ["all", "anonymous", "not-anonymous"];

type SortableColumn = 'name' | 'createdAt';
type SortDirection = 'asc' | 'desc';

function DonorsPageContent({ initialDonors, error: initialError }: { initialDonors: User[], error?: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const nameFromUrl = searchParams.get('name');

    const [donors, setDonors] = useState<User[]>(initialDonors);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
    const { toast } = useToast();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [adminUserId, setAdminUserId] = useState<string | null>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);


    // Input states
    const [nameInput, setNameInput] = useState(nameFromUrl || '');
    const [statusInput, setStatusInput] = useState<StatusFilter>('all');
    const [anonymityInput, setAnonymityInput] = useState<AnonymityFilter>('all');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: nameFromUrl || '',
        status: 'all' as StatusFilter,
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
            anonymity: anonymityInput,
        });
    };
    
    const fetchUsers = async () => {
        router.refresh();
    };


    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        setCurrentUserId(storedUserId);
        setAdminUserId(storedUserId);
    }, []);
    
    const onUserDeleted = (userId: string) => {
        toast({
            title: "User Deleted",
            description: "The user has been successfully removed.",
        });
        setDonors(prev => prev.filter(u => u.id !== userId));
    }
    
    const onBulkUsersDeleted = () => {
        toast({
            title: "Users Deleted",
            description: `${selectedUsers.length} user(s) have been successfully removed.`,
        });
        setDonors(prev => prev.filter(u => !selectedUsers.includes(u.id!)));
        setSelectedUsers([]);
    }
    
    const onStatusToggled = (userId: string, newStatus: boolean) => {
        toast({
            variant: "success",
            title: "Status Updated",
            description: `User has been successfully ${newStatus ? 'activated' : 'deactivated'}.`,
        });
        setDonors(prev => prev.map(u => u.id === userId ? {...u, isActive: newStatus} : u));
    };
    
    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }

    const filteredDonors = useMemo(() => {
        let filtered = donors.filter(user => {
            const searchTerm = appliedFilters.name.toLowerCase();
            const nameMatch = appliedFilters.name === '' ||
                user.name.toLowerCase().includes(searchTerm) ||
                (user.phone && user.phone.includes(searchTerm)) ||
                (user.aadhaarNumber && user.aadhaarNumber.includes(searchTerm)) ||
                (user.panNumber && user.panNumber.toLowerCase().includes(searchTerm)) ||
                (user.upiIds && user.upiIds.some(id => id.toLowerCase().includes(searchTerm)));
            
            const statusMatch = appliedFilters.status === 'all' || (appliedFilters.status === 'active' && user.isActive) || (appliedFilters.status === 'inactive' && !user.isActive);
            const anonymityMatch = appliedFilters.anonymity === 'all' ||
                (appliedFilters.anonymity === 'anonymous' && user.isAnonymousAsDonor) ||
                (appliedFilters.anonymity === 'not-anonymous' && !user.isAnonymousAsDonor);
            return nameMatch && statusMatch && anonymityMatch;
        });

        return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [donors, appliedFilters, sortColumn, sortDirection]);

    const paginatedDonors = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDonors.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDonors, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredDonors.length / itemsPerPage);
    
    const resetFilters = () => {
        setNameInput('');
        setStatusInput('all');
        setAnonymityInput('all');
        setAppliedFilters({ name: '', status: 'all', anonymity: 'all' });
        setCurrentPage(1);
    };
    
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
    
     const renderActions = (user: User) => {
        const isProtectedUser = user.roles.includes('Super Admin') || user.id === currentUserId;

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
                        <Link href={`/admin/user-management/${user.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit User
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.isActive ? (
                        <DropdownMenuItem disabled={isProtectedUser} onSelect={async () => {
                            const result = await handleToggleUserStatus(user.id!, false);
                            if (result.success) onStatusToggled(user.id!, false);
                        }}>
                            <UserX className="mr-2 h-4 w-4" /> Deactivate
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem disabled={isProtectedUser} onSelect={async () => {
                            const result = await handleToggleUserStatus(user.id!, true);
                            if (result.success) onStatusToggled(user.id!, true);
                        }}>
                            <UserCheck className="mr-2 h-4 w-4" /> Activate
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    
                    <DeleteConfirmationDialog
                        itemType="user"
                        itemName={user.name}
                        onDelete={async () => {
                            if (!adminUserId) return { success: false, error: 'Admin user ID not found.' };
                            return await handleDeleteUser(user.id!, adminUserId);
                        }}
                        onSuccess={() => onUserDeleted(user.id!)}
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


    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell>
                        <Checkbox
                            checked={paginatedDonors.length > 0 && selectedUsers.length === paginatedDonors.filter(u => !u.roles.includes('Super Admin') && u.id !== currentUserId).length}
                            onCheckedChange={(checked) => {
                                const pageUserIds = paginatedDonors.filter(u => !u.roles.includes('Super Admin') && u.id !== currentUserId).map(u => u.id!);
                                if (checked) {
                                     setSelectedUsers(prev => [...new Set([...prev, ...pageUserIds])]);
                                } else {
                                    setSelectedUsers(prev => prev.filter(id => !pageUserIds.includes(id)));
                                }
                            }}
                            aria-label="Select all on current page"
                        />
                    </TableCell>
                    <TableHead>User Key</TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('name')}>
                            Name
                            {renderSortIcon('name')}
                        </Button>
                    </TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Roles</TableHead>
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
                {paginatedDonors.map((user, index) => {
                    const isProtectedUser = user.roles.includes('Super Admin') || user.id === currentUserId;
                    return (
                    <TableRow key={user.id} data-state={selectedUsers.includes(user.id!) && 'selected'}>
                        <TableCell>
                            <Checkbox
                                checked={selectedUsers.includes(user.id!)}
                                onCheckedChange={(checked) => {
                                    setSelectedUsers(prev => 
                                        checked ? [...prev, user.id!] : prev.filter(id => id !== user.id!)
                                    );
                                }}
                                aria-label="Select row"
                                disabled={isProtectedUser}
                            />
                        </TableCell>
                        <TableCell><Badge variant="outline">{user.userKey || 'N/A'}</Badge></TableCell>
                        <TableCell className="font-medium">
                            <Link href={`/admin/user-management/${user.id}/edit`} className="hover:underline hover:text-primary">
                                {user.name}
                            </Link>
                             {user.isAnonymousAsDonor && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <EyeOff className="ml-2 h-4 w-4 inline-block text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>This user is anonymous</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                             )}
                        </TableCell>
                        <TableCell>
                            <div className="font-mono text-xs">{user.userId}</div>
                            {user.isAnonymousAsDonor && user.anonymousDonorId && (
                                <div className="font-mono text-xs text-muted-foreground" title="Anonymous Donor ID">{user.anonymousDonorId}</div>
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
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(user.createdAt as Date, "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right">
                           {renderActions(user)}
                        </TableCell>
                    </TableRow>
                )})}
            </TableBody>
        </Table>
    );

    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                 {selectedUsers.length > 0 ? (
                    `${selectedUsers.length} of ${filteredDonors.length} row(s) selected.`
                ) : (
                    `Showing ${paginatedDonors.length} of ${filteredDonors.length} donors.`
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
                    <p className="ml-2">Loading donors...</p>
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

        if (donors.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No donors found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/user-management/add">
                           <PlusCircle className="mr-2" />
                           Add First Donor
                        </Link>
                    </Button>
                </div>
            )
        }
        
         if (filteredDonors.length === 0) {
             return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No donors match your current filters.</p>
                     <Button variant="outline" onClick={resetFilters} className="mt-4">
                        <FilterX className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </div>
            )
        }


        return (
            <>
                 {selectedUsers.length > 0 && adminUserId && (
                    <div className="flex items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">
                            {selectedUsers.length} item(s) selected.
                        </p>
                         <DeleteConfirmationDialog
                            itemType={`${selectedUsers.length} user(s)`}
                            itemName="the selected items"
                            onDelete={() => handleBulkDeleteUsers(selectedUsers, adminUserId)}
                            onSuccess={onBulkUsersDeleted}
                        >
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected
                            </Button>
                        </DeleteConfirmationDialog>
                    </div>
                )}
                {renderTable()}
                {totalPages > 1 && renderPaginationControls()}
            </>
        )
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Donor Management</h2>
            <Button asChild>
                <Link href="/admin/user-management/add">
                    <PlusCircle className="mr-2" />
                    Add Donor
                </Link>
            </Button>
        </div>
        
         <Card>
            <CardHeader>
                <CardTitle className="text-primary">All Donors</CardTitle>
                <CardDescription className="text-muted-foreground">
                    A list of all users in the system with the Donor role.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="nameFilter">Search by Name, Phone, Aadhaar, etc.</Label>
                        <Input 
                            id="nameFilter" 
                            placeholder="Enter search term..." 
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                        />
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

export function DonorsPageClient(props: { initialDonors: User[], error?: string }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <DonorsPageContent {...props} />
        </Suspense>
    )
}
