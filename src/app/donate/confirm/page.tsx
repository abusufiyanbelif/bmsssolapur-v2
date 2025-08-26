

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddDonationForm } from "@/app/admin/donations/add/add-donation-form";
import { getAllUsers } from "@/services/user-service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";

async function ConfirmDonationPageContent() {
    const [users, leads, campaigns] = await Promise.all([
        getAllUsers(),
        getAllLeads(),
        getAllCampaigns(),
    ]);

    const linkableLeads = leads.filter(l => l.status !== 'Closed' && l.status !== 'Cancelled');
    const linkableCampaigns = campaigns.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled');

    // This component will be client-side rendered because AddDonationForm uses client hooks
    // but the data fetching can happen on the server.
    return <AddDonationForm users={users} leads={linkableLeads} campaigns={linkableCampaigns} />;
}


export default async function ConfirmDonationPage() {
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/donate" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Donation Options
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>Confirm Donation Details</CardTitle>
                    <CardDescription>
                        Please review the details extracted from your screenshot. Correct any inaccuracies before submitting.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Loading form...</div>}>
                        <ConfirmDonationPageContent />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
