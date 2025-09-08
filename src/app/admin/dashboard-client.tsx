

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
import { DonationsChart } from "./donations-chart";
import type { Donation, User, Lead, Campaign, Quote } from "@/services/types";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { BarChart3, CheckCheck, HandCoins, Megaphone, FileText, Users, HandHeart, Quote as QuoteIcon, Loader2 } from "lucide-react";

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

interface DashboardClientProps {
    allDonations: Donation[];
    allUsers: User[];
    allLeads: Lead[];
    allCampaigns: Campaign[];
    quotes: Quote[];
}

export function DashboardClient({ allDonations, allUsers, allLeads, allCampaigns, quotes }: DashboardClientProps) {

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <InspirationalQuotes quotes={quotes} />
        
        <MainMetricsCard allDonations={allDonations} allLeads={allLeads} />

        <FundsInHandCard allDonations={allDonations} allLeads={allLeads} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlyContributorsCard allUsers={allUsers} />
            <MonthlyPledgeCard allUsers={allUsers} />
        </div>
        
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="actions" className="border-b-0">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg hover:no-underline"><CheckCheck className="mr-2 h-5 w-5 text-destructive"/>Pending Actions</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <PendingLeadsCard allLeads={allLeads} />
              <PendingDonationsCard allDonations={allDonations} />
              <LeadsReadyToPublishCard allLeads={allLeads} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="breakdowns" className="border-b-0">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg hover:no-underline"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Breakdowns</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <LeadBreakdownCard allLeads={allLeads} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} isAdmin={true} />
                  <CampaignBreakdownCard allCampaigns={allCampaigns} />
                  <ReferralSummaryCard allUsers={allUsers} allLeads={allLeads} currentUser={{roles: ['Admin']} as any} />
              </div>
              <DonationTypeCard donations={allDonations} />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="donations-insights" className="border-b-0">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg hover:no-underline"><HandCoins className="mr-2 h-5 w-5 text-primary"/>Donation Insights</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <DonationsChart donations={allDonations} />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <div className="col-span-full lg:col-span-4">
                      <TopDonationsCard allDonations={allDonations} />
                  </div>
                  <div className="col-span-full lg:col-span-3">
                      <TopDonorsCard allDonations={allDonations} />
                  </div>
              </div>
            </AccordionContent>
          </AccordionItem>

           <AccordionItem value="campaigns-insights" className="border-b-0">
            <AccordionTrigger className="text-lg font-semibold p-4 bg-muted/50 rounded-lg hover:no-underline"><Megaphone className="mr-2 h-5 w-5 text-primary"/>Campaign Insights</AccordionTrigger>
            <AccordionContent className="pt-4">
                <RecentCampaignsCard allCampaigns={allCampaigns} allLeads={allLeads} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </div>
    </div>
  );
}
