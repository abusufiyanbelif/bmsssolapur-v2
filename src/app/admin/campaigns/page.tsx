// src/app/admin/campaigns/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAllCampaigns, type Campaign } from "@/services/campaign-service";
import { getAllLeads, Lead } from "@/services/lead-service";
import { CampaignsClient } from "./campaigns-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// This is now a pure Server Component for fetching data.
async function CampaignsPageData() {
    try {
        const [campaigns, leads] = await Promise.all([
            getAllCampaigns(),
            getAllLeads()
        ]);
        
        // Serialize data before passing to Client Component
        return <CampaignsClient 
            initialCampaigns={JSON.parse(JSON.stringify(campaigns))} 
            initialLeads={JSON.parse(JSON.stringify(leads))}
        />;

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return <CampaignsClient initialCampaigns={[]} initialLeads={[]} error={error} />;
    }
}


export default function CampaignsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <CampaignsPageData />
        </Suspense>
    );
}
