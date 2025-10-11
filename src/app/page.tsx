
// src/app/page.tsx
import { Suspense } from "react";
import { PublicHomePage } from "./home/public-home-page";
import { Loader2 } from "lucide-react";
import { getOpenGeneralLeads, getPublicCampaigns, getPublicDashboardData, getQuotes } from "@/app/home/actions";
import type { Quote } from "@/services/types";

// This Server Component fetches all necessary data for the public homepage.
async function PublicHomePageLoader() {
  
  let quotes: Quote[];
  const [
    publicLeads, 
    publicCampaigns, 
    dashboardData, 
  ] = await Promise.all([
    getOpenGeneralLeads(),
    getPublicCampaigns(),
    getPublicDashboardData(),
  ]);

  try {
      // Isolate the potentially failing call
      quotes = await getQuotes(3);
  } catch (error) {
      console.error("Critical Error: getQuotes() failed in /page.tsx. Using fallback.", error);
      // Provide a hardcoded fallback to prevent the page from crashing.
      quotes = [
          { id: 'fb1', number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
      ];
  }

  return (
    <PublicHomePage
      publicLeads={publicLeads}
      publicCampaigns={publicCampaigns}
      allLeads={dashboardData.leads}
      allDonations={dashboardData.donations}
      allUsers={dashboardData.users}
      quotes={quotes}
      loading={false} // Data is now loaded on the server
    />
  );
}


// This is the public landing page.
// The AppShell handles redirecting logged-in users away from here to /home.
export default function Page() {
    return (
      <Suspense fallback={<div className="flex flex-col flex-1 items-center justify-center h-full"><Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" /><p className="mt-4 text-muted-foreground">Loading...</p></div>}>
        <PublicHomePageLoader />
      </Suspense>
    );
}
