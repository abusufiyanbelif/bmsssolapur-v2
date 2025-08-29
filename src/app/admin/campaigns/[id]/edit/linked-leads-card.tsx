
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { Lead } from "@/services/types";

interface LinkedLeadsCardProps {
    leads: Lead[];
}

export function LinkedLeadsCard({ leads }: LinkedLeadsCardProps) {
    if (!leads || leads.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText />
                    Linked Leads ({leads.length})
                </CardTitle>
                <CardDescription>All help requests that are associated with this campaign.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Beneficiary</TableHead>
                            <TableHead>Amount Requested</TableHead>
                            <TableHead>Amount Given</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">View</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map(lead => (
                            <TableRow key={lead.id}>
                                <TableCell>
                                    <p className="font-medium">{lead.name}</p>
                                    <p className="text-xs text-muted-foreground">{lead.purpose} - {lead.category}</p>
                                </TableCell>
                                <TableCell>₹{lead.helpRequested.toLocaleString()}</TableCell>
                                <TableCell className="font-semibold">₹{lead.helpGiven.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={lead.caseStatus === 'Closed' ? 'default' : 'outline'}>{lead.caseStatus}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`/admin/leads/${lead.id}`}>
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
