// src/app/donor/page.tsx
'use client';

// This component is now a wrapper that directs to the main /home dashboard.
// The data fetching and rendering logic has been consolidated in home-client.tsx
// and donor-dashboard-content.tsx to avoid prop drilling and ensure correct
// server/client component architecture.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DonorDashboardPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the centralized dashboard home page
        router.replace('/home');
    }, [router]);

    return (
        <div className="flex-1 space-y-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}
