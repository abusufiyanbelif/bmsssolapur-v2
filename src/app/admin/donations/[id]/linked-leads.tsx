
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HandHeart, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Donation, Lead } from "@/services/types";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LinkedLeadsProps {
    donation: Donation;
    leads: Lead[];
}

export function LinkedLeads({ donation, leads }: LinkedLeadsProps) {
    const allocations = donation.allocations || [];
    const leadsById = new Map(leads.map(lead => [lead.id, lead]));

    if (allocations.length === 0) {
        return null; // Don't render the card if there are no allocations
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HandHeart />
                    Linked Leads & Allocations
                </CardTitle>
                <CardDescription>
                    This donation has been allocated to the following help cases.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Allocated To</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Allocated By</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">View Lead</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allocations.map((alloc, i) => {
                            const lead = leadsById.get(alloc.leadId);
                            return (
                                <TableRow key={alloc.leadId + i}>
                                    <TableCell>
                                        <p className="font-medium">{lead?.name || 'N/A'}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{alloc.leadId}</p>
                                    </TableCell>
                                    <TableCell className="font-semibold">₹{alloc.amount.toLocaleString()}</TableCell>
                                    <TableCell>{alloc.allocatedByUserName}</TableCell>
                                    <TableCell>{format(alloc.allocatedAt as Date, "dd MMM yyyy, p")}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/admin/leads/${alloc.leadId}`}>
                                                View <ArrowRight className="ml-2 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

