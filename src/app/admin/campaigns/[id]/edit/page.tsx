

import { getCampaign, getAllCampaigns } from "@/services/campaign-service";
import { notFound } from "next/navigation";
import { CampaignForm } from "./campaign-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllLeads, getLeadsByCampaignId } from "@/services/lead-service";
import { getAllDonations, getDonationsByCampaignId } from "@/services/donation-service";
import { getCampaignActivity } from "@/services/activity-log-service";
import { LinkedLeadsCard } from "./linked-leads-card";
import { LinkedDonationsCard } from "./linked-donations-card";
import { CampaignAuditTrail } from "./campaign-audit-trail";
import { Separator } from "@/components/ui/separator";
import { getAllUsers } from "@/services/user-service";

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
    const [campaign, allCampaigns, allLeads, allUsers, allDonations, activityLogs] = await Promise.all([
        getCampaign(params.id),
        getAllCampaigns(),
        getAllLeads(),
        getAllUsers(),
        getDonationsByCampaignId(params.id),
        getCampaignActivity(params.id),
    ]);

    if (!campaign) {
        notFound();
    }
    
    // Calculate collected amount for the specific campaign
    const collectedAmount = allDonations.filter(d => d.status === 'Verified' || d.status === 'Allocated').reduce((sum, d) => sum + d.amount, 0);
    const campaignWithStats = { ...campaign, collectedAmount };

    const completedCampaigns = allCampaigns.filter(c => c.status === 'Completed' && c.id !== campaign.id);
    
    const unassignedLeads = allLeads.filter(l => !l.campaignId || l.campaignId === campaign.id);
    const beneficiaryUsers = allUsers.filter(u => u.roles.includes('Beneficiary'));

    return (
        <div className="flex-1 space-y-6">
             <Link href="/admin/campaigns" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Campaigns
            </Link>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <CampaignForm 
                        campaign={campaignWithStats} 
                        completedCampaigns={completedCampaigns} 
                        unassignedLeads={unassignedLeads}
                        beneficiaryUsers={beneficiaryUsers}
                    />
                    <LinkedLeadsCard leads={allLeads.filter(l => l.campaignId === campaign.id)} />
                    <LinkedDonationsCard donations={allDonations} />
                </div>
                 <div className="lg:col-span-1">
                    <CampaignAuditTrail activityLogs={activityLogs} />
                 </div>
            </div>
        </div>
    );
}
