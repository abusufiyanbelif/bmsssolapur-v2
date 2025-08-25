
import { Suspense } from "react";
import { 
    TopDonorsCard,
    RecentCampaignsCard,
    LeadBreakdownCard,
    TopDonationsCard
} from "../dashboard-cards";
import { BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/components/dashboard-cards";
import { DonationsChart } from "../donations-chart";
import { getAllDonations } from "@/services/donation-service";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";

// This is now a Server Component, fetching all necessary data for its children.
export default async function DataAnalyticsPage() {
  const [allDonations, allUsers, allLeads, allCampaigns] = await Promise.all([
      getAllDonations(),
      getAllUsers(),
      getAllLeads(),
      getAllCampaigns(),
  ]);

  // Enrich top donations with anonymous donor ID for public view
  const usersById = new Map(allUsers.map(u => [u.id, u]));
  const topDonationsData = allDonations
    .filter(d => d.status === 'Verified' || d.status === 'Allocated')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(donation => {
        const donor = usersById.get(donation.donorId);
        return {
            ...donation,
            anonymousDonorId: donor?.anonymousDonorId,
        }
    });

  return (
    <div className="flex-1 space-y-6">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Data Profiling & Analytics</h2>
        <Suspense fallback={<div>Loading chart...</div>}>
            <DonationsChart donations={allDonations} />
        </Suspense>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <Suspense fallback={<div>Loading breakdown...</div>}>
                <LeadBreakdownCard allLeads={allLeads} />
             </Suspense>
             <Suspense fallback={<div>Loading breakdown...</div>}>
                <BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} />
             </Suspense>
            <Suspense fallback={<div>Loading breakdown...</div>}>
                <CampaignBreakdownCard allCampaigns={allCampaigns} />
            </Suspense>
        </div>
        <Suspense fallback={<div>Loading breakdown...</div>}>
            <DonationTypeCard donations={allDonations} />
        </Suspense>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-full lg:col-span-4">
                <Suspense fallback={<div>Loading top donations...</div>}>
                    <TopDonationsCard donations={topDonationsData} />
                </Suspense>
            </div>
            <div className="col-span-full lg:col-span-3">
                <Suspense fallback={<div>Loading top donors...</div>}>
                    <TopDonorsCard />
                </Suspense>
            </div>
        </div>
         <Suspense fallback={<div>Loading recent campaigns...</div>}>
            <RecentCampaignsCard />
        </Suspense>
    </div>
  );
}

