// src/app/admin/donations/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DonationsPageClient } from "./donations-client";
import { getAllDonations, Donation } from "@/services/donation-service";
import { getAllUsers, User } from "@/services/user-service";
import { getAllLeads, Lead } from "@/services/lead-service";
import { getAllCampaigns, Campaign } from "@/services/campaign-service";

async function DonationsPageDataLoader() {
  try {
      const [
        fetchedDonations,
        fetchedUsers,
        fetchedLeads,
        fetchedCampaigns,
      ] = await Promise.all([
        getAllDonations(),
        getAllUsers(),
        getAllLeads(),
        getAllCampaigns(),
      ]);

      return (
          <DonationsPageClient
            initialDonations={fetchedDonations}
            initialUsers={fetchedUsers}
            initialLeads={fetchedLeads}
            initialCampaigns={fetchedCampaigns}
          />
      );
  } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred.";
       return (
          <DonationsPageClient
            initialDonations={[]}
            initialUsers={[]}
            initialLeads={[]}
            initialCampaigns={[]}
            error={error}
          />
      );
  }
}


// This is now a Server Component that fetches its own data.
export default function DonationsPage() {
    
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <DonationsPageDataLoader />
        </Suspense>
    );
}
