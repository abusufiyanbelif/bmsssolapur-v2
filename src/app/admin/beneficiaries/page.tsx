

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
import { Loader2, AlertCircle, PlusCircle, UserCog, ChevronLeft, ChevronRight, FilterX, Search, PersonStanding, Baby, HeartHandshake } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/services/types";

type StatusFilter = 'all' | 'active' | 'inactive';
const statusOptions: StatusFilter[] = ["all", "active", "inactive"];

type TypeFilter = 'all' | 'Adult' | 'Kid' | 'Old Age' | 'Widow';
const typeOptions: { value: TypeFilter, label: string, icon?: React.ElementType }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'Adult', label: 'Adults', icon: PersonStanding },
    { value: 'Kid', label: 'Kids', icon: Baby },
    { value: 'Widow', label: 'Widows', icon: HeartHandshake },
];


type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
const sortOptions: { value: SortOption, label: string }[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'date-desc', label: 'Joined Date (Newest First)' },
    { value: 'date-asc', label: 'Joined Date (Oldest First)' },
];


function BeneficiariesPageContent() {
    const searchParams = useSearchParams();
    const typeFromUrl = searchParams.get('type');
    const widowFromUrl = searchParams.get('isWidow');
    
    const [beneficiaries, setBeneficiaries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();
    
    // Determine initial type filter from URL
    let initialTypeFilter: TypeFilter = 'all';
    if(widowFromUrl === 'true') {
        initialTypeFilter = 'Widow';
    } else if (typeFromUrl && ['Adult', 'Kid', 'Old Age'].includes(typeFromUrl)) {
        initialTypeFilter = typeFromUrl as TypeFilter;
    }

    // Input states
    const [nameInput, setNameInput] = useState('');
    const [statusInput, setStatusInput] = useState<StatusFilter>('all');
    const [typeInput, setTypeInput] = useState<TypeFilter>(initialTypeFilter);
    const [sortInput, setSortInput] = useState<SortOption>('name-asc');
    
    // Applied filter states
    const [appliedFilters, setAppliedFilters] = useState({
        name: '',
        status: 'all' as StatusFilter,
        type: initialTypeFilter,
        sort: 'name-asc' as SortOption
    });
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedFilters({
            name: nameInput,
            status: statusInput,
            type: typeInput,
            sort: sortInput
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
            const nameMatch = appliedFilters.name === '' || user.name.toLowerCase().includes(appliedFilters.name.toLowerCase());
            const statusMatch = appliedFilters.status === 'all' || (appliedFilters.status === 'active' && user.isActive) || (appliedFilters.status === 'inactive' && !user.isActive);
            const typeMatch = appliedFilters.type === 'all' || 
                              (appliedFilters.type === 'Widow' && user.isWidow) || 
                              user.beneficiaryType === appliedFilters.type;
            return nameMatch && statusMatch && typeMatch;
        });

        return filtered.sort((a, b) => {
             switch(appliedFilters.sort) {
                case 'date-desc': return b.createdAt.toMillis() - a.createdAt.toMillis();
                case 'date-asc': return a.createdAt.toMillis() - b.createdAt.toMillis();
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });

    }, [beneficiaries, appliedFilters]);

    const paginatedBeneficiaries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredBeneficiaries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredBeneficiaries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredBeneficiaries.length / itemsPerPage);
    
    const resetFilters = () => {
        setNameInput('');
        setStatusInput('all');
        setTypeInput('all');
        setSortInput('name-asc');
        setAppliedFilters({ name: '', status: 'all', type: 'all', sort: 'name-asc' });
        setCurrentPage(1);
    };
    
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedBeneficiaries.map((user, index) => (
                    <TableRow key={user.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.phone}</span>
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
                             <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/user-management/${user.id}/edit`}>
                                    <UserCog className="mr-2 h-3 w-3" /> Manage
                                </Link>
                            </Button>
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
                            <CardTitle className="text-lg">#{ (currentPage - 1) * itemsPerPage + index + 1 }: {user.name}</CardTitle>
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <CardDescription>{user.phone} &middot; {user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                            {user.beneficiaryType && <Badge variant="outline">{user.beneficiaryType}</Badge>}
                            {user.isWidow && <Badge variant="outline" className="bg-pink-100 text-pink-800"><HeartHandshake className="mr-1 h-3 w-3" />Widow</Badge>}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                             <span>Joined On</span>
                             <span>{format(user.createdAt.toDate(), "dd MMM yyyy")}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/admin/user-management/${user.id}/edit`}>
                                <UserCog className="mr-2 h-3 w-3" /> Manage User
                            </Link>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
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


export default function BeneficiariesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BeneficiariesPageContent />
        </Suspense>
    )
}
