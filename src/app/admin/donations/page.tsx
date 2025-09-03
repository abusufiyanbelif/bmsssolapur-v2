
// src/app/admin/donations/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAllDonations } from "@/services/donation-service";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { DonationsPageClient } from "./donations-client";


// This is now a Server Component responsible for data fetching.
export default async function DonationsPage() {
    
    // Fetch all data on the server
    const [initialDonations, initialUsers, initialLeads, initialCampaigns] = await Promise.all([
        getAllDonations(),
        getAllUsers(),
        getAllLeads(),
        getAllCampaigns()
    ]);

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <DonationsPageClient 
                initialDonations={initialDonations}
                initialUsers={initialUsers}
                initialLeads={initialLeads}
                initialCampaigns={initialCampaigns}
            />
        </Suspense>
    );
}
