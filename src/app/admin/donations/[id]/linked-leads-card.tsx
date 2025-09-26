

'use client';

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowRight, FileText, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Donation, Lead } from "@/services/types";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { handleRemoveAllocation } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


interface LinkedLeadsCardProps {
    donation: Donation;
    leads: Lead[];
}

export function LinkedLeadsCard({ donation, leads }: LinkedLeadsCardProps) {
    const allocations = donation.allocations || [];
    const leadsById = new Map(leads.map(lead => [lead.id, lead]));
    const { toast } = useToast();
    const router = useRouter();

    const onAllocationDeleted = () => {
        toast({
            title: "Allocation Removed",
            description: "The allocation has been successfully removed from this donation.",
            variant: "success",
        });
        router.refresh();
    }

    if (allocations.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText />
                        Linked Leads & Allocations
                    </CardTitle>
                    <CardDescription>
                        This donation has not yet been allocated to any specific help cases.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">No allocations found.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText />
                    Linked Leads & Allocations ({allocations.length})
                </CardTitle>
                <CardDescription>
                    This donation has been allocated to the following help cases. You can remove an allocation if the funds have not yet been transferred.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Allocated To</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allocations.map((alloc, i) => {
                            const lead = leadsById.get(alloc.leadId);
                            const hasTransfers = (lead?.fundTransfers || []).length > 0;
                            const adminUserId = localStorage.getItem('userId') || '';
                            
                            return (
                                <TableRow key={alloc.leadId + i}>
                                    <TableCell>
                                        <p className="font-medium">{lead?.name || 'N/A'}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{alloc.leadId}</p>
                                    </TableCell>
                                    <TableCell className="font-semibold">₹{alloc.amount.toLocaleString()}</TableCell>
                                    <TableCell>{format(alloc.allocatedAt, "dd MMM yyyy, p")}</TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={`/admin/leads/${alloc.leadId}`}>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                         <DeleteConfirmationDialog
                                            itemType="allocation"
                                            itemName={`of ₹${alloc.amount} to ${lead?.name}`}
                                            onDelete={() => handleRemoveAllocation(donation.id!, alloc.leadId, alloc.amount, alloc.allocatedAt, adminUserId)}
                                            onSuccess={onAllocationDeleted}
                                        >
                                            <Button variant="ghost" size="icon" disabled={hasTransfers}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </DeleteConfirmationDialog>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
