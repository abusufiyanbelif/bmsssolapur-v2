

'use client';

import { Suspense, useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicHomePage } from "./home/public-home-page";
import { PublicDashboardCards } from "./home/public-dashboard-cards";
import { Quote, Donation, User, Lead, Campaign } from "@/services/types";
import { getPublicDashboardData } from "./home/actions";


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


export default function Page() {
    // Quotes are now fetched client-side in PublicHomePage
    const initialQuotes: Quote[] = [];
    const [dashboardData, setDashboardData] = useState<{
        donations: Donation[],
        users: User[],
        leads: Lead[],
        campaigns: Campaign[]
    } | null>(null);

    useEffect(() => {
        getPublicDashboardData().then(data => {
            if (!data.error) {
                setDashboardData(data as any);
            }
        });
    }, []);

    return (
        <div className="flex-1 space-y-8">
            <PublicHomePage quotes={initialQuotes} />

            {dashboardData ? (
                <PublicDashboardCards
                    allDonations={dashboardData.donations}
                    allUsers={dashboardData.users}
                    allLeads={dashboardData.leads}
                    allCampaigns={dashboardData.campaigns}
                />
            ) : (
                 <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                </div>
            )}
        </div>
    );
}
