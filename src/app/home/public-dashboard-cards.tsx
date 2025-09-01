
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MainMetricsCard, TopDonorsCard, TopDonationsCard, BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/app/admin/dashboard-cards";
import { Suspense } from "react";
import type { Donation, User, Lead, Campaign } from "@/services/types";
import { RecentCampaignsCard } from "@/app/admin/dashboard-cards";


const CardSkeleton = () => (
    <Card>
        <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-10 w-full" />
        </div>
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

interface PublicDashboardCardsProps {
    allDonations: Donation[];
    allUsers: User[];
    allLeads: Lead[];
    allCampaigns: Campaign[];
}

export function PublicDashboardCards({ allDonations, allUsers, allLeads, allCampaigns }: PublicDashboardCardsProps) {
    
    return (
        <div className="space-y-4">
            <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                <MainMetricsCard allDonations={allDonations} allLeads={allLeads} />
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
                <BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} isAdmin={false} />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
                <DonationTypeCard donations={allDonations} isPublicView={true} />
            </Suspense>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full lg:col-span-4">
                    <Suspense fallback={<TableSkeleton />}>
                        <TopDonationsCard allDonations={allDonations} isPublicView={true} />
                    </Suspense>
                </div>
                <div className="col-span-full lg:col-span-3">
                    <Suspense fallback={<TableSkeleton />}>
                        <RecentCampaignsCard allCampaigns={allCampaigns} allLeads={allLeads} />
                    </Suspense>
                </div>
            </div>

             <Suspense fallback={<CardSkeleton />}>
                <CampaignBreakdownCard allCampaigns={allCampaigns} />
            </Suspense>
        </div>
    );
}
