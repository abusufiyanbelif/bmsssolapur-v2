
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { getAllCampaigns } from "@/services/campaign-service";
import { getAllDonations } from "@/services/donation-service";
import { FinancialPerformanceCards, SystemHealthCards } from "./analytics-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";

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


export default async function DataAnalyticsPage() {
  const [allDonations, allCampaigns, allUsers, allLeads] = await Promise.all([
      getAllDonations(),
      getAllCampaigns(),
      getAllUsers(),
      getAllLeads()
  ]);

  return (
    <div className="flex-1 space-y-6">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Data Profiling & Analytics</h2>
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>
              A high-level overview of application performance, data integrity, and fundraising metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <Suspense fallback={<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                <FinancialPerformanceCards allDonations={allDonations} allCampaigns={allCampaigns} />
            </Suspense>
            <Separator />
            <Suspense fallback={<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                <SystemHealthCards allUsers={allUsers} allLeads={allLeads} allDonations={allDonations} />
            </Suspense>
          </CardContent>
        </Card>
    </div>
  );
}
