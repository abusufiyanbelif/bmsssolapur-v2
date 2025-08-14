
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowRight, HandHeart } from "lucide-react";
import Link from "next/link";
import { Donation } from "@/services/types";

interface LinkedDonationsCardProps {
    donations: Donation[];
}

export function LinkedDonationsCard({ donations }: LinkedDonationsCardProps) {
    if (!donations || donations.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HandHeart />
                    Linked Donations ({donations.length})
                </CardTitle>
                <CardDescription>All donations specifically made towards this campaign.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Donor</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">View</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {donations.map(donation => (
                            <TableRow key={donation.id}>
                                <TableCell>
                                    <p className="font-medium">{donation.donorName}</p>
                                    <p className="text-xs text-muted-foreground">{donation.type}</p>
                                </TableCell>
                                <TableCell className="font-semibold">₹{donation.amount.toLocaleString()}</TableCell>
                                <TableCell>{format(donation.donationDate as Date, "dd MMM yyyy")}</TableCell>
                                <TableCell>
                                    <Badge variant={donation.status === 'Verified' ? 'default' : 'outline'}>{donation.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`/admin/donations/${donation.id}/edit`}>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
