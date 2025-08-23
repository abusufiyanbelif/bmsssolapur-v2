

import { getDonation } from "@/services/donation-service";
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
    const campaign = await getDonation(decodeURIComponent(params.id));

    if (!campaign) {
        notFound();
    }
    
    const [linkedLeads, linkedDonations, activityLogs] = await Promise.all([
        [], // getLeadsByCampaignId(params.id),
        [], // getDonationsByCampaignId(params.id),
        [], // getCampaignActivity(params.id),
    ]);

    
    return (
        <div className="flex-1 space-y-6">
             <Link href="/admin/donations" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Donations
            </Link>
            
            <pre>{JSON.stringify(campaign, null, 2)}</pre>
            
        </div>
    );
}
