
'use client';

import { Suspense, useEffect, useState } from "react";
import { DonorDashboardContent } from './donor-dashboard-content';
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import { getDonationsByUserId, getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAppSettings } from "@/app/admin/settings/actions";
import { getAllCampaigns } from "@/services/campaign-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getQuotes } from "@/app/home/actions";
import type { AppSettings, Donation, Lead, Campaign, Quote } from "@/services/types";

async function DonorPageLoader({ userId }: { userId: string | null }) {
    if (!userId) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You must be logged in to view the Donor Dashboard.</AlertDescription>
            </Alert>
        );
    }
    
    // Fetch all data in parallel on the server
    const [user, donations, allLeads, allDonations, allCampaigns, quotes, settings] = await Promise.all([
        getUser(userId),
        getDonationsByUserId(userId),
        getAllLeads(),
        getAllDonations(),
        getAllCampaigns(),
        getQuotes(3),
        getAppSettings(),
    ]);

    if (!user || !user.roles.includes('Donor') || !settings) {
         return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You do not have permission to view this page or settings could not be loaded.</AlertDescription>
            </Alert>
        );
    }
    
    // Pass the fetched data as props to the client component
    return <DonorDashboardContent user={user} donations={donations} allLeads={allLeads} allDonations={allDonations} allCampaigns={allCampaigns} quotes={quotes} settings={settings} />
}


// This component remains a client component to handle localStorage and state.
function DonorPageWithAuth() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        setUserId(storedUserId);
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }
    
    return (
        <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <DonorPageLoader userId={userId} />
        </Suspense>
    );
}

// The page itself becomes a Server Component that uses the client component
export default async function DonorDashboardPage() {
    // This is a Server Component. It can't use hooks like useState or useEffect directly.
    // We delegate the client-side logic to DonorPageWithAuth.
    return <DonorPageWithAuth />;
}
