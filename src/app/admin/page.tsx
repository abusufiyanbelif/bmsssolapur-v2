

'use client';

import { Suspense, useEffect, useState } from "react";
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
import { getAllDonations, Donation } from "@/services/donation-service";
import { getAllUsers, User } from "@/services/user-service";
import { getAllLeads, Lead } from "@/services/lead-service";
import { getAllCampaigns, Campaign } from "@/services/campaign-service";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { BarChart3, CheckCheck, HandCoins, Megaphone, FileText, Users, HandHeart, Quote as QuoteIcon, Loader2 } from "lucide-react";
import type { Quote } from "@/services/types";
import { getQuotes } from "@/app/home/actions";


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
                            <p>&quot;{quote.text}&quot;</p>
                            <cite className="block text-right not-italic text-xs text-muted-foreground mt-1">— {quote.source}</cite>
                        </blockquote>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const [allDonations, setAllDonations] = useState<Donation[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [donations, users, leads, campaigns, fetchedQuotes] = await Promise.all([
                getAllDonations(),
                getAllUsers(),
                getAllLeads(),
                getAllCampaigns(),
                getQuotes(3),
            ]);
            setAllDonations(donations);
            setAllUsers(users);
            setAllLeads(leads);
            setAllCampaigns(campaigns);
            setQuotes(fetchedQuotes);
            setLoading(false);
        };
        fetchData();
    }, []);

  if (loading) {
      return (
        <div className="flex-1 space-y-4">
             <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
            </div>
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        </div>
      )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <Suspense fallback={<CardSkeleton />}>
          <InspirationalQuotes quotes={quotes} />
        </Suspense>
        
        <Suspense fallback={<CardSkeleton />}>
            <MainMetricsCard allDonations={allDonations} allLeads={allLeads} />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
            <FundsInHandCard allDonations={allDonations} allLeads={allLeads} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Suspense fallback={<CardSkeleton />}>
                <MonthlyContributorsCard allUsers={allUsers} />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
                <MonthlyPledgeCard allUsers={allUsers} />
            </Suspense>
        </div>
        
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="actions">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg"><CheckCheck className="mr-2 h-5 w-5 text-destructive"/>Pending Actions</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <Suspense fallback={<CardSkeleton />}>
                <PendingLeadsCard allLeads={allLeads} />
              </Suspense>
              <Suspense fallback={<CardSkeleton />}>
                <PendingDonationsCard allDonations={allDonations} />
              </Suspense>
              <Suspense fallback={<CardSkeleton />}>
                <LeadsReadyToPublishCard allLeads={allLeads} />
              </Suspense>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="breakdowns">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Breakdowns</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <Suspense fallback={<CardSkeleton />}>
                <LeadBreakdownCard allLeads={allLeads} />
              </Suspense>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Suspense fallback={<CardSkeleton />}>
                    <BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} isAdmin={true} />
                  </Suspense>
                  <Suspense fallback={<CardSkeleton />}>
                    <CampaignBreakdownCard allCampaigns={allCampaigns} />
                  </Suspense>
                   <Suspense fallback={<CardSkeleton />}>
                    <ReferralSummaryCard allUsers={allUsers} allLeads={allLeads} currentUser={{roles: ['Admin']} as any} />
                  </Suspense>
              </div>
              <Suspense fallback={<CardSkeleton />}>
                <DonationTypeCard donations={allDonations} />
              </Suspense>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="donations-insights">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg"><HandCoins className="mr-2 h-5 w-5 text-primary"/>Donation Insights</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <Suspense fallback={<ChartSkeleton />}>
                <DonationsChart donations={allDonations} />
              </Suspense>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <div className="col-span-full lg:col-span-4">
                      <Suspense fallback={<TableSkeleton />}>
                        <TopDonationsCard allDonations={allDonations} />
                      </Suspense>
                  </div>
                  <div className="col-span-full lg:col-span-3">
                      <Suspense fallback={<CardSkeleton />}>
                        <TopDonorsCard allDonations={allDonations} />
                      </Suspense>
                  </div>
              </div>
            </AccordionContent>
          </AccordionItem>

           <AccordionItem value="campaigns-insights">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg"><Megaphone className="mr-2 h-5 w-5 text-primary"/>Campaign Insights</AccordionTrigger>
            <AccordionContent className="pt-4">
              <Suspense fallback={<TableSkeleton />}>
                <RecentCampaignsCard allCampaigns={allCampaigns} allLeads={allLeads} />
              </Suspense>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </div>
    </div>
  );
}
