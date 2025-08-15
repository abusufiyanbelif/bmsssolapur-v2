
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle, Quote as QuoteIcon, Search, FilterX, Target, CheckCircle, HandCoins, Banknote, Hourglass, Users, TrendingUp, Megaphone, Eye } from "lucide-react";
import { EnrichedLead } from "@/app/campaigns/actions";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { Lead, Quote, Campaign, Donation } from "@/services/types";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

function InspirationalQuotes({ quotes, loading }: { quotes: Quote[], loading: boolean }) {
    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QuoteIcon className="text-primary" />
                        Wisdom & Reflection
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                </CardContent>
            </Card>
        )
    }

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

interface PublicHomePageProps {
    initialLeads: EnrichedLead[];
    initialQuotes: Quote[];
    initialDonations: Donation[];
    initialAllLeads: Lead[];
    initialCampaigns: (Campaign & { raisedAmount: number, fundingProgress: number })[];
    error: string | null;
}

export function PublicHomePage({ 
    initialLeads, 
    initialQuotes,
    initialDonations,
    initialAllLeads,
    initialCampaigns,
    error 
}: PublicHomePageProps) {
  const router = useRouter();

  const {
    totalRaised,
    totalDistributed,
    beneficiariesHelpedCount,
    casesClosed,
    casesPublished
  } = useMemo(() => {
    const totalRaised = initialDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
    const totalDistributed = initialAllLeads.reduce((acc, l) => acc + l.helpGiven, 0);
    const helpedBeneficiaryIds = new Set(initialAllLeads.map(l => l.beneficiaryId));
    const beneficiariesHelpedCount = helpedBeneficiaryIds.size;
    const casesClosed = initialAllLeads.filter(l => l.status === 'Closed').length;
    const casesPublished = initialAllLeads.filter(l => l.status === 'Publish').length;
    return { totalRaised, totalDistributed, beneficiariesHelpedCount, casesClosed, casesPublished };
  }, [initialDonations, initialAllLeads]);

  const mainMetrics = [
    { title: "Total Verified Funds", value: `₹${totalRaised.toLocaleString()}`, icon: TrendingUp, href: "/public-leads" },
    { title: "Total Distributed", value: `₹${totalDistributed.toLocaleString()}`, icon: HandCoins, href: "/public-leads" },
    { title: "Cases Closed", value: casesClosed.toString(), icon: CheckCircle, href: "/public-leads" },
    { title: "Published Leads", value: casesPublished.toString(), icon: Eye, description: "Cases currently visible to the public.", href: "/public-leads" },
    { title: "Beneficiaries Helped", value: beneficiariesHelpedCount.toString(), icon: Users, href: "/public-leads" },
  ];
  
  const activeAndUpcomingCampaigns = useMemo(() => {
      return initialCampaigns.filter(c => c.status === 'Active' || c.status === 'Upcoming');
  }, [initialCampaigns]);


  const campaignStatusColors: Record<string, string> = {
    "Active": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  };
  
  const handleDonateClick = () => {
    // This will redirect to login, and the login page should handle redirecting back to /donate
    sessionStorage.setItem('redirectAfterLogin', '/donate');
    router.push('/login');
  }

   if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex-1 space-y-8">
      {/* Hero Section */}
      <Card className="text-center shadow-lg bg-primary/5">
        <CardHeader>
        <CardTitle className="text-4xl md:text-5xl font-extrabold font-headline text-primary">Your small help can make a large impact.</CardTitle>
        <CardDescription className="max-w-2xl mx-auto text-lg text-muted-foreground pt-2">
            Join BaitulMal Samajik Sanstha (Solapur) to make a lasting impact. Your contribution brings hope, changes lives, and empowers our community.
        </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex justify-center gap-4">
            <Button size="lg" onClick={handleDonateClick}>
            Donate Now <HandHeart className="ml-2" />
            </Button>
        </div>
        </CardContent>
      </Card>
      
      <InspirationalQuotes quotes={initialQuotes} loading={false} />

      {/* Impact Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mainMetrics.map((metric) => (
              <Link href={metric.href} key={metric.title}>
                <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    </CardContent>
                </Card>
              </Link>
          ))}
      </div>

      {/* Open Cases */}
      <Card>
          <CardHeader>
              <CardTitle>General Help Cases</CardTitle>
              <CardDescription>These are verified, individual cases that need your direct support right now.</CardDescription>
          </CardHeader>
          <CardContent>
              {initialLeads.length > 0 ? (
                  <div className="space-y-4">
                      {initialLeads.slice(0, 3).map(lead => {
                          const progress = lead.helpRequested > 0 ? (lead.helpGiven / lead.helpRequested) * 100 : 100;
                          const remainingAmount = lead.helpRequested - lead.helpGiven;
                          return (
                          <div key={lead.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="flex-grow">
                                  <p className="font-semibold">{lead.name}</p>
                                  <p className="text-sm text-muted-foreground">{lead.purpose} - {lead.category}</p>
                                  <Progress value={progress} className="my-2" />
                                  <p className="text-xs text-muted-foreground">
                                      <span className="font-bold text-primary">₹{remainingAmount.toLocaleString()}</span> still needed of ₹{lead.helpRequested.toLocaleString()} goal.
                                  </p>
                              </div>
                              <Button asChild size="sm">
                                  <Link href={`/donate?leadId=${lead.id}`}>Donate</Link>
                              </Button>
                          </div>
                          );
                      })}
                  </div>
              ) : (
                  <div className="text-center py-6">
                      <p className="text-muted-foreground">All general cases are currently funded. Please check back soon!</p>
                      <Button className="mt-4" onClick={handleDonateClick}>
                          Donate to Organization
                      </Button>
                  </div>
              )}
          </CardContent>
          {initialLeads.length > 0 && (
              <CardFooter>
                  <Button asChild variant="secondary" className="w-full">
                      <Link href="/public-leads">View All General Cases <ArrowRight className="ml-2" /></Link>
                  </Button>
              </CardFooter>
          )}
      </Card>
      
       {/* Campaigns */}
       {activeAndUpcomingCampaigns.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="text-primary"/>
                    Active Campaigns
                </CardTitle>
                <CardDescription>
                    These are our focused fundraising drives for specific, large-scale projects.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeAndUpcomingCampaigns.slice(0,3).map((campaign) => (
                    <Card key={campaign.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start gap-4">
                                <CardTitle>{campaign.name}</CardTitle>
                                 <Badge variant="outline" className={cn("capitalize flex-shrink-0", campaignStatusColors[campaign.status])}>
                                    {campaign.status}
                                </Badge>
                            </div>
                            <CardDescription>
                                Goal: <span className="font-bold text-foreground">₹{campaign.goal.toLocaleString()}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description || "No details provided."}</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" asChild><Link href={`/donate?campaignId=${campaign.id}`}>Support this Campaign</Link></Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
             <CardFooter>
                <Button variant="secondary" className="w-full" asChild><Link href="/campaigns">View All Campaigns <ArrowRight className="ml-2" /></Link></Button>
            </CardFooter>
        </Card>
       )}
    </div>
  );
}
