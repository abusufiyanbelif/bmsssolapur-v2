
// src/app/home/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { HomeClient } from "./home-client";
import { getAppSettings, getCurrentOrganization } from "@/app/admin/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers } from "@/services/user-service";
import { getPublicCampaigns, getQuotes } from "./actions";
import type { Quote } from "@/services/types";

// This is now a true Server Component that fetches all data.
async function HomePageData() {
    try {
        let quotes: Quote[];
        const [
            settings,
            allDonations,
            allLeads,
            allUsers,
            allCampaigns,
        ] = await Promise.all([
            getAppSettings(),
            getAllDonations(),
            getAllLeads(),
            getAllUsers(),
            getPublicCampaigns(),
        ]);
        
        try {
            // Isolate the potentially failing call
            quotes = await getQuotes(3);
        } catch (error) {
            console.error("Critical Error: getQuotes() failed in /home/page.tsx. Using fallback.", error);
            // Provide a hardcoded fallback to prevent the page from crashing.
            quotes = [
                { id: 'fb1', number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
            ];
        }


        // All data is serialized here before being passed to the client component.
        return (
            <HomeClient
                settings={JSON.parse(JSON.stringify(settings))}
                allDonations={JSON.parse(JSON.stringify(allDonations))}
                allLeads={JSON.parse(JSON.stringify(allLeads))}
                allUsers={JSON.parse(JSON.stringify(allUsers))}
                allCampaigns={JSON.parse(JSON.stringify(allCampaigns))}
                quotes={JSON.parse(JSON.stringify(quotes))}
            />
        );
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
