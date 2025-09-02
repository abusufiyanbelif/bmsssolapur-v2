

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

    return (
        <div className="flex-1 space-y-8">
            <PublicHomePage quotes={initialQuotes} />
        </div>
    );
}
