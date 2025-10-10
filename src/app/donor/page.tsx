// src/app/donor/page.tsx
import { Suspense } from "react";
import { DonorDashboardContent } from './donor-dashboard-content';
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import { getDonationsByUserId, getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAppSettings } from "@/app/admin/settings/actions";
import { getPublicCampaigns, getQuotes } from "@/app/home/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cookies } from 'next/headers';

async function DonorPageDataLoader() {
    const cookieStore = cookies();
    // This is a placeholder; in a real app, you'd get the user ID securely
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>You must be logged in to view this page.</AlertDescription>
            </Alert>
        );
    }

    try {
        const [
            user,
            donations,
            allLeads,
            allDonations,
            allCampaigns,
            quotes,
            settings
        ] = await Promise.all([
            getUser(userId),
            getDonationsByUserId(userId),
            getAllLeads(),
            getAllDonations(),
            getPublicCampaigns(),
            getQuotes(3),
            getAppSettings(),
        ]);

        if (!user || !settings) {
            throw new Error("Could not load user or settings data.");
        }

        return <DonorDashboardContent 
            user={JSON.parse(JSON.stringify(user))} 
            donations={JSON.parse(JSON.stringify(donations))} 
            allLeads={JSON.parse(JSON.stringify(allLeads))} 
            allDonations={JSON.parse(JSON.stringify(allDonations))} 
            allCampaigns={JSON.parse(JSON.stringify(allCampaigns))} 
            quotes={JSON.parse(JSON.stringify(quotes))} 
            settings={JSON.parse(JSON.stringify(settings))} 
        />;
        
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }
}


export default function DonorDashboardPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <DonorPageDataLoader />
        </Suspense>
    );
}
