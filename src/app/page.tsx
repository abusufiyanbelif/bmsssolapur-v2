

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle, Quote as QuoteIcon, Search, FilterX, Target, CheckCircle, HandCoins, PiggyBank, Hourglass, Users, TrendingUp, Megaphone } from "lucide-react";
import { getOpenGeneralLeads, EnrichedLead, getActiveCampaigns } from "@/app/campaigns/actions";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getRandomQuotes } from "@/services/quotes-service";
import type { User, Lead, Quote, Campaign } from "@/services/types";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useMemo } from "react";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers } from "@/services/user-service";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


function InspirationalQuotes({ quotes, loading }: { quotes: Quote[], loading: boolean }) {
    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QuoteIcon className="text-primary" />
                        Food for Thought
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
                    Food for Thought
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

function PublicHomePage() {
  const [openLeads, setOpenLeads] = useState<EnrichedLead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [allDonations, setAllDonations] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [
          leads,
          randomQuotes,
          donations,
          allLeadsData,
          campaigns,
        ] = await Promise.all([
          getOpenGeneralLeads(),
          getRandomQuotes(3),
          getAllDonations(),
          getAllLeads(),
          getActiveCampaigns(),
        ]);
        setOpenLeads(leads);
        setQuotes(randomQuotes);
        setAllDonations(donations);
        setAllLeads(allLeadsData);
        setAllCampaigns(campaigns);
      } catch (e) {
        setError("Failed to load page data. Please try again later.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const {
    totalRaised,
    totalDistributed,
    pendingToDisburse,
    beneficiariesHelpedCount,
    casesClosed,
    casesPending,
  } = useMemo(() => {
    const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
    const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
    const pendingToDisburse = Math.max(0, totalRaised - totalDistributed);
    const helpedBeneficiaryIds = new Set(allLeads.map(l => l.beneficiaryId));
    const beneficiariesHelpedCount = helpedBeneficiaryIds.size;
    const casesClosed = allLeads.filter(l => l.status === 'Closed').length;
    const casesPending = allLeads.filter(l => l.status === 'Pending' || l.status === 'Partial').length;
    return { totalRaised, totalDistributed, pendingToDisburse, beneficiariesHelpedCount, casesClosed, casesPending };
  }, [allDonations, allLeads]);

  const mainMetrics = [
    { title: "Total Verified Funds", value: `₹${totalRaised.toLocaleString()}`, icon: TrendingUp },
    { title: "Total Distributed", value: `₹${totalDistributed.toLocaleString()}`, icon: HandCoins },
    { title: "Funds in Hand", value: `₹${pendingToDisburse.toLocaleString()}`, icon: PiggyBank },
    { title: "Cases Closed", value: casesClosed.toString(), icon: CheckCircle },
    { title: "Cases Pending", value: casesPending.toString(), icon: Hourglass },
    { title: "Beneficiaries Helped", value: beneficiariesHelpedCount.toString(), icon: Users },
  ];

  const campaignStatusColors: Record<string, string> = {
    "Active": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  };


  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
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
          <CardTitle className="text-4xl md:text-5xl font-extrabold font-headline text-primary">Join Us in Making a Difference</CardTitle>
          <CardDescription className="max-w-2xl mx-auto text-lg text-muted-foreground pt-2">
            Your contribution, big or small, empowers us to provide essential aid for education, health, and relief to those in need in Solapur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/donate">Donate Now <HandHeart className="ml-2" /></Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Register / Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Impact Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mainMetrics.map((metric) => (
              <Card key={metric.title} className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  </CardContent>
              </Card>
          ))}
      </div>

       {/* Campaigns */}
       {allCampaigns.length > 0 && (
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
                {allCampaigns.slice(0,3).map((campaign) => (
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

      {/* Open Cases and Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Open General Cases</CardTitle>
                    <CardDescription>These are verified, individual cases that need your direct support right now.</CardDescription>
                </CardHeader>
                <CardContent>
                    {openLeads.length > 0 ? (
                        <div className="space-y-4">
                            {openLeads.slice(0, 3).map(lead => {
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
                        <p className="text-center text-muted-foreground py-6">All general cases are currently funded. Please check back soon!</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/public-leads">View All General Cases <ArrowRight className="ml-2" /></Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="lg:col-span-1">
           <InspirationalQuotes quotes={quotes} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default PublicHomePage;

