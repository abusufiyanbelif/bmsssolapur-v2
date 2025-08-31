

"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MainMetricsCard, TopDonorsCard, RecentCampaignsCard, TopDonationsCard, BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/app/admin/dashboard-cards";
import { Suspense, useEffect, useState } from "react";
import type { Donation, User, Lead, Campaign, PublicStats } from "@/services/types";
import { getPublicStats } from "@/services/public-data-service";


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
    
    // Note: The props are being kept for potential future use or for components that might
    // still need them, but the main logic now relies on the fetched publicStats.
    
    return (
        <div className="space-y-4">
            <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                <MainMetricsCard isPublicView={true} />
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
                <CampaignBreakdownCard allCampaigns={allCampaigns} />
            </Suspense>
        </div>
    );
}
