// src/app/admin/donations/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { getAllDonations, type Donation, type DonationStatus } from "@/services/donation-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, MoreHorizontal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const statusColors: Record<DonationStatus, string> = {
    "Pending verification": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Verified": "bg-green-500/20 text-green-700 border-green-500/30",
    "Failed/Incomplete": "bg-red-500/20 text-red-700 border-red-500/30",
    "Allocated": "bg-blue-500/20 text-blue-700 border-blue-500/30",
};

export default function DonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const handleFeatureInProgress = () => {
        toast({
            title: "In Progress",
            description: "This feature is currently in development and will be available soon.",
        });
    };

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                setLoading(true);
                const fetchedDonations = await getAllDonations();
                // Sort by most recent first
                fetchedDonations.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                setDonations(fetchedDonations);
                setError(null);
            } catch (e) {
                setError("Failed to fetch donations. Please try again later.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, []);

    const renderDesktopTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {donations.map((donation) => (
                    <TableRow key={donation.id}>
                        <TableCell>{format(donation.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <span>{donation.donorName}</span>
                                {donation.isAnonymous && (
                                    <Badge variant="secondary">Anonymous</Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>₹{donation.amount.toFixed(2)}</TableCell>
                        <TableCell>{donation.type}</TableCell>
                        <TableCell>{donation.purpose || 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("capitalize", statusColors[donation.status])}>
                                {donation.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {renderActions(donation)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderMobileCards = () => (
        <div className="space-y-4">
            {donations.map(donation => (
                <Card key={donation.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg">₹{donation.amount.toFixed(2)}</CardTitle>
                                <CardDescription>{donation.donorName}</CardDescription>
                            </div>
                             <Badge variant="outline" className={cn("capitalize", statusColors[donation.status])}>
                                {donation.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span>{format(donation.createdAt.toDate(), "dd MMM yyyy")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Category</span>
                            <span>{donation.type}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Purpose</span>
                            <span>{donation.purpose || 'N/A'}</span>
                        </div>
                        {donation.isAnonymous && <Badge variant="secondary">Anonymous</Badge>}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                       {renderActions(donation)}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
    
    const renderActions = (donation: Donation) => {
        if (donation.status === "Pending verification") {
            return <Button variant="outline" size="sm" onClick={handleFeatureInProgress}>Verify</Button>;
        }
        if (donation.status === "Verified") {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleFeatureInProgress}>Allocate to Lead</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleFeatureInProgress}>Split Donation</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
        return null;
    }


    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading donations...</p>
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

        if (donations.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No donations found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/donations/add">
                           <PlusCircle className="mr-2" />
                           Add First Donation
                        </Link>
                    </Button>
                </div>
            )
        }

        return isMobile ? renderMobileCards() : renderDesktopTable();
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Donation Management</h2>
            <Button asChild>
                <Link href="/admin/donations/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Donation
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Donations</CardTitle>
                <CardDescription>
                    View and manage all received donations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  )
}
