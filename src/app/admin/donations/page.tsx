
// src/app/admin/donations/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DonationsPageClient } from "./donations-client";
import { getAllDonations } from "@/services/donation-service";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { getCurrentOrganization } from "@/services/organization-service";

async function DonationsPageData() {
    // Fetch all data on the server
    const [donations, users, leads, campaigns, organization] = await Promise.all([
        getAllDonations(),
        getAllUsers(),
        getAllLeads(),
        getAllCampaigns(),
        getCurrentOrganization(),
    ]);

    // Serialize all data with timestamps before passing to the client.
    return <DonationsPageClient 
        initialDonations={JSON.parse(JSON.stringify(donations))}
        initialUsers={JSON.parse(JSON.stringify(users))}
        initialLeads={JSON.parse(JSON.stringify(leads))}
        initialCampaigns={JSON.parse(JSON.stringify(campaigns))}
        organization={JSON.parse(JSON.stringify(organization))}
    />;
}


export default function DonationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <DonationsPageData />
        </Suspense>
    );
}
