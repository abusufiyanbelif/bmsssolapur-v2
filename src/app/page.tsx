

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    MainMetricsCard, 
    TopDonorsCard,
    RecentCampaignsCard,
    TopDonationsCard
} from "./admin/dashboard-cards";
import { BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/components/dashboard-cards";
import { DonationsChart } from "./admin/donations-chart";
import { getAllDonations } from "@/services/donation-service";
import { PublicHomePage } from "./home/public-home-page";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";


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


export default async function Page() {
    // Fetch all data required for the server-rendered part of the page
    const [allDonations, allUsers, allLeads, allCampaigns] = await Promise.all([
        getAllDonations(),
        getAllUsers(),
        getAllLeads(),
        getAllCampaigns()
    ]);

    return (
        <div className="flex-1 space-y-8">
            <PublicHomePage />

            <div className="space-y-4">
                <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                    <MainMetricsCard isPublicView={true} />
                </Suspense>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Suspense fallback={<CardSkeleton />}>
                        <BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} isAdmin={false} isPublicView={true} />
                    </Suspense>
                    <Suspense fallback={<CardSkeleton />}>
                        <DonationTypeCard donations={allDonations} isPublicView={true} />
                    </Suspense>
                </div>
            
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-full lg:col-span-4">
                        <Suspense fallback={<TableSkeleton />}>
                            <TopDonationsCard donations={allDonations} isPublicView={true} />
                        </Suspense>
                    </div>
                    <div className="col-span-full lg:col-span-3">
                         <Suspense fallback={<TableSkeleton />}>
                            <RecentCampaignsCard />
                        </Suspense>
                    </div>
                </div>

                <Suspense fallback={<CardSkeleton />}>
                    <CampaignBreakdownCard allCampaigns={allCampaigns} />
                </Suspense>
            </div>
        </div>
    );
}
