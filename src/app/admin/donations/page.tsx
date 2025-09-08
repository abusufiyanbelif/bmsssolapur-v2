// src/app/admin/donations/page.tsx
'use client';
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DonationsPageClient } from "./donations-client";
import { getAllDonations, Donation } from "@/services/donation-service";
import { getAllUsers, User } from "@/services/user-service";
import { getAllLeads, Lead } from "@/services/lead-service";
import { getAllCampaigns, Campaign } from "@/services/campaign-service";

function DonationsPageDataLoader() {
  const [initialDonations, setInitialDonations] = useState<Donation[]>([]);
  const [initialUsers, setInitialUsers] = useState<User[]>([]);
  const [initialLeads, setInitialLeads] = useState<Lead[]>([]);
  const [initialCampaigns, setInitialCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
        setInitialDonations(fetchedDonations);
        setInitialUsers(fetchedUsers);
        setInitialLeads(fetchedLeads);
        setInitialCampaigns(fetchedCampaigns);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DonationsPageClient
      initialDonations={initialDonations}
      initialUsers={initialUsers}
      initialLeads={initialLeads}
      initialCampaigns={initialCampaigns}
      error={error}
    />
  );
}


// This is now a Client Component that fetches its own data.
export default function DonationsPage() {
    
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <DonationsPageDataLoader />
        </Suspense>
    );
}
