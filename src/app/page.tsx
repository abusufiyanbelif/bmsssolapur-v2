
// src/app/page.tsx
import { Suspense } from "react";
import { PublicHomePage } from "./home/public-home-page";
import { Loader2 } from "lucide-react";
import { getOpenGeneralLeads, getPublicCampaigns, getPublicDashboardData, getQuotes } from "@/app/home/actions";
import type { Quote } from "@/services/types";
import { getCurrentOrganization } from "@/app/admin/settings/actions";

// This is now a true Server Component that fetches all data for the public page.
async function PublicHomePageLoader() {
  
  let quotes: Quote[];
  const [
    publicLeads, 
    publicCampaigns, 
    dashboardData,
    organization,
  ] = await Promise.all([
    getOpenGeneralLeads(),
    getPublicCampaigns(),
    getPublicDashboardData(),
    getCurrentOrganization(),
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

  // The 'dashboardData' object now contains already-serialized 'donations', 'users', and 'leads'.
  return (
    <PublicHomePage
      publicLeads={JSON.parse(JSON.stringify(publicLeads))}
      publicCampaigns={JSON.parse(JSON.stringify(publicCampaigns))}
      allLeads={dashboardData.leads}
      allDonations={dashboardData.donations}
      allUsers={dashboardData.users}
      organization={JSON.parse(JSON.stringify(organization))}
      quotes={JSON.parse(JSON.stringify(quotes))}
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
