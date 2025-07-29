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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { getAllDonations, type Donation, type DonationStatus } from "@/services/donation-service";
import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
                </div>
            )
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Donor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {donations.map((donation) => (
                        <TableRow key={donation.id}>
                            <TableCell>{format(donation.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                            <TableCell className="font-medium">{donation.donorName}</TableCell>
                            <TableCell>${donation.amount.toFixed(2)}</TableCell>
                            <TableCell>{donation.type}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[donation.status])}>
                                    {donation.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {donation.status === "Pending verification" && (
                                     <Button variant="outline" size="sm">Verify</Button>
                                )}
                                {donation.status === "Verified" && (
                                    <Button variant="default" size="sm">Allocate Funds</Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

  return (
    <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Donation Management</h2>
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
