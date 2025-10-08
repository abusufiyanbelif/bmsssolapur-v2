// src/app/admin/page.tsx
import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";
import { Loader2 } from "lucide-react";
import { getAllDonations } from "@/services/donation-service";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getQuotes, getPublicCampaigns } from "@/app/home/actions";

async function DashboardData() {
    // Fetch public campaigns instead of all campaigns
    const [donations, users, leads, campaigns, quotes] = await Promise.all([
        getAllDonations(),
        getAllUsers(),
        getAllLeads(),
        getPublicCampaigns(),
        getQuotes(3),
    ]);

    return (
        <DashboardClient
            allDonations={donations}
            allUsers={users}
            allLeads={leads}
            allCampaigns={campaigns}
            quotes={quotes}
        />
    );
}


export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
                </div>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </div>
        }>
            <DashboardData />
        </Suspense>
    );
}
