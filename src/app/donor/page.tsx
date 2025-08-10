
// In a real app, this would be a server component fetching data for the logged-in user.
// For now, we'll keep it as a client component and simulate the data fetching.
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle, Quote as QuoteIcon, Search, FilterX, Target, CheckCircle, HandCoins, Banknote, Hourglass, Users as UsersIcon, TrendingUp, Megaphone, HeartHandshake, Baby, PersonStanding, HomeIcon, DollarSign, Wheat, Gift, Building, Shield, History, PackageOpen, FileCheck } from "lucide-react";
import { getDonationsByUserId, getAllDonations } from "@/services/donation-service";
import { getLeadsByBeneficiaryId, getAllLeads } from "@/services/lead-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getRandomQuotes } from "@/services/quotes-service";
import type { User, Donation, Lead, Quote, LeadPurpose, DonationType, Campaign } from "@/services/types";
import { getAllUsers, getUser } from "@/services/user-service";
import { getOpenGeneralLeads, EnrichedLead } from "@/app/campaigns/actions";
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
import { getAllCampaigns } from "@/services/campaign-service";

interface DonorDashboardPageProps {
  user: (User & { isLoggedIn: boolean; }) | null;
}

export default function DonorDashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [openLeads, setOpenLeads] = useState<EnrichedLead[]>([]);
    
    // For common stats
    const [allDonations, setAllDonations] = useState<Donation[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const storedUserId = localStorage.getItem('userId');
            if (!storedUserId) {
                setError("No user session found. Please log in.");
                setLoading(false);
                return;
            }
            
            try {
                const fetchedUser = await getUser(storedUserId);
                if (!fetchedUser || !fetchedUser.roles.includes('Donor')) {
                    setError("You do not have permission to view this page.");
                    setLoading(false);
                    return;
                }
                setUser(fetchedUser);

                const [donorDonations, availableLeads, fetchedAllLeads, fetchedAllUsers, fetchedAllDonations, fetchedCampaigns] = await Promise.all([
                    getDonationsByUserId(storedUserId),
                    getOpenGeneralLeads(),
                    getAllLeads(),
                    getAllUsers(),
                    getAllDonations(),
                    getAllCampaigns(),
                ]);
                setDonations(donorDonations);
                setOpenLeads(availableLeads);
                setAllLeads(fetchedAllLeads);
                setAllUsers(fetchedAllUsers);
                setAllDonations(fetchedAllDonations);
                setAllCampaigns(fetchedCampaigns);

            } catch (e) {
                setError("Failed to load dashboard data.");
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

        fetchInitialData();
        fetchQuotes();
    }, []);

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
  
  if (!user) {
      return null; // Or a message indicating no user data
  }

  return (
    <div className="flex-1 space-y-6">
       <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
                Donor Dashboard
            </h2>
            <p className="text-muted-foreground">
              Welcome back, {user.name}. Thank you for your continued support.
            </p>
        </div>
      <DonorDashboard 
        donations={donations} 
        openLeads={openLeads} 
        quotes={quotes} 
        allLeads={allLeads} 
        allUsers={allUsers} 
        allDonations={allDonations}
        allCampaigns={allCampaigns}
      />
    </div>
  );
}


function DonorDashboard({ donations, openLeads, quotes, allLeads, allUsers, allDonations, allCampaigns }: { donations: Donation[], openLeads: EnrichedLead[], quotes: Quote[], allLeads: Lead[], allUsers: User[], allDonations: Donation[], allCampaigns: Campaign[] }) {
  const isMobile = useIsMobile();
  const router = useRouter();
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
  
    const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
    const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
    const pendingToDisburse = Math.max(0, totalRaised - totalDistributed);
    const helpedBeneficiaryIds = new Set(allLeads.map(l => l.beneficiaryId));
    const beneficiariesHelpedCount = helpedBeneficiaryIds.size;
    const casesClosed = allLeads.filter(l => l.status === 'Closed').length;
    const casesPending = allLeads.filter(l => l.status === 'Pending' || l.status === 'Partial').length;

    const mainMetrics = [
        { title: "Total Verified Funds", value: `₹${totalRaised.toLocaleString()}`, icon: TrendingUp, description: "Total verified donations received by the Organization." },
        { title: "Total Distributed", value: `₹${totalDistributed.toLocaleString()}`, icon: HandCoins, description: "Total funds given to all beneficiaries." },
        { title: "Funds in Hand", value: `₹${pendingToDisburse.toLocaleString()}`, icon: Banknote, description: "Verified funds ready for disbursement." },
        { title: "Cases Closed", value: casesClosed.toString(), icon: CheckCircle, description: "Total help requests successfully completed." },
        { title: "Cases Pending", value: casesPending.toString(), icon: Hourglass, description: "Total open help requests." },
        { title: "Beneficiaries Helped", value: beneficiariesHelpedCount.toString(), icon: UsersIcon, description: "Total unique individuals and families supported." },
    ];
    
    // Donor specific stats
    const { myTotalDonated, myDonationCount, leadsHelpedCount, beneficiariesHelpedCount: myBeneficiariesHelpedCount, campaignsSupportedCount } = useMemo(() => {
        let myTotalDonated = 0;
        let myDonationCount = 0;
        const helpedLeadIds = new Set<string>();
        const helpedCampaignIds = new Set<string>();

        donations.forEach(donation => {
            if(donation.status === 'Verified' || donation.status === 'Allocated'){
                myTotalDonated += donation.amount;
                if(donation.leadId) helpedLeadIds.add(donation.leadId);
                if(donation.campaignId) helpedCampaignIds.add(donation.campaignId);
            }
            myDonationCount++;
        });

        const helpedBeneficiaryIds = new Set<string>();
        allLeads.forEach(lead => {
            if (lead.id && helpedLeadIds.has(lead.id)) {
                helpedBeneficiaryIds.add(lead.beneficiaryId);
            }
        });

        return { 
            myTotalDonated, 
            myDonationCount,
            leadsHelpedCount: helpedLeadIds.size,
            beneficiariesHelpedCount: helpedBeneficiaryIds.size,
            campaignsSupportedCount: helpedCampaignIds.size,
        };
    }, [donations, allLeads]);

    const donorMetrics = [
        { title: "My Total Contributions", value: `₹${myTotalDonated.toLocaleString()}`, icon: HandHeart, description: "Your total verified contributions." },
        { title: "Total Donations Made", value: myDonationCount.toString(), icon: History, description: "The total number of donations you have made." },
    ];
    
    const impactMetrics = [
        { title: "Leads Supported", value: leadsHelpedCount, icon: FileCheck, description: "The number of individual cases you've helped fund." },
        { title: "Beneficiaries Helped", value: myBeneficiariesHelpedCount, icon: UsersIcon, description: "The number of unique people you've supported." },
        { title: "Campaigns Supported", value: campaignsSupportedCount, icon: Megaphone, description: "The number of special campaigns you've contributed to." },
    ];


  const filteredLeads = useMemo(() => {
    return openLeads.filter(lead => {
      const purposeMatch = appliedFilters.purpose === 'all' || lead.purpose === appliedFilters.purpose;
      const searchMatch = appliedFilters.search === '' || 
        lead.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
        (lead.caseDetails && lead.caseDetails.toLowerCase().includes(appliedFilters.search.toLowerCase()));
      return purposeMatch && searchMatch;
    });
  }, [openLeads, appliedFilters]);
  
  const purposeOptions: (LeadPurpose | 'all')[] = ["all", "Education", "Medical", "Relief Fund", "Deen", "Other"];
  
  const helpedBeneficiaries = allUsers.filter(u => helpedBeneficiaryIds.has(u.id!));
  
  const familiesHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Family').length;
  const adultsHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Adult').length;
  const kidsHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Kid').length;
  const widowsHelpedCount = helpedBeneficiaries.filter(u => u.isWidow).length;
  
  const donationTypeBreakdown = donations
    .filter(d => d.status === 'Verified' || d.status === 'Allocated')
    .reduce((acc, donation) => {
      const type = donation.type;
      if (!acc[type]) {
        acc[type] = { total: 0, count: 0 };
      }
      acc[type].total += donation.amount;
      acc[type].count += 1;
      return acc;
    }, {} as Record<DonationType, { total: number, count: number }>);

  const donationTypeIcons: Record<DonationType, React.ElementType> = {
    'Zakat': HandCoins,
    'Sadaqah': Gift,
    'Fitr': Wheat,
    'Lillah': Building,
    'Kaffarah': Shield,
    'Split': DollarSign,
    'Any': DollarSign,
  }

  const campaignStatusColors: Record<string, string> = {
    "Active": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Completed": "bg-green-500/20 text-green-700 border-green-500/30",
    "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Cancelled": "bg-red-500/20 text-red-700 border-red-500/30",
  };

  
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Organization Impact</CardTitle>
                <CardDescription>A real-time overview of our collective efforts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mainMetrics.map((metric) => (
                    <div key={metric.title} className="p-4 border rounded-lg">
                        <metric.icon className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-sm font-medium text-foreground">{metric.title}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>My Contributions</CardTitle>
                <CardDescription>Your personal giving summary.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {donorMetrics.map((metric) => (
                    <div key={metric.title} className="p-4 border rounded-lg bg-primary/5">
                        <metric.icon className="h-6 w-6 text-primary mb-2" />
                        <p className="text-2xl font-bold text-primary">{metric.value}</p>
                        <p className="text-sm font-medium text-foreground">{metric.title}</p>
                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle>My Direct Impact</CardTitle>
                <CardDescription>A summary of the direct impact your donations have made.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
                {impactMetrics.map((metric) => (
                    <div key={metric.title} className="p-4 border rounded-lg">
                        <metric.icon className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-sm font-medium text-foreground">{metric.title}</p>
                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                ))}
            </CardContent>
        </Card>

      {/* Open Cases and Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Open General Cases</CardTitle>
                    <CardDescription>Browse verified general cases that need your support.</CardDescription>
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
                                        <Link href="/public-leads">Donate</Link>
                                    </Button>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-6">No general cases match your filters. Try clearing them.</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-4">
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/public-leads">View All General Cases <ArrowRight className="ml-2" /></Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <UsersIcon />
                        Beneficiaries Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Link href="/public-leads">
                        <div className="p-3 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                            <HomeIcon className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-lg">{familiesHelpedCount}</p>
                                <p className="text-xs text-muted-foreground">Families Helped</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/public-leads">
                        <div className="p-3 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                            <PersonStanding className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-lg">{adultsHelpedCount}</p>
                                <p className="text-xs text-muted-foreground">Adults Helped</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/public-leads">
                        <div className="p-3 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                            <Baby className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-lg">{kidsHelpedCount}</p>
                                <p className="text-xs text-muted-foreground">Kids Helped</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/public-leads">
                        <div className="p-3 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                            <HeartHandshake className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-lg">{widowsHelpedCount}</p>
                                <p className="text-xs text-muted-foreground">Widows Helped</p>
                            </div>
                        </div>
                    </Link>
                </CardContent>
            </Card>
             <InspirationalQuotes quotes={quotes} loading={false} />
        </div>
      </div>
      
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="text-primary"/>
                    Active &amp; Recent Campaigns
                </CardTitle>
                <CardDescription>
                    An overview of our fundraising campaigns.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {allCampaigns.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allCampaigns.slice(0, 5).map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell>
                                        <div className="font-medium">{campaign.name}</div>
                                        <div className="text-xs text-muted-foreground">{campaign.description.substring(0, 50)}...</div>
                                    </TableCell>
                                    <TableCell>
                                        {format(campaign.startDate as Date, "dd MMM yyyy")} - {format(campaign.endDate as Date, "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(campaignStatusColors[campaign.status])}>{campaign.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-6">No campaigns are currently active.</p>
                )}
            </CardContent>
             <CardFooter>
                <Button variant="secondary" className="w-full" asChild><Link href="/campaigns">View All Campaigns <ArrowRight className="ml-2" /></Link></Button>
            </CardFooter>
        </Card>

      {/* Recent Donations and Breakdown */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Recent Donations</CardTitle>
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
                                            <TableCell>{format(d.donationDate, 'dd MMM yyyy')}</TableCell>
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
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <DollarSign />
                            My Donation Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(donationTypeBreakdown).map(([type, data]) => {
                            const Icon = donationTypeIcons[type as DonationType] || DollarSign;
                            return (
                                <div key={type} className="p-3 border rounded-lg flex items-center gap-4">
                                    <Icon className="h-6 w-6 text-primary" />
                                    <div>
                                        <p className="font-semibold">{type}</p>
                                        <p className="text-sm text-muted-foreground">
                                            ₹{data.total.toLocaleString()} ({data.count} {data.count > 1 ? 'donations' : 'donation'})
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                         {Object.keys(donationTypeBreakdown).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No verified donations to display.</p>
                         )}
                    </CardContent>
                </Card>
            </div>
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
