

import { getCampaign, getAllCampaigns } from "@/services/campaign-service";
import { notFound } from "next/navigation";
import { CampaignForm } from "./campaign-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeadsByCampaignId } from "@/services/lead-service";
import { getDonationsByCampaignId } from "@/services/donation-service";
import { getCampaignActivity } from "@/services/activity-log-service";
import { LinkedLeadsCard } from "./linked-leads-card";
import { LinkedDonationsCard } from "./linked-donations-card";
import { CampaignAuditTrail } from "./campaign-audit-trail";
import { Separator } from "@/components/ui/separator";

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
    const [campaign, allCampaigns, linkedLeads, linkedDonations, activityLogs] = await Promise.all([
        getCampaign(params.id),
        getAllCampaigns(),
        getLeadsByCampaignId(params.id),
        getDonationsByCampaignId(params.id),
        getCampaignActivity(params.id),
    ]);

    if (!campaign) {
        notFound();
    }
    
    // Calculate collected amount for the specific campaign
    const collectedAmount = linkedLeads.reduce((sum, lead) => sum + lead.helpGiven, 0);
    const campaignWithStats = { ...campaign, collectedAmount };

    const completedCampaigns = allCampaigns.filter(c => c.status === 'Completed' && c.id !== campaign.id);

    return (
        <div className="flex-1 space-y-6">
             <Link href="/admin/campaigns" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Campaigns
            </Link>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <CampaignForm campaign={campaignWithStats} completedCampaigns={completedCampaigns} />
                    <LinkedLeadsCard leads={linkedLeads} />
                    <LinkedDonationsCard donations={linkedDonations} />
                </div>
                 <div className="lg:col-span-1">
                    <CampaignAuditTrail activityLogs={activityLogs} />
                 </div>
            </div>
        </div>
    );
}
