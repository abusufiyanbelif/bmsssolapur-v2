

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, Quote as QuoteIcon } from "lucide-react";
import type { Quote, Lead } from "@/services/types";
import { Progress } from '@/components/ui/progress';
import { useEffect, useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { getQuotes, getOpenGeneralLeads } from "./actions";

function InspirationalQuotes({ quotes: initialQuotes }: { quotes: Quote[] }) {
    const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
    const [loading, setLoading] = useState(initialQuotes.length === 0);

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const fetchedQuotes = await getQuotes(3);
                setQuotes(fetchedQuotes);
            } catch (err) {
                console.error("Failed to fetch quotes on client:", err);
            } finally {
                setLoading(false);
            }
        };

        if (initialQuotes.length === 0) {
            fetchQuotes();
        }
    }, [initialQuotes]);


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
                            <p>&quot;{quote.text}&quot;</p>
                            <cite className="block text-right not-italic text-xs text-muted-foreground mt-1">— {quote.source}</cite>
                        </blockquote>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function PublicHomePage({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  
  useEffect(() => {
      const fetchData = async () => {
          setLeadsLoading(true);
          const fetchedLeads = await getOpenGeneralLeads();
          if(fetchedLeads) {
            setLeads(fetchedLeads);
          }
          setLeadsLoading(false);
      };
      fetchData();
  }, []);

  const handleDonateClick = () => {
    sessionStorage.setItem('redirectAfterLogin', '/donate');
    router.push('/login');
  }

  return (
    <div className="flex-1 space-y-8">
      {/* Hero Section */}
      <Card className="text-center shadow-lg bg-primary/5">
        <CardHeader>
        <CardTitle className="text-4xl md:text-5xl font-extrabold font-headline text-primary">Empowering Our Community, One Act of Kindness at a Time.</CardTitle>
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
      
      <InspirationalQuotes quotes={quotes} />

      {/* Open Cases */}
      <Card>
          <CardHeader>
              <CardTitle>General Help Cases</CardTitle>
              <CardDescription>These are verified, individual cases that need your direct support right now.</CardDescription>
          </CardHeader>
          <CardContent>
              {leadsLoading ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : leads && leads.length > 0 ? (
                  <div className="space-y-4">
                      {leads.slice(0, 3).map(lead => {
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
          {leads && leads.length > 0 && (
              <CardFooter>
                  <Button asChild variant="secondary" className="w-full">
                      <Link href="/public-leads">View All General Cases <ArrowRight className="ml-2" /></Link>
                  </Button>
              </CardFooter>
          )}
      </Card>
    </div>
  );
}
