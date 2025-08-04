

// In a real app, this would be a server component fetching data for the logged-in user.
// For now, we'll keep it as a client component and simulate the data fetching.
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle, Quote as QuoteIcon, Search, FilterX, Target, ChevronLeft, ChevronRight, Check, Save, FilePlus2 } from "lucide-react";
import { getDonationsByUserId } from "@/services/donation-service";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getRandomQuotes } from "@/services/quotes-service";
import type { User, Donation, Lead, Quote, LeadPurpose, LeadStatus } from "@/services/types";
import { getOpenLeads, EnrichedLead } from "@/app/campaigns/actions";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { updateUser } from "@/services/user-service";
import { useToast } from "@/hooks/use-toast";

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
      dashboardContent = <DonorDashboard donations={donations} openLeads={openLeads} quotes={quotes} user={user} />;
    } else if (activeRole === 'Beneficiary') {
      dashboardContent = <BeneficiaryDashboard cases={cases} quotes={quotes} />;
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


function DonorDashboard({ donations, openLeads, quotes, user }: { donations: Donation[], openLeads: EnrichedLead[], quotes: Quote[], user: User }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();
  const [purposeInput, setPurposeInput] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  
  const [appliedFilters, setAppliedFilters] = useState({
      purpose: 'all',
      search: ''
  });

  const [monthlyPledgeEnabled, setMonthlyPledgeEnabled] = useState(user.monthlyPledgeEnabled || false);
  const [monthlyPledgeAmount, setMonthlyPledgeAmount] = useState(user.monthlyPledgeAmount || 0);
  const [isSavingPledge, setIsSavingPledge] = useState(false);

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
  
  const handleSavePledge = async () => {
    setIsSavingPledge(true);
    try {
        await updateUser(user.id!, {
            monthlyPledgeEnabled,
            monthlyPledgeAmount: Number(monthlyPledgeAmount)
        });
        toast({ variant: 'success', title: 'Pledge Updated', description: 'Your monthly donation pledge has been saved.' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save your pledge.' });
        console.error(e);
    } finally {
        setIsSavingPledge(false);
    }
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

       <Card>
            <CardHeader>
                <CardTitle>My Monthly Pledge</CardTitle>
                <CardDescription>Set a monthly goal for your contributions. We'll help you keep track.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="monthly-pledge-switch" className="text-base">Enable Monthly Pledge</Label>
                        <p className="text-sm text-muted-foreground">I commit to donating monthly to support ongoing cases.</p>
                    </div>
                    <Switch
                        id="monthly-pledge-switch"
                        checked={monthlyPledgeEnabled}
                        onCheckedChange={setMonthlyPledgeEnabled}
                    />
                </div>
                {monthlyPledgeEnabled && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-2">
                            <Label htmlFor="pledge-amount">My Monthly Pledge Amount (₹)</Label>
                            <Input
                                id="pledge-amount"
                                type="number"
                                value={monthlyPledgeAmount}
                                onChange={(e) => setMonthlyPledgeAmount(Number(e.target.value))}
                                placeholder="e.g., 500"
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={handleSavePledge} disabled={isSavingPledge}>
                                {isSavingPledge ? <Loader2 className="animate-spin" /> : <Save />}
                                Save Pledge
                            </Button>
                            <Button onClick={() => router.push('/campaigns')} variant="secondary">
                                Fulfill Pledge Now
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

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

const statusColors: Record<LeadStatus, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
};

function BeneficiaryDashboard({ cases, quotes }: { cases: Lead[], quotes: Quote[] }) {
    const isMobile = useIsMobile();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const paginatedCases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return cases.slice(startIndex, startIndex + itemsPerPage);
    }, [cases, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(cases.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const renderDesktopTable = () => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[30%]">Funding Progress</TableHead>
                    <TableHead className="text-right">Amount Requested</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedCases.map((caseItem) => {
                    const progress = caseItem.helpRequested > 0 ? (caseItem.helpGiven / caseItem.helpRequested) * 100 : 100;
                    const remainingAmount = caseItem.helpRequested - caseItem.helpGiven;
                    const donationCount = caseItem.donations?.length || 0;
                    return (
                        <TableRow key={caseItem.id}>
                            <TableCell>{format(caseItem.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                            <TableCell>{caseItem.purpose}{caseItem.category && ` (${caseItem.category})`}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[caseItem.status])}>
                                    {caseItem.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    <Progress value={progress}  />
                                    <div className="text-xs text-muted-foreground flex justify-between">
                                        <span>Raised: <span className="font-semibold text-foreground">₹{caseItem.helpGiven.toLocaleString()}</span></span>
                                        {remainingAmount > 0 && <span className="text-destructive">Pending: ₹{remainingAmount.toLocaleString()}</span>}
                                    </div>
                                     <span className="text-xs text-muted-foreground">{donationCount} allocation(s) from organization</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">₹{caseItem.helpRequested.toLocaleString()}</TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    );

     const renderMobileCards = () => (
        <div className="space-y-4">
            {paginatedCases.map((caseItem, index) => {
                const progress = caseItem.helpRequested > 0 ? (caseItem.helpGiven / caseItem.helpRequested) * 100 : 100;
                const remainingAmount = caseItem.helpRequested - caseItem.helpGiven;
                const donationCount = caseItem.donations?.length || 0;
                return (
                    <Card key={caseItem.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">For: {caseItem.purpose}</CardTitle>
                                    <CardDescription>Submitted: {format(caseItem.createdAt.toDate(), "dd MMM yyyy")}</CardDescription>
                                </div>
                                <Badge variant="outline" className={cn("capitalize", statusColors[caseItem.status])}>
                                    {caseItem.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-semibold">Goal</span>
                                    <span className="font-semibold">₹{caseItem.helpRequested.toLocaleString()}</span>
                                </div>
                                <Progress value={progress} />
                                <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                                    <span>Raised: ₹{caseItem.helpGiven.toLocaleString()}</span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                 <div className="flex justify-between text-xs mt-1">
                                    <span className="text-destructive">Pending: ₹{remainingAmount.toLocaleString()}</span>
                                    <span>{donationCount} allocation(s)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    );
    
     const renderPaginationControls = () => (
        <div className="flex items-center justify-end pt-4 gap-4">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next</span>
                    </Button>
                </div>
        </div>
    );


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="text-primary" />
                                My Case History
                            </CardTitle>
                            <CardDescription>
                            Here is the status of all your help requests.
                            </CardDescription>
                        </div>
                         <div className="flex flex-col sm:flex-row gap-2">
                            <Button asChild variant="secondary">
                                <Link href="/request-help"><FilePlus2 className="mr-2" />Request Help</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/campaigns"><HandHeart className="mr-2" />Donate Now</Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {cases.length > 0 ? (
                        <>
                            {isMobile ? renderMobileCards() : renderDesktopTable()}
                            {totalPages > 1 && renderPaginationControls()}
                        </>
                    ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">You have not submitted any help requests.</p>
                        <Button asChild className="mt-4">
                            <Link href="/request-help">Request Help Now</Link>
                        </Button>
                    </div>
                    )}
                </CardContent>
                 {cases.length > 0 && (
                     <CardFooter>
                        <Button asChild variant="secondary" className="w-full">
                            <Link href="/my-cases">
                                View Full Case History <ArrowRight className="ml-2" />
                            </Link>
                        </Button>
                    </CardFooter>
                )}
                </Card>
            </div>
            <div className="lg:col-span-1">
                <InspirationalQuotes quotes={quotes} loading={false} />
            </div>
        </div>
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
