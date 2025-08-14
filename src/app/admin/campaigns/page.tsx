// src/app/admin/campaigns/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllCampaigns, type Campaign, type CampaignStatus, deleteCampaign } from "@/services/campaign-service";
import { getAllLeads, Lead } from "@/services/lead-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, MoreHorizontal, Edit, Trash2, Megaphone, Users, ListChecks, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<CampaignStatus, string> = {
    "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Active": "bg-green-500/20 text-green-700 border-green-500/30",
    "Completed": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Cancelled": "bg-red-500/20 text-red-700 border-red-500/30",
};

interface CampaignWithStats extends Campaign {
    leadCount: number;
    beneficiaryCount: number;
    statusCounts: {
        Pending: number;
        Partial: number;
        Closed: number;
    };
    raisedAmount: number;
    fundingProgress: number;
}

function CampaignsPageContent() {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status') as CampaignStatus | null;

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedCampaigns, fetchedLeads] = await Promise.all([
                getAllCampaigns(),
                getAllLeads()
            ]);
            setCampaigns(fetchedCampaigns);
            setLeads(fetchedLeads);
            setError(null);
        } catch (e) {
            setError("Failed to fetch campaign data. Please try again later.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const campaignsWithStats: CampaignWithStats[] = useMemo(() => {
        return campaigns.map(campaign => {
            const linkedLeads = leads.filter(lead => lead.campaignId === campaign.id);
            const statusCounts = linkedLeads.reduce((acc, lead) => {
                acc[lead.status] = (acc[lead.status] || 0) + 1;
                return acc;
            }, { Pending: 0, Partial: 0, Closed: 0 });

            const raisedAmount = linkedLeads.reduce((sum, lead) => sum + lead.helpGiven, 0);
            const fundingProgress = campaign.goal > 0 ? (raisedAmount / campaign.goal) * 100 : 0;
            const beneficiaryCount = new Set(linkedLeads.map(l => l.beneficiaryId)).size;

            return {
                ...campaign,
                leadCount: linkedLeads.length,
                beneficiaryCount,
                statusCounts,
                raisedAmount,
                fundingProgress
            };
        });
    }, [campaigns, leads]);
    
    const onCampaignDeleted = () => {
        toast({
            title: "Campaign Deleted",
            description: "The campaign has been successfully removed.",
        });
        fetchData();
    };

    const renderActions = (campaign: Campaign) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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

    const filteredCampaigns = useMemo(() => {
        if (!statusFromUrl) return campaignsWithStats;
        return campaignsWithStats.filter(c => c.status === statusFromUrl);
    }, [campaignsWithStats, statusFromUrl]);


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
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="flex flex-col h-full hover:shadow-lg transition-shadow rounded-lg">
                        <Link href={`/admin/campaigns/${campaign.id}/edit`} className="block flex flex-col h-full">
                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                                        <CardDescription>{format(campaign.startDate, "dd MMM yyyy")} - {format(campaign.endDate, "dd MMM yyyy")}</CardDescription>
                                    </div>
                                    <Badge variant="outline" className={cn("capitalize flex-shrink-0", statusColors[campaign.status])}>
                                        {campaign.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-grow">
                                <div>
                                    <div className="text-xs text-muted-foreground flex justify-between mb-1">
                                        <span>
                                            Raised: <span className="font-semibold text-foreground">₹{campaign.raisedAmount.toLocaleString()}</span>
                                        </span>
                                        <span>
                                            Goal: ₹{campaign.goal.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress value={campaign.fundingProgress} />
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
                                    <div>
                                        <p className="font-bold text-lg">{campaign.leadCount}</p>
                                        <p className="text-xs text-muted-foreground">Linked Leads</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{campaign.beneficiaryCount}</p>
                                        <p className="text-xs text-muted-foreground">Beneficiaries</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-green-600">{campaign.statusCounts.Closed || 0}</p>
                                        <p className="text-xs text-muted-foreground">Cases Closed</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center bg-muted/50 p-4 mt-auto">
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-yellow-600">{campaign.statusCounts.Pending || 0}</span> Pending, <span className="font-semibold text-blue-600">{campaign.statusCounts.Partial || 0}</span> Partial
                                </div>
                                <div onClick={(e) => e.preventDefault()}>
                                    {renderActions(campaign)}
                                </div>
                            </CardFooter>
                        </Link>
                    </Card>
                ))}
            </div>
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

export default function CampaignsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CampaignsPageContent />
        </Suspense>
    )
}
