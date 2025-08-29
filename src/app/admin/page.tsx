

import { Suspense } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    MainMetricsCard, 
    FundsInHandCard, 
    MonthlyContributorsCard, 
    MonthlyPledgeCard,
    PendingLeadsCard,
    PendingDonationsCard,
    LeadsReadyToPublishCard,
    TopDonorsCard,
    RecentCampaignsCard,
    LeadBreakdownCard,
    TopDonationsCard,
    BeneficiaryBreakdownCard, 
    CampaignBreakdownCard,
    DonationTypeCard,
    ReferralSummaryCard
} from "./dashboard-cards";
import { AppSettings, getAppSettings } from "@/services/app-settings-service";
import { DonationsChart } from "./donations-chart";
import { getAllDonations } from "@/services/donation-service";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { BarChart3, CheckCheck, HandCoins, Megaphone, FileText, Users, HandHeart, Quote as QuoteIcon, Loader2 } from "lucide-react";
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

const TableSkeleton = () => (
    <Card>
        <CardHeader>
             <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </CardContent>
    </Card>
)

function InspirationalQuotes({ quotes }: { quotes: Quote[] }) {
    if (quotes.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <QuoteIcon className="text-primary" />
                    Wisdom & Reflection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {quotes.map((quote, index) => (
                        <blockquote key={index} className="border-l-2 pl-4 italic text-sm">
                            <p>"{quote.text}"</p>
                            <cite className="block text-right not-italic text-xs text-muted-foreground mt-1">— {quote.source}</cite>
                        </blockquote>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// This is now a Server Component, fetching all necessary data for its children.
export default async function DashboardPage() {
  const [allDonations, allUsers, allLeads, allCampaigns, quotes] = await Promise.all([
      getAllDonations(),
      getAllUsers(),
      getAllLeads(),
      getAllCampaigns(),
      getRandomQuotes(3),
  ]);

  // The client component will read the role from localStorage.
  // Here, we pass the settings to a client component that will handle visibility.
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <Suspense fallback={<CardSkeleton />}><InspirationalQuotes quotes={quotes} /></Suspense>
        <Suspense fallback={<CardSkeleton />}><MainMetricsCard /></Suspense>
        <Suspense fallback={<CardSkeleton />}><FundsInHandCard /></Suspense>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Suspense fallback={<CardSkeleton />}><MonthlyContributorsCard /></Suspense>
            <Suspense fallback={<CardSkeleton />}><MonthlyPledgeCard /></Suspense>
        </div>
        
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="actions">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg"><CheckCheck className="mr-2 h-5 w-5 text-destructive"/>Pending Actions</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <Suspense fallback={<CardSkeleton />}><PendingLeadsCard /></Suspense>
              <Suspense fallback={<CardSkeleton />}><PendingDonationsCard /></Suspense>
              <Suspense fallback={<CardSkeleton />}><LeadsReadyToPublishCard /></Suspense>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="breakdowns">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Breakdowns</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <Suspense fallback={<CardSkeleton />}><LeadBreakdownCard allLeads={allLeads} /></Suspense>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Suspense fallback={<CardSkeleton />}><BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} isAdmin={true} /></Suspense>
                  <Suspense fallback={<CardSkeleton />}><CampaignBreakdownCard allCampaigns={allCampaigns} /></Suspense>
                  <Suspense fallback={<CardSkeleton />}><ReferralSummaryCard allUsers={allUsers} allLeads={allLeads} /></Suspense>
              </div>
              <Suspense fallback={<CardSkeleton />}><DonationTypeCard donations={allDonations} /></Suspense>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="donations-insights">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg"><HandCoins className="mr-2 h-5 w-5 text-primary"/>Donation Insights</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <Suspense fallback={<ChartSkeleton />}><DonationsChart donations={allDonations} /></Suspense>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <div className="col-span-full lg:col-span-4">
                      <Suspense fallback={<TableSkeleton />}><TopDonationsCard /></Suspense>
                  </div>
                  <div className="col-span-full lg:col-span-3">
                      <Suspense fallback={<CardSkeleton />}><TopDonorsCard /></Suspense>
                  </div>
              </div>
            </AccordionContent>
          </AccordionItem>

           <AccordionItem value="campaigns-insights">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg"><Megaphone className="mr-2 h-5 w-5 text-primary"/>Campaign Insights</AccordionTrigger>
            <AccordionContent className="pt-4">
              <Suspense fallback={<TableSkeleton />}><RecentCampaignsCard /></Suspense>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </div>
    </div>
  );
}
