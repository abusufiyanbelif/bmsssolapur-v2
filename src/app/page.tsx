
// src/app/page.tsx
import { Suspense } from "react";
import { PublicHomePage } from "./home/public-home-page";
import { Loader2, AlertCircle } from "lucide-react";
import { getOpenGeneralLeads, getPublicCampaigns, getPublicDashboardData, getQuotes } from "@/app/home/actions";
import type { Quote } from "@/services/types";
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

  // Handle the error from getPublicDashboardData gracefully
  if (dashboardData.error) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Application Error: Could Not Connect to Database</AlertTitle>
          <AlertDescription>
            <p>The application server failed to authenticate with the database. This is typically an environment configuration issue.</p>
            <p className="font-bold mt-2">To fix this, please follow the steps in the <a href="/docs/TROUBLESHOOTING.md" target="_blank" className="underline">Troubleshooting Guide</a> under the &quot;UNAUTHENTICATED / PERMISSION_DENIED&quot; section.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  try {
      // Isolate the potentially failing call
      quotes = await getQuotes(3);
  } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error fetching quotes');
      console.warn(`Critical Error: getQuotes() failed in /page.tsx. Using fallback.`, err.message);
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
