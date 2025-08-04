// src/app/admin/campaigns/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllCampaigns, type Campaign, type CampaignStatus, deleteCampaign } from "@/services/campaign-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, MoreHorizontal, Edit, Trash2, Megaphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Progress } from "@/components/ui/progress";

const statusColors: Record<CampaignStatus, string> = {
    "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Active": "bg-green-500/20 text-green-700 border-green-500/30",
    "Completed": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Cancelled": "bg-red-500/20 text-red-700 border-red-500/30",
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const fetchedCampaigns = await getAllCampaigns();
            setCampaigns(fetchedCampaigns);
            setError(null);
        } catch (e) {
            setError("Failed to fetch campaigns. Please try again later.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);
    
    const onCampaignDeleted = () => {
        toast({
            title: "Campaign Deleted",
            description: "The campaign has been successfully removed.",
        });
        fetchCampaigns();
    };

    const renderActions = (campaign: Campaign) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Link>
                </DropdownMenuItem>
                <DeleteConfirmationDialog
                    itemType="campaign"
                    itemName={campaign.name}
                    onDelete={() => deleteCampaign(campaign.id!)}
                    onSuccess={onCampaignDeleted}
                >
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DeleteConfirmationDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading campaigns...</p>
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

        if (campaigns.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No campaigns found.</p>
                     <Button asChild className="mt-4">
                        <Link href="/admin/campaigns/add">
                           <PlusCircle className="mr-2" />
                           Add First Campaign
                        </Link>
                    </Button>
                </div>
            );
        }
        
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead className="w-[25%]">Funding Goal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.map((campaign) => {
                        const raisedAmount = campaign.status === 'Completed' ? campaign.goal : campaign.goal / 2; // Placeholder logic
                        const progress = campaign.goal > 0 ? (raisedAmount / campaign.goal) * 100 : 0;
                        return(
                            <TableRow key={campaign.id}>
                                <TableCell>
                                    <div className="font-medium">{campaign.name}</div>
                                    <div className="text-sm text-muted-foreground">{campaign.description.substring(0, 50)}...</div>
                                </TableCell>
                                <TableCell>
                                    {format(campaign.startDate.toDate(), "dd MMM yyyy")} - {format(campaign.endDate.toDate(), "dd MMM yyyy")}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <Progress value={progress} />
                                        <div className="text-xs text-muted-foreground flex justify-between">
                                            <span>
                                                Raised: <span className="font-semibold text-foreground">₹{raisedAmount.toLocaleString()}</span>
                                            </span>
                                            <span>
                                                Goal: ₹{campaign.goal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("capitalize", statusColors[campaign.status])}>
                                        {campaign.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {renderActions(campaign)}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        );
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Campaign Management</h2>
            <Button asChild>
                <Link href="/admin/campaigns/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Campaign
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone />
                  All Campaigns
                </CardTitle>
                <CardDescription>
                    Create, view, and manage all fundraising campaigns.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  );
}
