
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, Quote as QuoteIcon } from "lucide-react";
import type { Quote, Lead, Campaign, Donation, User } from "@/services/types";
import { Progress } from '@/components/ui/progress';
import { useEffect, useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { getQuotes, getOpenGeneralLeads, getPublicDashboardData } from "./actions";
import { RecentCampaignsCard, TopDonationsCard, BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/app/admin/dashboard-cards";
import { PublicMainMetricsCard } from "./public-dashboard-cards";


function InspirationalQuotes() {
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState<Quote[]>([]);

    useEffect(() => {
        const fetchQuotes = async () => {
             setLoading(true);
             const fetchedQuotes = await getQuotes(3);
             setQuotes(fetchedQuotes);
             setLoading(false);
        }
        fetchQuotes();
    }, []);

    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <QuoteIcon />
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
                <CardTitle className="flex items-center gap-2 text-primary">
                    <QuoteIcon />
                    Wisdom & Reflection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {quotes.map((quote, index) => (
                        <blockquote key={index} className="border-l-2 pl-4 italic text-sm text-muted-foreground">
                            <p>&quot;{quote.text}&quot;</p>
                            <cite className="block text-right not-italic text-xs mt-1">— {quote.source}</cite>
                        </blockquote>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function PublicHomePage() {
  const router = useRouter();
  const [initialLeads, setOpenLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
        setLoading(true);
        try {
            const [leadsData, publicData] = await Promise.all([
                getOpenGeneralLeads(),
                getPublicDashboardData(),
            ]);
            setOpenLeads(leadsData);
            if (publicData && !publicData.error) {
                const activeAndUpcomingCampaigns = (publicData.campaigns || []).filter(
                    (c: Campaign) => c.status === 'Active' || c.status === 'Upcoming'
                );
                setCampaigns(activeAndUpcomingCampaigns);
                setAllLeads(publicData.leads || []);
                setAllDonations(publicData.donations || []);
                setAllUsers(publicData.users || []);
            }
        } catch (e) {
            console.error("Failed to fetch public data", e);
        } finally {
            setLoading(false);
        }
    };
    fetchPublicData();
  }, []);
  
  const handleDonateClick = (leadId?: string) => {
    const userId = localStorage.getItem('userId');
    const path = leadId ? `/donate?leadId=${leadId}` : '/donate';
    if (userId) {
        router.push(path);
    } else {
        sessionStorage.setItem('redirectAfterLogin', path);
        router.push('/login');
    }
  }

  if (loading) {
      return (
          <div className="flex flex-col flex-1 items-center justify-center h-full">
              <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
              <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
          </div>
      );
  }

  return (
    <div className="flex-1 space-y-8">
      <Card className="text-center shadow-lg bg-primary/5">
        <CardHeader>
        <CardTitle className="text-4xl md:text-5xl font-extrabold font-headline text-primary">Empowering Our Community, One Act of Kindness at a Time.</CardTitle>
        <CardDescription className="max-w-2xl mx-auto text-lg text-muted-foreground pt-2">
            Join BaitulMal Samajik Sanstha (Solapur) to make a lasting impact. Your contribution brings hope, changes lives, and empowers our community.
        </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => handleDonateClick()}>
            Donate Now <HandHeart className="ml-2" />
            </Button>
        </div>
        </CardContent>
      </Card>
      
      <PublicMainMetricsCard allDonations={allDonations} allLeads={allLeads} />

      <InspirationalQuotes />

      <Card>
          <CardHeader>
              <CardTitle className="text-primary">General Help Cases</CardTitle>
              <CardDescription className="text-muted-foreground">These are verified, individual cases that need your direct support right now.</CardDescription>
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
                      <Button className="mt-4" onClick={() => handleDonateClick()}>
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
      
      <RecentCampaignsCard allCampaigns={campaigns} allLeads={allLeads} />

    </div>
  );
}
