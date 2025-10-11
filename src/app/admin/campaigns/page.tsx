
// src/app/admin/campaigns/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAllCampaigns, type Campaign } from "@/services/campaign-service";
import { getAllLeads, Lead } from "@/services/lead-service";
import { CampaignsClient } from "./campaigns-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Campaigns</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
}


export default function CampaignsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <CampaignsPageData />
        </Suspense>
    );
}
