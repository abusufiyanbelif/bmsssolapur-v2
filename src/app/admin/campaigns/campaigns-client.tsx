
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Campaign, type CampaignStatus } from "@/services/campaign-service";
import { handleBulkDeleteCampaigns } from "./actions";
import { Lead } from "@/services/lead-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, MoreHorizontal, Edit, Trash2, Megaphone, Users, ListChecks, CheckCircle, Check, Share2, Info, TrendingUp, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";
import type { Quote } from "@/services/types";
import Image from "next/image";


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

interface CampaignsClientProps {
    initialCampaigns: Campaign[];
    initialLeads: Lead[];
    error?: string;
}


function CampaignsPageContent({ initialCampaigns, initialLeads, error: initialError }: CampaignsClientProps) {
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status') as CampaignStatus | null;

    const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
    const { toast } = useToast();
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
    const isMobile = useIsMobile();


    const fetchData = async () => {
        try {
            setLoading(true);
            const { getAllCampaigns } = await import('@/services/campaign-service');
            const { getAllLeads } = await import('@/services/lead-service');
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
        // Data is passed as props, so no initial fetch needed
        setLoading(false);
    }, []);


    const campaignsWithStats: CampaignWithStats[] = useMemo(() => {
        return campaigns.map(campaign => {
            const linkedLeads = leads.filter(lead => lead.campaignId === campaign.id);
            const statusCounts = linkedLeads.reduce((acc, lead) => {
                const status = lead.caseStatus;
                if (status === 'Pending' || status === 'Partial' || status === 'Closed') {
                    acc[status] = (acc[status] || 0) + 1;
                }
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
    
    const onCampaignDeleted = (campaignId?: string) => {
        const campaignName = campaigns.find(c => c.id === campaignId)?.name || "The campaign";
        toast({
            title: "Campaign Deleted",
            description: `${campaignName} has been successfully removed.`,
        });
        setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
        fetchData();
    };

    const onBulkCampaignsDeleted = () => {
         toast({
            title: "Campaigns Deleted",
            description: `${selectedCampaigns.length} campaign(s) have been successfully removed.`,
        });
        setSelectedCampaigns([]);
        fetchData();
    }
    
     const handleShare = async (campaign: CampaignWithStats) => {
        const campaignUrl = `${window.location.origin}/campaigns`;
        let message = `*Support Our Campaign: ${campaign.name}*\n\nWe are raising ₹${campaign.goal.toLocaleString()} to ${campaign.description.toLowerCase()}\n\n*Progress:*-\nRaised: ₹${campaign.raisedAmount.toLocaleString()}\n- Beneficiaries Helped: ${campaign.beneficiaryCount}\n\nPlease contribute and share this message. Every bit helps!\n\nView details here:\n${campaignUrl}`;
        
        try {
            const quotes = await getInspirationalQuotes(1);
            if (quotes.length > 0) {
                const quoteText = `_"${quotes[0].text}"_\n- ${quotes[0].source}\n\n`;
                message = quoteText + message;
            }
        } catch (e) {
            console.error("Could not fetch quote for campaign share", e);
        }

        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const renderActions = (campaign: CampaignWithStats) => (
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
                 <DropdownMenuItem onClick={() => handleShare(campaign)}>
                    <Share2 className="mr-2 h-4 w-4" /> Share on WhatsApp
                </DropdownMenuItem>
                <DeleteConfirmationDialog
                    itemType="campaign"
                    itemName={campaign.name}
                    onDelete={() => handleBulkDeleteCampaigns([campaign.id!])}
                    onSuccess={() => onCampaignDeleted(campaign.id)}
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
            <>
            {selectedCampaigns.length > 0 && (
                <div className="flex items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">
                        {selectedCampaigns.length} item(s) selected.
                    </p>
                    {isMobile && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (selectedCampaigns.length === filteredCampaigns.length) {
                                    setSelectedCampaigns([]);
                                } else {
                                    setSelectedCampaigns(filteredCampaigns.map(c => c.id!));
                                }
                            }}
                        >
                            <Check className="mr-2 h-4 w-4"/>
                            {selectedCampaigns.length === filteredCampaigns.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    )}
                     <DeleteConfirmationDialog
                        itemType={`${selectedCampaigns.length} campaign(s)`}
                        itemName="the selected items"
                        onDelete={() => handleBulkDeleteCampaigns(selectedCampaigns)}
                        onSuccess={onBulkCampaignsDeleted}
                    >
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected
                        </Button>
                    </DeleteConfirmationDialog>
                </div>
            )}
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign) => {
                     const isOverfunded = campaign.fundingProgress > 100;
                     const isUnfunded = campaign.raisedAmount === 0 && campaign.status !== 'Upcoming';
                     return (
                        <Card key={campaign.id} className={cn("flex flex-col h-full hover:shadow-lg transition-shadow rounded-lg overflow-hidden", selectedCampaigns.includes(campaign.id!) && "ring-2 ring-primary")}>
                            <div className="relative">
                               {campaign.imageUrl ? (
                                    <Image src={campaign.imageUrl} alt={campaign.name} width={400} height={200} className="w-full h-40 object-cover" />
                               ) : (
                                    <div className="h-40 bg-muted/50 flex items-center justify-center">
                                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                    </div>
                               )}
                                <div className="absolute top-2 right-2 flex items-center gap-2">
                                     <Badge variant="outline" className={cn("capitalize backdrop-blur-sm", statusColors[campaign.status])}>
                                        {campaign.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <Link href={`/admin/campaigns/${campaign.id}/edit`} className="block flex-grow">
                                    <CardHeader className="p-0">
                                        <CardTitle className="text-lg text-primary">{campaign.name}</CardTitle>
                                        <CardDescription>{format(campaign.startDate as Date, "dd MMM yyyy")} - {format(campaign.endDate as Date, "dd MMM yyyy")}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 flex-grow p-0 pt-4">
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
                                            {(isOverfunded || isUnfunded) && (
                                                <div className="flex items-center gap-2 mt-2">
                                                     <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                {isOverfunded && <TrendingUp className="h-4 w-4 text-green-600" />}
                                                                {isUnfunded && <Info className="h-4 w-4 text-amber-600" />}
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {isOverfunded && <p>This campaign is overfunded!</p>}
                                                                {isUnfunded && <p>This active campaign has not received funds yet.</p>}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
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
                                </Link>
                                <CardFooter className="flex justify-between items-center bg-muted/50 p-4 -mx-4 -mb-4 mt-4">
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-semibold text-yellow-600">{campaign.statusCounts.Pending || 0}</span> Pending, <span className="font-semibold text-blue-600">{campaign.statusCounts.Partial || 0}</span> Partial
                                    </div>
                                     <div className="flex-shrink-0">
                                        {renderActions(campaign)}
                                    </div>
                                </CardFooter>
                            </div>
                        </Card>
                    );
                })}
            </div>
            </>
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
                <CardTitle className="flex items-center gap-2 text-primary">
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

export function CampaignsClient(props: CampaignsClientProps) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CampaignsPageContent {...props} />
        </Suspense>
    )
}
