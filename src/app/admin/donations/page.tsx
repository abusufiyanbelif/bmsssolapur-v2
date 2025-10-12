// src/app/admin/donations/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DonationsPageClient } from "./donations-client";
import { getAllDonations } from "@/services/donation-service";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { getCurrentOrganization } from "@/services/organization-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

async function DonationsPageData() {
    try {
        const [donations, users, leads, campaigns, organization] = await Promise.all([
            getAllDonations(),
            getAllUsers(),
            getAllLeads(),
            getAllCampaigns(),
            getCurrentOrganization(),
        ]);
        
        // Serialize data before passing to Client Component
        return <DonationsPageClient 
            initialDonations={JSON.parse(JSON.stringify(donations))}
            initialUsers={JSON.parse(JSON.stringify(users))}
            initialLeads={JSON.parse(JSON.stringify(leads))}
            initialCampaigns={JSON.parse(JSON.stringify(campaigns))}
            organization={JSON.parse(JSON.stringify(organization))}
        />;

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return <DonationsPageClient initialDonations={[]} initialUsers={[]} initialLeads={[]} initialCampaigns={[]} organization={null} error={error} />
    }
}


export default function DonationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <DonationsPageData />
        </Suspense>
    );
}
