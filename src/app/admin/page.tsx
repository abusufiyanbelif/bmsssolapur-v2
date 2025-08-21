
'use client';

import { Suspense, useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    MainMetricsCard, 
    FundsInHandCard, 
    MonthlyContributorsCard, 
    MonthlyPledgeCard,
    PendingLeadsCard,
    PendingDonationsCard,
    LeadsReadyToPublishCard,
    TopDonorsCard,
    RecentCampaignsCard
} from "./dashboard-cards";
import { AppSettings, getAppSettings } from "@/services/app-settings-service";
import { UserRole } from "@/services/types";
import { BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/components/dashboard-cards";
import { DonationsChart } from "./donations-chart";
import { getAllDonations } from "@/services/donation-service";
import { Loader2 } from "lucide-react";


// A simple helper function to check card visibility based on settings
const isCardVisible = (cardKey: keyof AppSettings['dashboard'], settings?: AppSettings, activeRole?: UserRole) => {
    if (!settings?.dashboard?.[cardKey] || !activeRole) {
        return false; // Default to hidden if not configured or no role
    }
    const visibleTo = settings.dashboard[cardKey]?.visibleTo || [];
    // Super Admins should see everything by default, regardless of settings
    if (activeRole === 'Super Admin') return true;
    return visibleTo.includes(activeRole);
};


const CardSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-10 w-full" />
        </CardContent>
    </Card>
);

const ChartSkeleton = () => (
     <Card className="col-span-4">
        <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-[350px] w-full" />
        </CardContent>
    </Card>
);

const TableSkeleton = () => (
    <Card>
        <CardHeader>
             <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </CardContent>
    </Card>
)


export default function DashboardPage() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [allDonations, setAllDonations] = useState<any[]>([]); // Use a more specific type if possible
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        const role = localStorage.getItem('activeRole') as UserRole;
        setCurrentUserRole(role);
        
        const [appSettings, donations] = await Promise.all([
            getAppSettings(),
            getAllDonations(),
        ]);
        setSettings(appSettings);
        setAllDonations(donations);
        setLoading(false);
    }
    fetchData();
  }, []);

  if (loading || !currentUserRole) {
    return (
        <div className="flex flex-col flex-1 items-center justify-center h-full">
            <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
            <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
        </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
      </div>
      <div className="space-y-4">
        {isCardVisible('mainMetrics', settings, currentUserRole) && (
            <Suspense fallback={<CardSkeleton />}>
                <MainMetricsCard />
            </Suspense>
        )}
         {isCardVisible('fundsInHand', settings, currentUserRole) && (
             <Suspense fallback={<CardSkeleton />}>
                <FundsInHandCard />
            </Suspense>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {isCardVisible('monthlyContributors', settings, currentUserRole) && (
                <Suspense fallback={<CardSkeleton />}><MonthlyContributorsCard /></Suspense>
             )}
            {isCardVisible('monthlyPledge', settings, currentUserRole) && (
                <Suspense fallback={<CardSkeleton />}><MonthlyPledgeCard /></Suspense>
            )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           {isCardVisible('pendingLeads', settings, currentUserRole) && (
               <Suspense fallback={<CardSkeleton />}><PendingLeadsCard /></Suspense>
           )}
            {isCardVisible('pendingDonations', settings, currentUserRole) && (
               <Suspense fallback={<CardSkeleton />}><PendingDonationsCard /></Suspense>
           )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {isCardVisible('leadsReadyToPublish', settings, currentUserRole) && (
               <Suspense fallback={<CardSkeleton />}><LeadsReadyToPublishCard /></Suspense>
           )}
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {isCardVisible('beneficiaryBreakdown', settings, currentUserRole) && <Suspense fallback={<CardSkeleton />}><BeneficiaryBreakdownCard isAdmin={true} /></Suspense>}
            {isCardVisible('campaignBreakdown', settings, currentUserRole) && <Suspense fallback={<CardSkeleton />}><CampaignBreakdownCard /></Suspense>}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           {isCardVisible('donationsChart', settings, currentUserRole) && (
                <Suspense fallback={<ChartSkeleton />}>
                    <DonationsChart donations={allDonations} />
                </Suspense>
            )}
          {isCardVisible('topDonors', settings, currentUserRole) && (
            <Suspense fallback={<CardSkeleton />}>
                <TopDonorsCard />
            </Suspense>
           )}
        </div>

        {isCardVisible('recentCampaigns', settings, currentUserRole) && (
             <Suspense fallback={<TableSkeleton />}>
                <RecentCampaignsCard />
            </Suspense>
        )}
        
        {isCardVisible('donationTypeBreakdown', settings, currentUserRole) && <Suspense fallback={<CardSkeleton />}><DonationTypeCard /></Suspense>}
      </div>
    </div>
  );
}
