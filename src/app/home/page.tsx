
// In a real app, this would be a server component fetching data for the logged-in user.
// For now, we'll keep it as a client component and simulate the data fetching.
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle, Quote as QuoteIcon, Search, FilterX, Target } from "lucide-react";
import { getDonationsByUserId } from "@/services/donation-service";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getRandomQuotes } from "@/services/quotes-service";
import type { User, Donation, Lead, Quote, LeadPurpose } from "@/services/types";
import { getOpenLeads, EnrichedLead } from "@/app/campaigns/actions";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserHomePageProps {
  user: (User & { isLoggedIn: boolean; }) | null;
  activeRole: string;
}

export default function UserHomePage({ user, activeRole }: UserHomePageProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [cases, setCases] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [openLeads, setOpenLeads] = useState<EnrichedLead[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.isLoggedIn || !activeRole) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        setDonations([]);
        setCases([]);
        setOpenLeads([]);

        if (activeRole === 'Donor') {
          const [donorDonations, availableLeads] = await Promise.all([
             getDonationsByUserId(user.id!),
             getOpenLeads()
          ]);
          setDonations(donorDonations);
          setOpenLeads(availableLeads);
        } else if (activeRole === 'Beneficiary') {
          const beneficiaryCases = await getLeadsByBeneficiaryId(user.id!);
          setCases(beneficiaryCases);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        setError(`Failed to load dashboard data: ${errorMessage}`);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchQuotes = async () => {
        setQuotesLoading(true);
        const randomQuotes = await getRandomQuotes(3);
        setQuotes(randomQuotes);
        setQuotesLoading(false);
    }
    
    fetchDashboardData();
    fetchQuotes();

  }, [user, activeRole]);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    if (!user || !user.isLoggedIn) {
       return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Logged In</AlertTitle>
          <AlertDescription>Please log in to view your dashboard.</AlertDescription>
        </Alert>
      );
    }

    let dashboardContent;
    if (activeRole === 'Donor') {
      dashboardContent = <DonorDashboard donations={donations} openLeads={openLeads} quotes={quotes} />;
    } else if (activeRole === 'Beneficiary') {
      dashboardContent = <BeneficiaryDashboard cases={cases} />;
    } else if (['Admin', 'Super Admin', 'Finance Admin'].includes(activeRole)) {
        dashboardContent = (
            <Card>
                <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>Welcome to the admin control panel. Use the navigation menu to manage users, donations, and leads.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/admin">Go to Full Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    } else {
        dashboardContent = <p>You do not have a role that has a default dashboard. Please select a role from your profile.</p>;
    }

    return dashboardContent;
  };
  
  return (
    <div className="flex-1 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
            Welcome{loading || !user?.isLoggedIn ? '' : `, ${user?.name || 'Guest'}`}!
        </h2>
        <p className="text-muted-foreground">
          {activeRole && user?.isLoggedIn ? (
            <>You are currently viewing the dashboard as a <span className="font-semibold text-primary">{activeRole}</span>.</>
          ) : (
            "Please log in to continue."
          )}
        </p>
      </div>
      {renderContent()}
    </div>
  );
}


function DonorDashboard({ donations, openLeads, quotes }: { donations: Donation[], openLeads: EnrichedLead[], quotes: Quote[] }) {
  const isMobile = useIsMobile();
  const [purposeInput, setPurposeInput] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  
  const [appliedFilters, setAppliedFilters] = useState({
      purpose: 'all',
      search: ''
  });

  const handleSearch = () => {
    setAppliedFilters({
        purpose: purposeInput,
        search: searchInput
    })
  };

  const resetFilters = () => {
    setPurposeInput('all');
    setSearchInput('');
    setAppliedFilters({ purpose: 'all', search: '' });
  };

  const totalDonated = useMemo(() => {
    return donations.reduce((sum, d) => sum + d.amount, 0);
  }, [donations]);

  const uniqueCampaignsFunded = useMemo(() => {
    const leadIds = new Set();
    donations.forEach(d => {
      if(d.allocations) {
        d.allocations.forEach(a => leadIds.add(a.leadId));
      }
    });
    return leadIds.size;
  }, [donations]);

  const filteredLeads = useMemo(() => {
    return openLeads.filter(lead => {
      const purposeMatch = appliedFilters.purpose === 'all' || lead.purpose === appliedFilters.purpose;
      const searchMatch = appliedFilters.search === '' || 
        lead.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        (lead.caseDetails && lead.caseDetails.toLowerCase().includes(appliedFilters.search.toLowerCase()));
      return purposeMatch && searchMatch;
    });
  }, [openLeads, appliedFilters]);
  
  const purposeOptions: (LeadPurpose | 'all')[] = ["all", "Education", "Medical", "Relief Fund", "Deen"];

  const stats = [
    { title: "Total Donated", value: `₹${totalDonated.toLocaleString()}`, icon: HandHeart },
    { title: "Donations Made", value: donations.length, icon: FileText },
    { title: "Campaigns Supported", value: uniqueCampaignsFunded, icon: Target },
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Open Cases and Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Open Cases for Funding</CardTitle>
                    <CardDescription>Browse verified cases that need your support. Your contribution can make a difference.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="search">Search Cases</Label>
                            <Input id="search" placeholder="Search by name or details..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="purposeFilter">Filter by Purpose</Label>
                            <Select value={purposeInput} onValueChange={setPurposeInput}>
                                <SelectTrigger id="purposeFilter"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {purposeOptions.map(p => <SelectItem key={p} value={p} className="capitalize">{p === 'all' ? 'All Purposes' : p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2 md:flex-col lg:flex-row">
                            <Button onClick={handleSearch} className="w-full">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                             <Button onClick={resetFilters} variant="outline" className="w-full">
                                <FilterX className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        </div>
                    </div>

                    {filteredLeads.length > 0 ? (
                        <div className="space-y-4">
                            {filteredLeads.slice(0, 4).map(lead => {
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
                                        <Link href="/campaigns">Donate</Link>
                                    </Button>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-6">No cases match your filters. Try clearing them.</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/campaigns">View All Open Cases <ArrowRight className="ml-2" /></Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <InspirationalQuotes quotes={quotes} loading={false} />
        </div>
      </div>
      
      {/* Recent Donations */}
       <Card>
        <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>A look at your latest contributions.</CardDescription>
        </CardHeader>
        <CardContent>
            {donations.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sr. No.</TableHead>
                            <TableHead>Date</TableHead>
                            {!isMobile && <TableHead>Type</TableHead>}
                            {!isMobile && <TableHead>Purpose</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {donations.slice(0, 5).map((d, index) => (
                            <TableRow key={d.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{format(d.createdAt.toDate(), 'dd MMM yyyy')}</TableCell>
                                {!isMobile && <TableCell>{d.type}</TableCell>}
                                {!isMobile && <TableCell>{d.purpose || 'N/A'}</TableCell>}
                                <TableCell> <Badge variant={d.status === 'Verified' ? 'default' : 'secondary'}>{d.status}</Badge></TableCell>
                                <TableCell className="text-right font-semibold">₹{d.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ): (
                <p className="text-muted-foreground text-center py-4">No recent donations found.</p>
            )}
        </CardContent>
        <CardFooter>
            <Button asChild variant="secondary" className="w-full">
            <Link href="/my-donations">
                View All My Donations <ArrowRight className="ml-2" />
            </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function BeneficiaryDashboard({ cases }: { cases: Lead[] }) {
    return (
     <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="text-primary" />
          Recent Cases
        </CardTitle>
        <CardDescription>
          Here is the latest status of your help requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
         {cases.length > 0 ? (
          <ul className="space-y-4">
            {cases.slice(0,3).map(c => (
              <li key={c.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">For: {c.purpose}</p>
                  <p className="text-sm text-muted-foreground">Requested: ₹{c.helpRequested.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <Badge variant={c.status === 'Closed' ? 'default' : 'secondary'}>{c.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{format(c.createdAt.toDate(), "dd MMM yyyy")}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">No recent cases found.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/my-cases">
            View All My Cases <ArrowRight className="ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
    )
}

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
                <CardDescription>
                    A little inspiration for your journey.
                </CardDescription>
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
