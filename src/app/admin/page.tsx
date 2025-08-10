

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, HandCoins, Banknote, Hourglass, CheckCircle, AlertTriangle, ArrowRight, Award, Megaphone, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllDonations, DonationType, Donation } from "@/services/donation-service";
import { getAllLeads, Lead } from "@/services/lead-service";
import { getAllUsers, getUser, User } from "@/services/user-service";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DonationsChart } from "./donations-chart";
import { getAllCampaigns, Campaign } from "@/services/campaign-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AppSettings, getAppSettings } from "@/services/app-settings-service";
import type { UserRole } from "@/services/types";
import { BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/components/dashboard-cards";


async function getDashboardData() {
    const [allDonations, allLeads, allUsers, allCampaigns, settings] = await Promise.all([
        getAllDonations(),
        getAllLeads(),
        getAllUsers(),
        getAllCampaigns(),
        getAppSettings(),
    ]);
    return { allDonations, allLeads, allUsers, allCampaigns, settings };
}

// A simple helper function to check card visibility based on settings
const isCardVisible = (cardKey: keyof AppSettings['dashboard'], settings: AppSettings, activeRole?: UserRole) => {
    if (!settings.dashboard?.[cardKey]) {
        return true; // Default to visible if not configured
    }
    const visibleTo = settings.dashboard[cardKey]?.visibleTo || [];
    // Super Admins should see everything by default, regardless of settings
    if (activeRole === 'Super Admin') return true;
    return visibleTo.includes(activeRole || 'Admin');
};


export default async function DashboardPage() {
  // In a real app, we would get the current user's role from the session.
  // For this server component, we'll assume a role for demonstration,
  // but the visibility check logic is what matters.
  // This would be replaced with actual user session logic.
  const currentUserRole: UserRole = "Super Admin"; 

  const { allDonations, allLeads, allUsers, allCampaigns, settings } = await getDashboardData();

  const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
  const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
  const pendingToDisburse = Math.max(0, totalRaised - totalDistributed);
  
  const helpedBeneficiaryIds = new Set(allLeads.filter(l => l.status === 'Closed' || l.status === 'Complete').map(l => l.beneficiaryId));
  const helpedBeneficiaries = allUsers.filter(u => helpedBeneficiaryIds.has(u.id!));
  
  const beneficiariesHelpedCount = helpedBeneficiaries.length;
  
  const casesClosed = allLeads.filter(l => l.status === 'Closed').length;
  const casesPending = allLeads.filter(l => l.status === 'Pending' || l.status === 'Partial').length;

  // Monthly contribution logic
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const donationsThisMonth = allDonations.filter(d => {
    const donationDate = (d.createdAt as any).toDate ? (d.createdAt as any).toDate() : d.createdAt;
    return donationDate >= startOfMonth && donationDate <= endOfMonth && (d.status === 'Verified' || d.status === 'Allocated');
  });

  const donorsThisMonthIds = new Set(donationsThisMonth.map(d => d.donorId));
  
  const monthlyContributors = allUsers.filter(u => u.monthlyPledgeEnabled && u.monthlyPledgeAmount && u.monthlyPledgeAmount > 0);
  const monthlyContributorsCount = monthlyContributors.length;
  const contributedThisMonthCount = monthlyContributors.filter(p => donorsThisMonthIds.has(p.id!)).length;
  
  const totalMonthlyPledge = monthlyContributors.reduce((sum, user) => sum + (user.monthlyPledgeAmount || 0), 0);

  const pendingVerificationLeads = allLeads
    .filter(lead => lead.verifiedStatus === 'Pending')
    .sort((a, b) => (a.dateCreated as any) - (b.dateCreated as any));

  const pendingVerificationDonations = allDonations
    .filter(donation => donation.status === 'Pending verification')
    .sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
    
  const donationsByDonor = allDonations
    .filter(d => (d.status === 'Verified' || d.status === 'Allocated') && !d.isAnonymous)
    .reduce((acc, donation) => {
        if (!acc[donation.donorName]) {
            acc[donation.donorName] = { total: 0, count: 0, id: donation.donorId };
        }
        acc[donation.donorName].total += donation.amount;
        acc[donation.donorName].count += 1;
        return acc;
    }, {} as Record<string, { total: number, count: number, id: string }>);

  const topDonors = Object.entries(donationsByDonor)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);


  const mainMetrics = [
    { title: "Total Verified Funds", value: `₹${totalRaised.toLocaleString()}`, icon: TrendingUp, description: "Total verified donations received.", href: "/admin/donations?status=Verified" },
    { title: "Total Distributed", value: `₹${totalDistributed.toLocaleString()}`, icon: HandCoins, description: "Total funds given to leads.", href: "/admin/leads" },
    { title: "Funds in Hand", value: `₹${pendingToDisburse.toLocaleString()}`, icon: Banknote, description: "Verified funds ready to be disbursed.", href: "/admin/donations" },
    { title: "Cases Closed", value: casesClosed.toString(), icon: CheckCircle, description: "Total leads successfully completed.", href: "/admin/leads?status=Closed" },
    { title: "Cases Pending", value: casesPending.toString(), icon: Hourglass, description: "Leads currently open for funding.", href: "/admin/leads?status=Pending" },
    { title: "Beneficiaries Helped", value: beneficiariesHelpedCount.toString(), icon: Users, description: "Total unique beneficiaries supported.", href: "/admin/beneficiaries" },
  ];
  
  const donationTypeBreakdown = allDonations
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


  const campaignStatusColors: Record<string, string> = {
    "Active": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Completed": "bg-green-500/20 text-green-700 border-green-500/30",
    "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Cancelled": "bg-red-500/20 text-red-700 border-red-500/30",
};


  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
      </div>
      <div className="space-y-4">
        {isCardVisible('mainMetrics', settings, currentUserRole) && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mainMetrics.map((metric) => (
                <Link href={metric.href} key={metric.title}>
                    <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {isCardVisible('monthlyContributors', settings, currentUserRole) && (
                <Link href="/admin/donors">
                    <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Contributors</CardTitle>
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{contributedThisMonthCount} / {monthlyContributorsCount}</div>
                            <p className="text-xs text-muted-foreground">Contributed this month vs. total pledged.</p>
                        </CardContent>
                    </Card>
                </Link>
                )}
                {isCardVisible('monthlyPledge', settings, currentUserRole) && (
                <Link href="/admin/donors">
                    <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Monthly Pledge</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{totalMonthlyPledge.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Total amount pledged per month.</p>
                        </CardContent>
                    </Card>
                </Link>
                )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           {isCardVisible('pendingLeads', settings, currentUserRole) && (
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-destructive">
                    <AlertTriangle />
                    Action Required: Pending Lead Verifications
                </CardTitle>
                <CardDescription>
                    These leads are awaiting verification from an administrator before they can be funded.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingVerificationLeads.length > 0 ? (
                    <div className="space-y-4">
                        {pendingVerificationLeads.slice(0, 3).map(lead => (
                            <div key={lead.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="font-semibold">{lead.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Requested <span className="font-medium text-foreground">₹{lead.helpRequested.toLocaleString()}</span> for {lead.purpose}
                                    </p>
                                     <p className="text-xs text-muted-foreground">
                                        Submitted on {format(lead.dateCreated as Date, 'dd MMM, yyyy')}
                                    </p>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={`/admin/leads/${lead.id}`}>
                                        Review <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-4 text-lg font-medium">All Caught Up!</h3>
                        <p className="mt-1 text-sm text-muted-foreground">There are no pending leads that require verification.</p>
                    </div>
                )}
            </CardContent>
          </Card>
           )}
            {isCardVisible('pendingDonations', settings, currentUserRole) && (
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-destructive">
                    <AlertTriangle />
                    Action Required: Pending Donation Verifications
                </CardTitle>
                <CardDescription>
                    These donations need to be verified before they can be allocated to a cause.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingVerificationDonations.length > 0 ? (
                    <div className="space-y-4">
                        {pendingVerificationDonations.slice(0, 3).map(donation => (
                            <div key={donation.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="font-semibold">{donation.donorName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Donated <span className="font-medium text-foreground">₹{donation.amount.toLocaleString()}</span> for {donation.type}
                                    </p>
                                     <p className="text-xs text-muted-foreground">
                                        Received {formatDistanceToNow(donation.createdAt as Date, { addSuffix: true })}
                                    </p>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={`/admin/donations/${donation.id}/edit`}>
                                        Review <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-4 text-lg font-medium">All Caught Up!</h3>
                        <p className="mt-1 text-sm text-muted-foreground">There are no pending donations that require verification.</p>
                    </div>
                )}
            </CardContent>
          </Card>
           )}
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {isCardVisible('beneficiaryBreakdown', settings, currentUserRole) && <BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} />}
            {isCardVisible('campaignBreakdown', settings, currentUserRole) && <CampaignBreakdownCard allCampaigns={allCampaigns} />}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           {isCardVisible('donationsChart', settings, currentUserRole) && <DonationsChart donations={allDonations} />}
          {isCardVisible('topDonors', settings, currentUserRole) && (
          <Card className="col-span-4 md:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">Top Donors</CardTitle>
                 <CardDescription>
                    Our most generous supporters. Thank you for your contributions!
                </CardDescription>
            </CardHeader>
            <CardContent>
              {topDonors.length > 0 ? (
                    <div className="space-y-4">
                        {topDonors.map(donor => (
                             <div key={donor.id} className="flex items-center rounded-lg border p-4">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={`https://placehold.co/100x100.png?text=${donor.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}`} alt={donor.name} data-ai-hint="male portrait" />
                                    <AvatarFallback>{donor.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 flex-grow">
                                    <p className="text-sm font-medium leading-none">{donor.name}</p>
                                    <p className="text-sm text-muted-foreground">{donor.count} donations</p>
                                </div>
                                <div className="ml-4 font-semibold text-lg">₹{donor.total.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 h-full flex flex-col items-center justify-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Awaiting Donations</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Donation data is not yet available.</p>
                    </div>
                )}
            </CardContent>
          </Card>
           )}
        </div>

        {isCardVisible('recentCampaigns', settings, currentUserRole) && (
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
                                <TableHead className="w-[30%]">Funding Goal</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allCampaigns.slice(0, 5).map((campaign) => {
                                const raisedAmount = (campaign as any).raisedAmount || 0; // Fallback if not calculated
                                const progress = campaign.goal > 0 ? (raisedAmount / campaign.goal) * 100 : 0;
                                return (
                                    <TableRow key={campaign.id}>
                                        <TableCell>
                                            <div className="font-medium">{campaign.name}</div>
                                            <div className="text-xs text-muted-foreground">{campaign.description.substring(0, 50)}...</div>
                                        </TableCell>
                                        <TableCell>
                                            {format(campaign.startDate as Date, "dd MMM yyyy")} - {format(campaign.endDate as Date, "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <Progress value={progress} />
                                                <span className="text-xs text-muted-foreground">
                                                    ₹{raisedAmount.toLocaleString()} / ₹{campaign.goal.toLocaleString()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(campaignStatusColors[campaign.status])}>{campaign.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-6">No campaigns are currently active.</p>
                )}
            </CardContent>
        </Card>
        )}
        
        {isCardVisible('donationTypeBreakdown', settings, currentUserRole) && <DonationTypeCard donations={allDonations} />}
      </div>
    </div>
  );
}
