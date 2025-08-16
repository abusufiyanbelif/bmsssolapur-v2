
// src/app/admin/referrals/page.tsx
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
import { getAllUsers } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, UserCog, ChevronLeft, ChevronRight, FilterX, Search, MoreHorizontal, UserCheck, UserX, Trash2, EyeOff, ArrowUpDown, ChevronsUpDown, Check, Edit } from "lucide-react";
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
import { handleDeleteUser, handleToggleUserStatus, handleBulkDeleteUsers } from "../user-management/actions";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";


type StatusFilter = 'all' | 'active' | 'inactive';
const statusOptions: StatusFilter[] = ["all", "active", "inactive"];

type SortableColumn = 'name' | 'createdAt';
type SortDirection = 'asc' | 'desc';

function ReferralsPageContent() {
    const [referrals, setReferrals] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);


    // Input states
    const [nameInput, setNameInput] = useState('');
    const [statusInput, setStatusInput] = useState<StatusFilter>('all');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: '',
        status: 'all' as StatusFilter,
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
        });
    };
    
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const allUsers = await getAllUsers();
            const referralUsers = allUsers.filter(u => u.roles.includes('Referral'));
            setReferrals(referralUsers);
            setError(null);
        } catch (e) {
            setError("Failed to fetch referrals. Please try again later.");
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
    
    const onBulkUsersDeleted = () => {
        toast({
            title: "Users Deleted",
            description: `${selectedUsers.length} user(s) have been successfully removed.`,
        });
        setSelectedUsers([]);
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

    const filteredReferrals = useMemo(() => {
        let filtered = referrals.filter(user => {
            const nameMatch = appliedFilters.name === '' || user.name.toLowerCase().includes(appliedFilters.name.toLowerCase());
            const statusMatch = appliedFilters.status === 'all' || (appliedFilters.status === 'active' && user.isActive) || (appliedFilters.status === 'inactive' && !user.isActive);
            return nameMatch && statusMatch;
        });

        return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [referrals, appliedFilters, sortColumn, sortDirection]);

    const paginatedReferrals = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReferrals.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReferrals, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);
    
    const resetFilters = () => {
        setNameInput('');
        setStatusInput('all');
        setAppliedFilters({ name: '', status: 'all' });
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
                    <TableHead padding="checkbox">
                        <Checkbox
                            checked={paginatedReferrals.length > 0 && selectedUsers.length === paginatedReferrals.filter(u => !u.roles.includes('Super Admin') && u.id !== currentUserId).length}
                            onCheckedChange={(checked) => {
                                const pageUserIds = paginatedReferrals.filter(u => !u.roles.includes('Super Admin') && u.id !== currentUserId).map(u => u.id!);
                                if (checked) {
                                     setSelectedUsers(prev => [...new Set([...prev, ...pageUserIds])]);
                                } else {
                                    setSelectedUsers(prev => prev.filter(id => !pageUserIds.includes(id)));
                                }
                            }}
                            aria-label="Select all on current page"
                        />
                    </TableHead>
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
                {paginatedReferrals.map((user, index) => {
                    const isProtectedUser = user.roles.includes('Super Admin') || user.id === currentUserId;
                    return (
                    <TableRow key={user.id} data-state={selectedUsers.includes(user.id!) && 'selected'}>
                        <TableCell padding="checkbox">
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
                        </TableCell>
                        <TableCell>
                            <div className="font-mono text-xs">{user.userId}</div>
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
                        <TableCell>{format(user.createdAt, "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right">
                           {renderActions(user)}
                        </TableCell>
                    </TableRow>
                )})}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedReferrals.map((user, index) => {
                 const isProtectedUser = user.roles.includes('Super Admin') || user.id === currentUserId;
                 return (
                <Card key={user.id} className={cn(selectedUsers.includes(user.id!) && "ring-2 ring-primary")}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-4">
                                <Checkbox
                                    className="mt-1"
                                    checked={selectedUsers.includes(user.id!)}
                                    onCheckedChange={(checked) => {
                                        setSelectedUsers(prev => 
                                            checked ? [...prev, user.id!] : prev.filter(id => id !== user.id!)
                                        );
                                    }}
                                    aria-label="Select card"
                                    disabled={isProtectedUser}
                                />
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Link href={`/admin/user-management/${user.id}/edit`} className="hover:underline hover:text-primary">
                                        {user.name}
                                    </Link>
                                </CardTitle>
                            </div>
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <CardDescription>{user.phone} &middot; {user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">User Key</span>
                            <span className="font-semibold">{user.userKey || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">User ID</span>
                             <div className="text-right">
                                <span className="font-mono text-xs">{user.userId}</span>
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-2">Roles</h4>
                             <div className="flex flex-wrap gap-1">
                                {user.roles?.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                             <span>Joined On</span>
                             <span>{format(user.createdAt, "dd MMM yyyy")}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                       {renderActions(user)}
                    </CardFooter>
                </Card>
                 )
            })}
        </div>
    );
    
    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                 {selectedUsers.length > 0 ? (
                    `${selectedUsers.length} of ${filteredReferrals.length} row(s) selected.`
                ) : (
                    `Showing ${paginatedReferrals.length} of ${filteredReferrals.length} referrals.`
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
                    <p className="ml-2">Loading referrals...</p>
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

        if (referrals.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No referrals found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/user-management/add">
                           <PlusCircle className="mr-2" />
                           Add First Referral
                        </Link>
                    </Button>
                </div>
            )
        }
        
         if (filteredReferrals.length === 0) {
             return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No referrals match your current filters.</p>
                     <Button variant="outline" onClick={resetFilters} className="mt-4">
                        <FilterX className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                </div>
            )
        }


        return (
            <>
                 {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">
                            {selectedUsers.length} item(s) selected.
                        </p>
                         <DeleteConfirmationDialog
                            itemType={`${selectedUsers.length} user(s)`}
                            itemName="the selected items"
                            onDelete={() => handleBulkDeleteUsers(selectedUsers)}
                            onSuccess={onBulkUsersDeleted}
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
        )
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Referral Management</h2>
            <Button asChild>
                <Link href="/admin/user-management/add">
                    <PlusCircle className="mr-2" />
                    Add Referral
                </Link>
            </Button>
        </div>
        
         <Card>
            <CardHeader>
                <CardTitle>All Referrals</CardTitle>
                <CardDescription>
                    A list of all users in the system with the Referral role.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="nameFilter">Referral Name</Label>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal"
                                >
                                {nameInput
                                    ? referrals.find((user) => user.name.toLowerCase() === nameInput.toLowerCase())?.name
                                    : "Select a referral..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput 
                                        placeholder="Search referral..."
                                        value={nameInput}
                                        onValueChange={setNameInput}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No referrals found.</CommandEmpty>
                                        <CommandGroup>
                                        {referrals.map((user) => (
                                            <CommandItem
                                            value={user.name}
                                            key={user.id}
                                            onSelect={(currentValue) => {
                                                setNameInput(currentValue === nameInput ? "" : currentValue);
                                                setPopoverOpen(false);
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                nameInput.toLowerCase() === user.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {user.name}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
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
                    <div className="flex items-end gap-4 lg:col-span-full">
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


export default function ReferralsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReferralsPageContent />
        </Suspense>
    )
}
