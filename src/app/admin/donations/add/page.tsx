


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddDonationForm } from "./add-donation-form";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAppSettings } from "@/services/app-settings-service";

export default async function AddDonationPage() {
    const [users, leads, campaigns, settings] = await Promise.all([
        getAllUsers(),
        getAllLeads(),
        getAllCampaigns(),
        getAppSettings(),
    ]);

    // Filter for leads that can be assigned to a campaign
    const linkableLeads = leads.filter(l => 
        l.caseStatus !== 'Closed' && l.caseStatus !== 'Cancelled'
    );

    // Filter for donations that can be assigned
    const linkableCampaigns = campaigns.filter(c => 
        c.status !== 'Completed' && c.status !== 'Cancelled'
    );
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/donations" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Donations
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Add Donation Manually</CardTitle>
                    <CardDescription className="text-muted-foreground">
                       Upload a payment proof to auto-fill details, or enter them manually below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddDonationForm 
                        users={users} 
                        leads={linkableLeads} 
                        campaigns={linkableCampaigns}
                        settings={settings}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
