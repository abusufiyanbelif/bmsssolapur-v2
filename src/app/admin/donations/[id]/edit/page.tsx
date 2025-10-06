


import { getDonation } from "@/services/donation-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser, getAllUsers } from "@/services/user-service";
import { getDonationActivity } from "@/services/activity-log-service";
import { LinkedLeadsCard } from "../linked-leads-card";
import { AuditTrail } from "../audit-trail";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { AddDonationForm } from "@/app/admin/donations/add/add-donation-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings } from "@/services/app-settings-service";

export default async function EditDonationPage({ params }: { params: { id: string } }) {
    const donation = await getDonation(decodeURIComponent(params.id));

    if (!donation) {
        notFound();
    }
    
    // Fetch associated data
    const [donor, activityLogs, allLeads, allCampaigns, allUsers, settings] = await Promise.all([
        getUser(donation.donorId),
        getDonationActivity(donation.id!),
        getAllLeads(),
        getAllCampaigns(),
        getAllUsers(),
        getAppSettings(),
    ]);

    const linkableLeads = allLeads.filter(l => l.caseStatus !== 'Closed' && l.caseStatus !== 'Cancelled');
    const linkableCampaigns = allCampaigns.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled');
    const currentUser = allUsers.find(u => u.id === donor?.id);

    return (
        <div className="flex-1 space-y-6">
             <Link href="/admin/donations" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Donations
            </Link>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-primary">Edit Donation</CardTitle>
                            <CardDescription className="text-muted-foreground">Update the details for this donation record.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <AddDonationForm 
                                users={allUsers} 
                                leads={linkableLeads} 
                                campaigns={linkableCampaigns} 
                                existingDonation={donation}
                                currentUser={currentUser}
                                settings={settings}
                            />
                        </CardContent>
                    </Card>
                    <LinkedLeadsCard donation={donation} leads={allLeads} />
                </div>
                 <div className="lg:col-span-1">
                    <AuditTrail activityLogs={activityLogs} />
                 </div>
            </div>
        </div>
    );
}
