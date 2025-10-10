// src/app/home/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { HomeClient } from "./home-client";
import { getAppSettings } from "@/app/admin/settings/actions";
import { getQuotes } from "@/app/home/actions";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers } from "@/services/user-service";
import { getPublicCampaigns } from "@/app/home/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

async function HomePageData() {
    try {
        const [
            settings,
            quotes,
            allDonations,
            allLeads,
            allUsers,
            allCampaigns,
        ] = await Promise.all([
            getAppSettings(),
            getQuotes(3),
            getAllDonations(),
            getAllLeads(),
            getAllUsers(),
            getPublicCampaigns(),
        ]);
        
        // Pass all fetched data to the client component
        return <HomeClient 
            settings={JSON.parse(JSON.stringify(settings))} 
            quotes={JSON.parse(JSON.stringify(quotes))}
            allDonations={JSON.parse(JSON.stringify(allDonations))}
            allLeads={JSON.parse(JSON.stringify(allLeads))}
            allUsers={JSON.parse(JSON.stringify(allUsers))}
            allCampaigns={JSON.parse(JSON.stringify(allCampaigns))}
        />;

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown server error occurred.";
         return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <HomePageData />
    </Suspense>
  );
}
