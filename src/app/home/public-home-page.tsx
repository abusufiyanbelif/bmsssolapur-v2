
// src/app/home/public-home-page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, Quote as QuoteIcon } from "lucide-react";
import type { Quote, Lead, Campaign, Donation, User, Organization } from "@/services/types";
import { Progress } from '@/components/ui/progress';
import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter } from 'next/navigation';
import { RecentCampaignsCard } from "@/app/admin/dashboard-cards";
import { PublicMainMetricsCard } from "./public-dashboard-cards";

function InspirationalQuotes({ quotes, loading }: { quotes: Quote[], loading: boolean }) {
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

interface PublicHomePageProps {
    publicLeads: Lead[];
    publicCampaigns: Campaign[];
    allLeads: Lead[];
    allDonations: Donation[];
    allUsers: User[];
    organization: Organization | null;
    quotes: Quote[];
    loading: boolean;
}

export function PublicHomePage({ publicLeads, publicCampaigns, allLeads, allDonations, allUsers, organization, quotes, loading }: PublicHomePageProps) {
  const router = useRouter();
  
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

  const heroTitle = organization?.hero?.title || "Empowering Our Community, One Act of Kindness at a Time.";
  const heroDescription = organization?.hero?.description || "Join BaitulMal Samajik Sanstha (Solapur) to make a lasting impact. Your contribution brings hope, changes lives, and empowers our community.";

  return (
    <div className="flex-1 space-y-8">
      <Card className="text-center shadow-lg bg-primary/5">
        <CardHeader>
        <CardTitle className="text-4xl md:text-5xl font-extrabold font-headline text-primary">{heroTitle}</CardTitle>
        <CardDescription className="max-w-2xl mx-auto text-lg text-muted-foreground pt-2">
            {heroDescription}
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

      <InspirationalQuotes quotes={quotes} loading={loading} />

      <Card>
          <CardHeader>
              <CardTitle className="text-primary">General Help Cases</CardTitle>
              <CardDescription className="text-muted-foreground">These are verified, individual cases that need your direct support right now.</CardDescription>
          </CardHeader>
          <CardContent>
              {publicLeads.length > 0 ? (
                  <div className="space-y-4">
                      {publicLeads.slice(0, 3).map(lead => {
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
          {publicLeads.length > 0 && (
              <CardFooter>
                  <Button asChild variant="secondary" className="w-full">
                      <Link href="/public-leads">View All General Cases <ArrowRight className="ml-2" /></Link>
                  </Button>
              </CardFooter>
          )}
      </Card>
      
      <RecentCampaignsCard allCampaigns={publicCampaigns} allLeads={allLeads} />

    </div>
  );
}
