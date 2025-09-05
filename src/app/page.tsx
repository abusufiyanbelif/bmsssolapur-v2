

import { Suspense } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicHomePage } from "./home/public-home-page";
import { Quote, Donation, User, Lead, Campaign } from "@/services/types";
import { getPublicDashboardData, getQuotes } from "./home/actions";
import { BeneficiaryBreakdownCard, DonationTypeCard, TopDonationsCard, RecentCampaignsCard, CampaignBreakdownCard } from "@/app/admin/dashboard-cards";
import { PublicMainMetricsCard } from "@/app/home/public-dashboard-cards";


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

const TableSkeleton = () => (
    <Card>
        <div className="p-4 space-y-4">
             <Skeleton className="h-6 w-1/4" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
        </div>
    </Card>
);


async function PublicData() {
    const data = await getPublicDashboardData();

    if (data.error) {
        return (
            <div className="text-destructive text-center p-4 border border-destructive/50 rounded-lg">
                Error loading dashboard data: {data.error}
            </div>
        );
    }

    const allDonations = data.donations || [];
    const allUsers = data.users || [];
    const allLeads = data.leads || [];
    const allCampaigns = data.campaigns || [];
    
    return (
         <div className="space-y-4">
            <PublicMainMetricsCard allDonations={allDonations} allLeads={allLeads} />
            <BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} isAdmin={false} />
            <DonationTypeCard donations={allDonations} isPublicView={true} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full lg:col-span-4">
                    <TopDonationsCard allDonations={allDonations} isPublicView={true} />
                </div>
                <div className="col-span-full lg:col-span-3">
                    <RecentCampaignsCard allCampaigns={allCampaigns} allLeads={allLeads} />
                </div>
            </div>
            <CampaignBreakdownCard allCampaigns={allCampaigns} />
        </div>
    )
}


export default async function Page() {
    const initialQuotes: Quote[] = await getQuotes(3);

    return (
        <div className="flex-1 space-y-8">
            <PublicHomePage quotes={initialQuotes} />
            <Suspense fallback={
                 <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                </div>
            }>
                <PublicData />
            </Suspense>
        </div>
    );
}

    
