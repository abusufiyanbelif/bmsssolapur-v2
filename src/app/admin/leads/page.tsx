// src/app/admin/leads/page.tsx
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
import { getAllLeads, type Lead, type LeadStatus } from "@/services/lead-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusColors: Record<LeadStatus, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                setLoading(true);
                const fetchedLeads = await getAllLeads();
                // Sort by most recent first
                fetchedLeads.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                setLeads(fetchedLeads);
                setError(null);
            } catch (e) {
                setError("Failed to fetch leads. Please try again later.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading leads...</p>
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

        if (leads.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No leads found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/leads/add">
                           <PlusCircle className="mr-2" />
                           Add First Lead
                        </Link>
                    </Button>
                </div>
            )
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date Helped</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Help Requested</TableHead>
                        <TableHead>Help Given</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell>{format(lead.dateHelped.toDate(), "dd MMM yyyy")}</TableCell>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell>{lead.category}</TableCell>
                            <TableCell>₹{lead.helpRequested.toFixed(2)}</TableCell>
                            <TableCell>₹{lead.helpGiven.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
                                    {lead.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm">View/Edit</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Leads Management</h2>
            <Button asChild>
                <Link href="/admin/leads/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Lead
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>
                    View and manage all help cases and their status.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  )
}
