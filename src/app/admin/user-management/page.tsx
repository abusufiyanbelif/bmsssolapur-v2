// src/app/admin/user-management/page.tsx
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
import { Button, buttonVariants } from "@/components/ui/button";
import { getAllUsers } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, Trash2, FilterX, ChevronLeft, ChevronRight, MoreHorizontal, Search, UserCheck, UserX, EyeOff, ArrowUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleDeleteUser, handleToggleUserStatus } from "./actions";
import type { User, UserRole } from "@/services/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const allRoles: (UserRole | 'all')[] = ["all", "Donor", "Beneficiary", "Admin", "Finance Admin", "Super Admin", "Referral"];
const statusOptions: ('all' | 'active' | 'inactive')[] = ["all", "active", "inactive"];
const anonymityOptions: ('all' | 'anonymous' | 'not-anonymous')[] = ["all", "anonymous", "not-anonymous"];

type SortableColumn = 'name' | 'createdAt';
type SortDirection = 'asc' | 'desc';


export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Input states
    const [nameInput, setNameInput] = useState('');
    const [roleInput, setRoleInput] = useState<string>('all');
    const [statusInput, setStatusInput] = useState<string>('all');
    const [anonymityInput, setAnonymityInput] = useState<string>('all');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: '',
        role: 'all',
        status: 'all',
        anonymity: 'all',
    });
    
    // Sorting state
    const [sortColumn, setSortColumn] = useState<SortableColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
            setError(null);
        } catch (e) {
            setError("Failed to fetch users. Please try again later.");
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

    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedFilters({
            name: nameInput,
            role: roleInput,
            status: statusInput,
            anonymity: anonymityInput,
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


    const filteredUsers = useMemo(() => {
        let filtered = users.filter(user => {
            const nameMatch = appliedFilters.name === '' || 
                              user.name.toLowerCase().includes(appliedFilters.name.toLowerCase()) ||
                              user.id?.toLowerCase().includes(appliedFilters.name.toLowerCase()) ||
                              user.userId?.toLowerCase().includes(appliedFilters.name.toLowerCase());
            const roleMatch = appliedFilters.role === 'all' || user.roles.includes(appliedFilters.role as UserRole);
            const statusMatch = appliedFilters.status === 'all' || (appliedFilters.status === 'active' && user.isActive) || (appliedFilters.status === 'inactive' && !user.isActive);
            const anonymityMatch = appliedFilters.anonymity === 'all' ||
                (appliedFilters.anonymity === 'anonymous' && (user.isAnonymousAsBeneficiary || user.isAnonymousAsDonor)) ||
                (appliedFilters.anonymity === 'not-anonymous' && !user.isAnonymousAsBeneficiary && !user.isAnonymousAsDonor);
            
            return nameMatch && roleMatch && statusMatch && anonymityMatch;
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
    }, [users, appliedFilters, sortColumn, sortDirection]);
    
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    
    const resetFilters = () => {
        setNameInput('');
        setRoleInput('all');
        setStatusInput('all');
        setAnonymityInput('all');
        setAppliedFilters({ name: '', role: 'all', status: 'all', anonymity: 'all' });
        setCurrentPage(1);
    };
    
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const renderActions = (user: User) => {
        // The primary system admin cannot be deactivated or deleted.
        const isSystemAdmin = user.userId === 'admin.user';
        // A user cannot deactivate or delete their own account.
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
                           Name {renderSortIcon('name')}
                        </Button>
                    </TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                     <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('createdAt')}>
                            Joined On {renderSortIcon('createdAt')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedUsers.map((user, index) => (
                    <TableRow key={user.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">
                            <Link href={`/admin/user-management/${user.id}/edit`} className="hover:underline hover:text-primary">
                                {user.name}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <div className="font-mono text-xs">{user.userId}</div>
                            {user.isAnonymousAsBeneficiary && user.anonymousBeneficiaryId && (
                                <div className="font-mono text-xs text-muted-foreground" title="Anonymous Beneficiary ID">{user.anonymousBeneficiaryId}</div>
                            )}
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
            {paginatedUsers.map((user, index) => (
                <Card key={user.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg flex items-center gap-2">
                                #{ (currentPage - 1) * itemsPerPage + index + 1 }: 
                                <Link href={`/admin/user-management/${user.id}/edit`} className="hover:underline hover:text-primary">
                                    {user.name}
                                </Link>
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
                                {user.isAnonymousAsDonor && user.anonymousDonorId && (
                                    <div className="font-mono text-xs text-muted-foreground" title="Anonymous Donor ID">{user.anonymousDonorId}</div>
                                )}
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
                Showing {paginatedUsers.length} of {filteredUsers.length} users.
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
                    <p className="ml-2">Loading users...</p>
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

        if (users.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No users found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/user-management/add">
                           <PlusCircle className="mr-2" />
                           Add First User
                        </Link>
                    </Button>
                </div>
            )
        }
        
        if (filteredUsers.length === 0) {
             return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No users match your current filters.</p>
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
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">All Users</h2>
            <Button asChild>
                <Link href="/admin/user-management/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add User
                </Link>
            </Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                    A comprehensive list of every user in the system. Use the filters below to refine your search.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2 lg:col-span-2">
                        <Label htmlFor="nameFilter">Search by Name or ID</Label>
                        <Input 
                            id="nameFilter" 
                            placeholder="Filter by name or ID..."
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="roleFilter">Role</Label>
                        <Select value={roleInput} onValueChange={setRoleInput}>
                            <SelectTrigger id="roleFilter">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                {allRoles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
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
                        <Label htmlFor="anonymityFilter">Anonymity</Label>
                        <Select value={anonymityInput} onValueChange={setAnonymityInput}>
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
