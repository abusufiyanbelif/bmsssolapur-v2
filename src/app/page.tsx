
import { getOpenGeneralLeads, EnrichedLead, getAllCampaigns } from "@/app/campaigns/actions";
import { getRandomQuotes } from "@/services/quotes-service";
import type { Quote, Campaign } from "@/services/types";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { PublicHomePage } from "@/app/home/public-home-page";


async function getHomePageData() {
    try {
        const [
            leads,
            randomQuotes,
            donations,
            allLeadsData,
            campaigns,
        ] = await Promise.all([
            getOpenGeneralLeads(),
            getRandomQuotes(3),
            getAllDonations(),
            getAllLeads(),
            getAllCampaigns(),
        ]);
        return { leads, randomQuotes, donations, allLeadsData, campaigns, error: null };
    } catch (e) {
        console.error("Failed to load page data:", e);
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return { leads: [], randomQuotes: [], donations: [], allLeadsData: [], campaigns: [], error };
    }
}


export default async function Page() {
  const { leads, randomQuotes, donations, allLeadsData, campaigns, error } = await getHomePageData();

  return (
    <PublicHomePage
      initialLeads={leads}
      initialQuotes={randomQuotes}
      initialDonations={donations}
      initialAllLeads={allLeadsData}
      initialCampaigns={campaigns}
      error={error}
    />
  );
}
