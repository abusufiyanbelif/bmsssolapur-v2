

'use client';

import { Suspense, useEffect, useState } from "react";
import { PublicHomePage } from "./home/public-home-page";
import { Loader2 } from "lucide-react";
import type { Quote, Lead, Campaign, User, Donation } from "@/services/types";
import { getOpenGeneralLeads, getPublicDashboardData, getQuotes } from "./home/actions";
import { useRouter } from 'next/navigation';


const LoadingState = () => (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
    </div>
);

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem('activeRole');
        const userId = localStorage.getItem('userId');

        if (role && userId) {
            // If we have session data, go to the central router page.
            router.push('/home');
        } else {
            // If no session, it means it's a guest.
            // We stay here and the content will be rendered by PublicHomePage.
            // But we need to fetch the data for it.
            // This logic is now inside PublicHomePage's useEffect.
            // So we can just let it render.
        }
    }, [router]);

    // Render PublicHomePage by default, which contains its own data fetching logic
    // for the guest view.
    return (
      <Suspense fallback={<LoadingState />}>
        <PublicHomePage />
      </Suspense>
    );
}
