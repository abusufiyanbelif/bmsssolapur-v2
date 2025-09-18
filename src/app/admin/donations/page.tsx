
// src/app/admin/donations/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DonationsPageClient } from "./donations-client";
import { getAllDonations, Donation } from "@/services/donation-service";
import { getAllUsers, User } from "@/services/user-service";
import { getAllLeads, Lead } from "@/services/lead-service";
import { getAllCampaigns, Campaign } from "@/services/campaign-service";
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import type { Organization } from "@/services/types";

async function DonationsPageData() {
    try {
        const [donations, users, leads, campaigns, organization] = await Promise.all([
            getAllDonations(),
            getAllUsers(),
            getAllLeads(),
            getAllCampaigns(),
            getCurrentOrganization(),
        ]);
        
        return <DonationsPageClient 
            initialDonations={donations} 
            initialUsers={users}
            initialLeads={leads}
            initialCampaigns={campaigns}
            organization={organization}
        />

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return <DonationsPageClient 
            initialDonations={[]}
            initialUsers={[]}
            initialLeads={[]}
            initialCampaigns={[]}
            organization={null}
            error={error}
        />
    }
}


export default function DonationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <DonationsPageData />
        </Suspense>
    );
}
