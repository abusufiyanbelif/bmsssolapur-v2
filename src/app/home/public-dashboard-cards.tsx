

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MainMetricsCard, TopDonorsCard, TopDonationsCard, BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/app/admin/dashboard-cards";
import { Suspense, useEffect, useState } from "react";
import type { Donation, User, Lead, Campaign, PublicStats } from "@/services/types";
import { getPublicLeads, getPublicCampaigns } from "@/services/public-data-service";
import { getAllDonations as getAllDonationsPrivate } from "@/services/donation-service";
import { getAllUsers as getAllUsersPrivate } from "@/services/user-service";
import { getAllLeads as getAllLeadsPrivate } from "@/services/lead-service";
import { getAllCampaigns as getAllCampaignsService } from "@/app/campaigns/actions"; // Use the corrected public action
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


export function PublicDashboardCards() {
    const [allDonations, setAllDonations] = useState<Donation[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<(Campaign & { raisedAmount: number, fundingProgress: number })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [donations, users, leads, campaigns] = await Promise.all([
                getAllDonationsPrivate(),
                getAllUsersPrivate(),
                getAllLeadsPrivate(),
                getAllCampaignsService()
            ]);
            setAllDonations(donations);
            setAllUsers(users);
            setAllLeads(leads);
            setAllCampaigns(campaigns);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
                <CardSkeleton />
                <TableSkeleton />
            </div>
        );
    }
    
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
