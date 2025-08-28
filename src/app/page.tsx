

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    MainMetricsCard, 
    FundsInHandCard, 
    TopDonorsCard,
    RecentCampaignsCard,
    TopDonationsCard
} from "./admin/dashboard-cards";
import { BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/components/dashboard-cards";
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


export default function Page() {
    return (
        <div className="flex-1 space-y-8">
            <PublicHomePage />

            <div className="space-y-4">
                <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                    <MainMetricsCard isPublicView={true} />
                </Suspense>
                
                <Suspense fallback={<CardSkeleton />}>
                    <FundsInHandCard isPublicView={true} />
                </Suspense>
                <Suspense fallback={<CardSkeleton />}>
                     <BeneficiaryBreakdownCard />
                </Suspense>
                 <Suspense fallback={<CardSkeleton />}>
                     <DonationTypeCard />
                </Suspense>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-full lg:col-span-4">
                         <Suspense fallback={<TableSkeleton />}>
                            <TopDonationsCard isPublicView={true} />
                        </Suspense>
                    </div>
                    <div className="col-span-full lg:col-span-3">
                         <Suspense fallback={<TableSkeleton />}>
                            <RecentCampaignsCard />
                        </Suspense>
                    </div>
                </div>

                <Suspense fallback={<CardSkeleton />}>
                    <CampaignBreakdownCard />
                </Suspense>
            </div>
        </div>
    );
}
