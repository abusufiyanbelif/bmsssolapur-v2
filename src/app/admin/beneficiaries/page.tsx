
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
import { Loader2, AlertCircle, PlusCircle, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BeneficiariesPage() {
    const [beneficiaries, setBeneficiaries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();

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
                const beneficiaryUsers = allUsers
                    .filter(u => u.roles.includes('Beneficiary'))
                    .sort((a, b) => a.name.localeCompare(b.name));
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
    
    const paginatedBeneficiaries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return beneficiaries.slice(startIndex, startIndex + itemsPerPage);
    }, [beneficiaries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(beneficiaries.length / itemsPerPage);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

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
                Showing {paginatedBeneficiaries.length} of {beneficiaries.length} beneficiaries.
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
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  )
}
