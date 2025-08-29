

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "./campaign-form";
import { getAllLeads } from "@/services/lead-service";
import { getAllDonations } from "@/services/donation-service";

export default async function AddCampaignPage() {
    const [allLeads, allDonations] = await Promise.all([
        getAllLeads(),
        getAllDonations(),
    ]);

    // Filter for leads that can be assigned to a campaign
    const assignableLeads = allLeads.filter(lead => 
        (lead.caseAction === 'Ready For Help' || lead.caseStatus === 'Pending') && !lead.campaignId
    );

    // Filter for donations that can be assigned
    const assignableDonations = allDonations.filter(donation => 
        donation.status === 'Verified' && !donation.campaignId
    );


    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New Campaign</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>
                        Fill in the form below to create a new fundraising campaign.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CampaignForm leads={assignableLeads} donations={assignableDonations} />
                </CardContent>
            </Card>
        </div>
    );
}
