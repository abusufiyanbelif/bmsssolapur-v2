

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
    const [allDonations, setAllDonations] = useState<Donation[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getPublicDashboardData();
            
            if (result && !result.error) {
                setAllDonations(result.donations || []);
                setAllUsers(result.users || []);
                setAllLeads(result.leads || []);
                setAllCampaigns(result.campaigns || []);
            } else {
                console.error("Failed to fetch public dashboard data", result?.error);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    // Quotes are now fetched client-side in PublicHomePage
    const initialQuotes: Quote[] = [];

    return (
        <div className="flex-1 space-y-8">
            <PublicHomePage quotes={initialQuotes} />

            <div className="space-y-4">
                 <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                    <PublicDashboardCards 
                        allDonations={allDonations}
                        allUsers={allUsers}
                        allLeads={allLeads}
                        allCampaigns={allCampaigns}
                    />
                </Suspense>
            </div>
        </div>
    );
}
