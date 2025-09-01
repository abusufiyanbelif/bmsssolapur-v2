

import { Suspense } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicHomePage } from "./home/public-home-page";
import { PublicDashboardCards } from "./home/public-dashboard-cards";
import { getRandomQuotes, Quote } from "@/services/quotes-service";


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


export default async function Page() {
    const quotes = await getRandomQuotes(3);

    return (
        <div className="flex-1 space-y-8">
            <PublicHomePage quotes={quotes} />

            <div className="space-y-4">
                 <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                    <PublicDashboardCards />
                </Suspense>
            </div>
        </div>
    );
}
