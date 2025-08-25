

import { getDonation } from "@/services/donation-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/services/user-service";
import { getDonationActivity } from "@/services/activity-log-service";
import { LinkedLeads } from "../linked-leads";
import { AuditTrail } from "../audit-trail";
import { getAllLeads } from "@/services/lead-service";

export default async function EditDonationPage({ params }: { params: { id: string } }) {
    const donation = await getDonation(decodeURIComponent(params.id));

    if (!donation) {
        notFound();
    }
    
    // Fetch associated data
    const [donor, activityLogs, allLeads] = await Promise.all([
        getUser(donation.donorId),
        getDonationActivity(donation.id!),
        getAllLeads()
    ]);

    // In a real app, you would have a form here to edit the donation.
    // For now, we will just display the details.
    
    return (
        <div className="flex-1 space-y-6">
             <Link href="/admin/donations" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Donations
            </Link>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Placeholder for EditDonationForm */}
                    <pre className="p-4 bg-muted rounded-lg text-sm">
                        {JSON.stringify({donation, donor}, null, 2)}
                    </pre>
                    <LinkedLeads donation={donation} leads={allLeads} />
                </div>
                 <div className="lg:col-span-1">
                    <AuditTrail activityLogs={activityLogs} />
                 </div>
            </div>
        </div>
    );
}
