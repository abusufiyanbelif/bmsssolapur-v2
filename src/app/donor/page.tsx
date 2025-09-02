

'use client';

import { Suspense, useEffect, useState } from "react";
import { DonorDashboardContent } from './donor-dashboard-content';
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import { getDonationsByUserId, getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAppSettings } from "@/services/app-settings-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getQuotes } from "@/app/home/actions";

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
    
    return <DonorDashboardContent user={user} donations={donations} allLeads={allLeads} allDonations={allDonations} allCampaigns={allCampaigns} quotes={quotes} settings={settings} />
}

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

export default function DonorDashboardPage() {
    return <DonorPageWithAuth />;
}
