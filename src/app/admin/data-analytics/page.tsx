
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { getAllCampaigns } from "@/services/campaign-service";
import { getAllDonations } from "@/services/donation-service";
import { FinancialPerformanceCards, SystemHealthCards } from "./analytics-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { UsersChart } from "./users-chart";
import { DonationsChart } from "../donations-chart";
import { DataGrowthChart } from "./data-growth-chart";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { HandCoins, TrendingUp, Users as UsersIcon, BarChart3, LineChart, Info, LogIn } from "lucide-react";
import { LeadBreakdownCard, CampaignBreakdownCard } from "@/app/admin/dashboard-cards";
import { getAllActivityLogs } from "@/services/activity-log-service";
import { LoginAnalyticsChart } from "./login-analytics-chart";


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

const ChartSkeleton = () => (
     <Card className="col-span-4">
        <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-[350px] w-full" />
        </CardContent>
    </Card>
);


export default async function DataAnalyticsPage() {
  const [allDonations, allCampaigns, allUsers, allLeads, allActivityLogs] = await Promise.all([
      getAllDonations(),
      getAllCampaigns(),
      getAllUsers(),
      getAllLeads(),
      getAllActivityLogs()
  ]);

  return (
    <div className="flex-1 space-y-6">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Data Profiling & Analytics</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Analytics Dashboard</CardTitle>
            <CardDescription className="text-muted-foreground">
              A high-level overview of application performance, data integrity, and fundraising metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Accordion type="multiple" defaultValue={["performance-metrics"]} className="w-full space-y-4">
                <AccordionItem value="performance-metrics" className="border rounded-lg">
                    <AccordionTrigger className="p-4 font-semibold hover:no-underline">
                        <div className="flex items-center gap-3 text-lg text-primary">
                           <TrendingUp className="h-6 w-6" />
                            <div>
                                <h3 className="font-semibold text-lg">Performance Metrics</h3>
                                <p className="text-sm font-normal text-muted-foreground text-left">Financial health and system data overview.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0 space-y-6">
                         <Suspense fallback={<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                            <FinancialPerformanceCards allDonations={allDonations} allCampaigns={allCampaigns} />
                        </Suspense>
                        <Separator />
                        <Suspense fallback={<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                            <SystemHealthCards allUsers={allUsers} allLeads={allLeads} allDonations={allDonations} />
                        </Suspense>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="login-activity" className="border rounded-lg">
                    <AccordionTrigger className="p-4 font-semibold hover:no-underline">
                        <div className="flex items-center gap-3 text-lg text-primary">
                           <LogIn className="h-6 w-6" />
                            <div>
                                <h3 className="font-semibold text-lg">Login & User Activity</h3>
                                <p className="text-sm font-normal text-muted-foreground text-left">Analyze user login methods and frequency.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                         <Suspense fallback={<ChartSkeleton />}>
                            <LoginAnalyticsChart allActivityLogs={allActivityLogs} />
                        </Suspense>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="data-growth" className="border rounded-lg">
                    <AccordionTrigger className="p-4 font-semibold hover:no-underline">
                        <div className="flex items-center gap-3 text-lg text-primary">
                           <LineChart className="h-6 w-6" />
                            <div>
                                <h3 className="font-semibold text-lg">Data Growth</h3>
                                <p className="text-sm font-normal text-muted-foreground text-left">Track the growth of users, leads, and donations over time.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                         <Suspense fallback={<ChartSkeleton />}>
                            <DataGrowthChart users={allUsers} leads={allLeads} donations={allDonations} />
                        </Suspense>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="donation-insights" className="border rounded-lg">
                    <AccordionTrigger className="p-4 font-semibold hover:no-underline">
                       <div className="flex items-center gap-3 text-lg text-primary">
                           <HandCoins className="h-6 w-6" />
                            <div>
                                <h3 className="font-semibold text-lg">Donation Insights</h3>
                                <p className="text-sm font-normal text-muted-foreground text-left">Analyze donation trends and amounts.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                         <Suspense fallback={<ChartSkeleton />}>
                            <DonationsChart donations={allDonations} />
                        </Suspense>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="user-insights" className="border rounded-lg">
                    <AccordionTrigger className="p-4 font-semibold hover:no-underline">
                       <div className="flex items-center gap-3 text-lg text-primary">
                           <UsersIcon className="h-6 w-6" />
                            <div>
                                <h3 className="font-semibold text-lg">User Insights</h3>
                                <p className="text-sm font-normal text-muted-foreground text-left">Analyze new user registration trends.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                          <Suspense fallback={<ChartSkeleton />}>
                            <UsersChart users={allUsers} />
                        </Suspense>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="data-breakdown" className="border rounded-lg">
                    <AccordionTrigger className="p-4 font-semibold hover:no-underline">
                       <div className="flex items-center gap-3 text-lg text-primary">
                           <BarChart3 className="h-6 w-6" />
                            <div>
                                <h3 className="font-semibold text-lg">Data Breakdowns</h3>
                                <p className="text-sm font-normal text-muted-foreground text-left">View summaries of leads, campaigns, and more.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0 space-y-6">
                        <Suspense fallback={<ChartSkeleton />}><LeadBreakdownCard allLeads={allLeads} /></Suspense>
                        <Suspense fallback={<ChartSkeleton />}><CampaignBreakdownCard allCampaigns={allCampaigns} /></Suspense>
                    </AccordionContent>
                </AccordionItem>
             </Accordion>
          </CardContent>
        </Card>
    </div>
  );
}
