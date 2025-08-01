
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
import { getAllUsers, type User } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, UserCog, ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatusFilter = 'all' | 'active' | 'inactive';
const statusOptions: StatusFilter[] = ["all", "active", "inactive"];

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
const sortOptions: { value: SortOption, label: string }[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'date-desc', label: 'Joined Date (Newest First)' },
    { value: 'date-asc', label: 'Joined Date (Oldest First)' },
];


export default function BeneficiariesPage() {
    const [beneficiaries, setBeneficiaries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    // Filter and Sort states
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sort, setSort] = useState<SortOption>('name-asc');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleFeatureInProgress = () => {
        toast({
            title: "In Progress",
            description: "This feature is currently in development and will be available soon.",
        });
    };

    useEffect(() => {
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

        fetchUsers();
    }, []);
    
    const filteredBeneficiaries = useMemo(() => {
        let filtered = beneficiaries.filter(user => {
            const nameMatch = nameFilter === '' || user.name.toLowerCase().includes(nameFilter.toLowerCase());
            const statusMatch = statusFilter === 'all' || (statusFilter === 'active' && user.isActive) || (statusFilter === 'inactive' && !user.isActive);
            return nameMatch && statusMatch;
        });

        return filtered.sort((a, b) => {
             switch(sort) {
                case 'date-desc': return b.createdAt.toMillis() - a.createdAt.toMillis();
                case 'date-asc': return a.createdAt.toMillis() - b.createdAt.toMillis();
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });

    }, [beneficiaries, nameFilter, statusFilter, sort]);

    const paginatedBeneficiaries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredBeneficiaries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredBeneficiaries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredBeneficiaries.length / itemsPerPage);
    
    const resetFilters = () => {
        setNameFilter('');
        setStatusFilter('all');
        setSort('name-asc');
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [nameFilter, statusFilter, itemsPerPage]);

    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedBeneficiaries.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span>{user.phone}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(user.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={handleFeatureInProgress}>
                                <UserCog className="mr-2 h-3 w-3" /> Manage
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedBeneficiaries.map(user => (
                <Card key={user.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{user.name}</CardTitle>
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <CardDescription>{user.phone} &middot; {user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                             <span>Joined On</span>
                             <span>{format(user.createdAt.toDate(), "dd MMM yyyy")}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={handleFeatureInProgress}>
                            <UserCog className="mr-2 h-3 w-3" /> Manage User
                        </Button>
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">Beneficiary Management</h2>
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
                        <Label htmlFor="statusFilter">Status</Label>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                            <SelectTrigger id="statusFilter">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
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

    