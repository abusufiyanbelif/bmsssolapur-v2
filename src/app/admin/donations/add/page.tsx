

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddDonationForm } from "./add-donation-form";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AddDonationPage() {
    const [users, leads, campaigns] = await Promise.all([
        getAllUsers(),
        getAllLeads(),
        getAllCampaigns(),
    ]);

    const linkableLeads = leads.filter(l => l.status !== 'Closed' && l.status !== 'Cancelled');
    const linkableCampaigns = campaigns.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled');
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/donations" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Donations
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>Add Donation Manually</CardTitle>
                    <CardDescription>
                       Upload a payment proof to auto-fill details, or enter them manually below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddDonationForm users={users} leads={linkableLeads} campaigns={linkableCampaigns} />
                </CardContent>
            </Card>
        </div>
    );
}
