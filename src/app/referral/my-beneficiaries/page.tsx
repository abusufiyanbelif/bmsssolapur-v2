

// src/app/referral/my-beneficiaries/page.tsx
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
import { getReferredBeneficiaries } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, UserCog, ChevronLeft, ChevronRight, FilterX, Search, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type StatusFilter = 'all' | 'active' | 'inactive';

export default function MyBeneficiariesPage() {
    const [beneficiaries, setBeneficiaries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filter and pagination states
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    useEffect(() => {
        const fetchBeneficiaries = async () => {
            const referrerId = localStorage.getItem('userId');
            if (!referrerId) {
                setError("Could not identify referral user. Please log in again.");
                setLoading(false);
                return;
            }
            try {
                const fetchedBeneficiaries = await getReferredBeneficiaries(referrerId);
                setBeneficiaries(fetchedBeneficiaries);
            } catch (e) {
                setError("Failed to fetch your referred beneficiaries.");
            } finally {
                setLoading(false);
            }
        };

        fetchBeneficiaries();
    }, []);

    const filteredBeneficiaries = useMemo(() => {
        return beneficiaries.filter(user => {
            const nameMatch = nameFilter === '' || user.name.toLowerCase().includes(nameFilter.toLowerCase());
            const statusMatch = statusFilter === 'all' || (statusFilter === 'active' && user.isActive) || (statusFilter === 'inactive' && !user.isActive);
            return nameMatch && statusMatch;
        });
    }, [beneficiaries, nameFilter, statusFilter]);

    const paginatedBeneficiaries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredBeneficiaries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredBeneficiaries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredBeneficiaries.length / itemsPerPage);

    const renderContent = () => {
        if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
        if (beneficiaries.length === 0) return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">You haven&apos;t referred any beneficiaries yet.</p>
                <Button asChild className="mt-4"><Link href="/referral/add-beneficiary">Add First Beneficiary</Link></Button>
            </div>
        );
        if (paginatedBeneficiaries.length === 0) return (
            <div className="text-center py-10"><p className="text-muted-foreground">No beneficiaries match your filters.</p></div>
        );

        return renderTable();
    };

    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referred On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedBeneficiaries.map(user => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                            <Badge variant={user.isActive ? 'default' : 'outline'} className={user.isActive ? "bg-green-100 text-green-800" : ""}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                        </TableCell>
                        <TableCell>{format(user.createdAt, "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-right">
                             <Button asChild variant="outline" size="sm">
                                <Link href={`/referral/my-beneficiaries/${user.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

     const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedBeneficiaries.length} of {filteredBeneficiaries.length} users.
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

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">My Referrals</h2>
                <Button asChild>
                    <Link href="/admin/user-management/add?role=Beneficiary">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Beneficiary
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Referred Beneficiaries</CardTitle>
                    <CardDescription className="text-muted-foreground">A list of all beneficiaries you have referred to the organization.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-2">
                            <Label htmlFor="nameFilter">Search by Name</Label>
                            <Input id="nameFilter" placeholder="Filter by name..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="statusFilter">Status</Label>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                                <SelectTrigger id="statusFilter">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {renderContent()}
                    {totalPages > 1 && renderPaginationControls()}
                </CardContent>
            </Card>
        </div>
    );
}

    