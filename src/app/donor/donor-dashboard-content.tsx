
'use client';

import { useState, useEffect, useMemo, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { ArrowRight, HandHeart, FileText, Loader2, Quote as QuoteIcon, Search, FilterX, Target, CheckCircle, HandCoins, Banknote, Hourglass, Users as UsersIcon, TrendingUp, Megaphone, Repeat, History, FileCheck, DollarSign, Baby, PersonStanding, HomeIcon, HeartHandshake, Eye } from "lucide-react";
import { getDonationsByUserId, getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { User, Donation, Lead, Quote, LeadPurpose, DonationType, Campaign, AppSettings } from "@/services/types";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllUsers, getUser } from "@/services/user-service";
import { getOpenGeneralLeads, EnrichedLead } from "@/app/campaigns/actions";
import { getAllCampaigns } from "@/services/campaign-service";
import { BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/components/dashboard-cards";
import { MainMetricsCard, FundsInHandCard } from "@/app/admin/dashboard-cards";
import { getAppSettings } from "@/services/app-settings-service";

const statusColors: Record<Donation['status'], string> = {
    "Pending verification": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Verified": "bg-green-500/20 text-green-700 border-green-500/30",
    "Failed/Incomplete": "bg-red-500/20 text-red-700 border-red-500/30",
    "Partially Allocated": "bg-orange-500/20 text-orange-700 border-orange-500/30",
    "Allocated": "bg-blue-500/20 text-blue-700 border-blue-500/30",
};

export function DonorDashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openLeads, setOpenLeads] = useState<EnrichedLead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const isMobile = useIsMobile();
  const router = useRouter();

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
              const [fetchedUser, donorDonations, availableLeads, fetchedAllLeads, fetchedSettings] = await Promise.all([
                  getUser(storedUserId),
                  getDonationsByUserId(storedUserId),
                  getOpenGeneralLeads(),
                  getAllLeads(),
                  getAppSettings(),
              ]);

              if (!fetchedUser || !fetchedUser.roles.includes('Donor')) {
                  setError("You do not have permission to view this page.");
                  setLoading(false);
                  return;
              }
              setUser(fetchedUser);
              setDonations(donorDonations);
              setOpenLeads(availableLeads);
              setAllLeads(fetchedAllLeads);
              setSettings(fetchedSettings);
          } catch (e) {
              setError("Failed to load dashboard data.");
              console.error(e);
          } finally {
              setLoading(false);
          }
      };

      fetchInitialData();
  }, []);

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
        { id: 'donorContributionSummary', title: "My Total Contributions", value: `₹${myTotalDonated.toLocaleString()}`, icon: HandHeart, description: "Your total verified contributions." },
        { id: 'donorContributionSummary', title: "Total Donations Made", value: myDonationCount.toString(), icon: History, description: "The total number of donations you have made." },
    ];
    
    const impactMetrics = [
        { id: 'donorImpactSummary', title: "Leads Supported", value: leadsHelpedCount, icon: FileCheck, description: "The number of individual cases you've helped fund." },
        { id: 'donorImpactSummary', title: "Beneficiaries Helped", value: myBeneficiariesHelpedCount, icon: UsersIcon, description: "The number of unique people you've supported." },
        { id: 'donorImpactSummary', title: "Campaigns Supported", value: campaignsSupportedCount, icon: Megaphone, description: "The number of special campaigns you've contributed to." },
    ];


  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  if (error || !user || !settings) {
    return null;
  }
  
  const dashboardSettings = settings.dashboard;
  
  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
                Donor Dashboard
            </h2>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}. Thank you for your continued support.
            </p>
        </div>

        <div className="space-y-4">
            <Suspense fallback={<div>Loading...</div>}>
                <MainMetricsCard isPublicView={true} />
            </Suspense>
        </div>

        {dashboardSettings?.donorContributionSummary?.visibleTo.includes('Donor') && (
            <Card>
                <CardHeader>
                    <CardTitle>My Contributions</CardTitle>
                    <CardDescription>Your personal giving summary.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {donorMetrics.map((metric) => (
                        <Link href="/my-donations" key={metric.title}>
                            <div className="p-4 border rounded-lg bg-primary/5 h-full hover:bg-primary/10 transition-colors">
                                <metric.icon className="h-6 w-6 text-primary mb-2" />
                                <p className="text-2xl font-bold text-primary">{metric.value}</p>
                                <p className="text-sm font-medium text-foreground">{metric.title}</p>
                                <p className="text-xs text-muted-foreground">{metric.description}</p>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        )}
        
        {dashboardSettings?.donorImpactSummary?.visibleTo.includes('Donor') && (
            <Card>
                <CardHeader>
                    <CardTitle>My Direct Impact</CardTitle>
                    <CardDescription>A summary of the direct impact your donations have made.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    {impactMetrics.map((metric) => (
                        <Link href="/my-donations" key={metric.title}>
                            <div className="p-4 border rounded-lg h-full hover:bg-muted transition-colors">
                                <metric.icon className="h-6 w-6 text-muted-foreground mb-2" />
                                <p className="text-2xl font-bold">{metric.value}</p>
                                <p className="text-sm font-medium text-foreground">{metric.title}</p>
                                <p className="text-xs text-muted-foreground">{metric.description}</p>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        )}
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
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {donations.slice(0, 5).map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell>{format((d.donationDate), 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="font-semibold">₹{d.amount.toLocaleString()}</TableCell>
                                    <TableCell> <Badge variant="outline" className={cn("capitalize", statusColors[d.status])}>{d.status}</Badge></TableCell>
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
