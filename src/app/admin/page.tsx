
// src/app/admin/page.tsx
import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";
import { Loader2 } from "lucide-react";
import { getAllDonations } from "@/services/donation-service";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getQuotes } from "@/app/home/actions";
import { getAllCampaigns } from "@/services/campaign-service";
import type { Quote } from "@/services/types";

async function DashboardData() {
    // Fetch all necessary data on the server
    const [donations, users, leads, campaigns] = await Promise.all([
        getAllDonations(),
        getAllUsers(),
        getAllLeads(),
        getAllCampaigns(),
    ]);

    let quotes: Quote[];
    try {
      // Isolate the potentially failing call
      quotes = await getQuotes(3);
    } catch (error) {
      console.error("Critical Error: getQuotes() failed in /admin/page.tsx. Using fallback.", error);
      // Provide a hardcoded fallback to prevent the page from crashing.
      quotes = [
        { id: 'fb1', number: 1, text: "The believer's shade on the Day of Resurrection will be their charity.", source: "Tirmidhi", category: "Hadith", categoryTypeNumber: 2 },
      ];
    }

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
