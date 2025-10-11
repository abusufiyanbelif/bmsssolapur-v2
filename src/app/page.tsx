
// src/app/page.tsx
import { Suspense } from "react";
import { PublicHomePage } from "./home/public-home-page";
import { Loader2 } from "lucide-react";
import { getOpenGeneralLeads, getPublicCampaigns, getPublicDashboardData, getQuotes } from "@/app/home/actions";

async function PublicHomePageLoader() {
  const [
    publicLeads, 
    publicCampaigns, 
    dashboardData, 
    quotes
  ] = await Promise.all([
    getOpenGeneralLeads(),
    getPublicCampaigns(),
    getPublicDashboardData(),
    getQuotes(3),
  ]);

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
