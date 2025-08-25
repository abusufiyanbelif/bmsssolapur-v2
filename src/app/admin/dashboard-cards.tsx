
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { User, Lead, Campaign, Donation, DonationType, LeadPurpose } from "@/services/types";
import { HandHeart, HeartHandshake, Baby, PersonStanding, HomeIcon, Users, Megaphone, DollarSign, Wheat, Gift, Building, Shield, TrendingUp, HandCoins, CheckCircle, Hourglass, Eye, Banknote, Repeat, AlertTriangle, UploadCloud, ArrowRight, Award, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers } from "@/services/user-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


export const MainMetricsCard = async ({ isPublicView = false }: { isPublicView?: boolean }) => {
    const [allDonations, allLeads, allUsers] = await Promise.all([
        getAllDonations(),
        getAllLeads(),
        getAllUsers(),
    ]);

    const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
    const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
    
    const helpedBeneficiaryIds = new Set(allLeads.filter(l => l.caseAction === 'Closed' || l.caseAction === 'Complete').map(l => l.beneficiaryId));
    const beneficiariesHelpedCount = helpedBeneficiaryIds.size;
  
    const casesClosed = allLeads.filter(l => l.caseAction === 'Closed').length;
    const casesPending = allLeads.filter(l => l.status === 'Pending' || l.status === 'Partial').length;
    const casesPublished = allLeads.filter(l => l.caseAction === 'Publish').length;

    const mainMetrics = [
        { id: "totalRaised", title: "Total Verified Funds", value: `₹${totalRaised.toLocaleString()}`, icon: TrendingUp, href: "/admin/donations?status=Verified" },
        { id: "totalDistributed", title: "Total Distributed", value: `₹${totalDistributed.toLocaleString()}`, icon: HandCoins, href: "/admin/leads" },
        { id: "casesClosed", title: "Cases Closed", value: casesClosed.toString(), icon: CheckCircle, description: "Total leads successfully completed.", href: "/admin/leads?caseAction=Closed" },
        { id: "casesPending", title: "Pending Leads", value: casesPending.toString(), icon: Hourglass, description: "Leads currently open for funding.", href: "/admin/leads?status=Pending" },
        { id: "openLeads", title: "Open Leads", value: casesPublished.toString(), icon: Eye, description: "Cases visible to the public for funding.", href: "/public-leads" },
        { id: "beneficiariesHelped", title: "Beneficiaries Helped", value: beneficiariesHelpedCount.toString(), icon: Users, description: "Total unique beneficiaries supported.", href: "/admin/beneficiaries" },
    ];
    
    const CardWrapper = ({ children, href, isClickable }: { children: React.ReactNode, href: string, isClickable: boolean }) => {
        if (!isClickable) {
            return <div className="h-full">{children}</div>;
        }
        return <Link href={href}>{children}</Link>;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {mainMetrics.map((metric) => {
                if (isPublicView && metric.id === 'casesPending') {
                    return null; // Skip rendering pending cases card on public view
                }
                const isClickable = !isPublicView || metric.id === 'openLeads'; // Open Leads is always clickable
                return (
                    <CardWrapper href={metric.href} key={metric.title} isClickable={isClickable}>
                        <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                            <metric.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            </CardContent>
                        </Card>
                    </CardWrapper>
                )
            })}
        </div>
    )
}

export const FundsInHandCard = ({ isPublicView = false }: { isPublicView?: boolean }) => {
    const [stats, setStats] = useState({ pendingToDisburse: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (isPublicView) {
                setLoading(false);
                return;
            }
            try {
                const [allDonations, allLeads] = await Promise.all([getAllDonations(), getAllLeads()]);
                const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
                const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
                const pendingToDisburse = Math.max(0, totalRaised - totalDistributed);
                setStats({ pendingToDisburse });
            } catch (error) {
                console.error("Failed to fetch funds in hand stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isPublicView]);
    
    if (isPublicView) {
        return null;
    }
    
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Card className="h-full bg-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Funds in Hand</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-3/4 mb-1" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/donations">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 bg-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Funds in Hand</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">₹{stats.pendingToDisburse.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Verified funds ready to be disbursed.</p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}

export const MonthlyContributorsCard = async () => {
    const [allDonations, allUsers] = await Promise.all([getAllDonations(), getAllUsers()]);
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

    return (
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
    )
}

export const MonthlyPledgeCard = async () => {
    const allUsers = await getAllUsers();
    const monthlyContributors = allUsers.filter(u => u.monthlyPledgeEnabled && u.monthlyPledgeAmount && u.monthlyPledgeAmount > 0);
    const totalMonthlyPledge = monthlyContributors.reduce((sum, user) => sum + (user.monthlyPledgeAmount || 0), 0);

    return (
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
    )
}

export const PendingLeadsCard = async () => {
    const allLeads = await getAllLeads();
    const pendingVerificationLeads = allLeads
        .filter(lead => lead.verifiedStatus === 'Pending')
        .sort((a, b) => (a.dateCreated as any) - (b.dateCreated as any));
    
    return (
        <AccordionItem value="pending-leads">
            <AccordionTrigger>
                <div className="flex items-center gap-2 font-headline text-destructive text-base">
                     <AlertTriangle />
                    Action Required: Pending Lead Verifications
                    <Badge variant="destructive">{pendingVerificationLeads.length}</Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent>
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
                        <div className="text-center py-6">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-medium">All Caught Up!</h3>
                            <p className="mt-1 text-sm text-muted-foreground">There are no pending leads that require verification.</p>
                        </div>
                    )}
                </CardContent>
            </AccordionContent>
        </AccordionItem>
    )
}

export const PendingDonationsCard = async () => {
    const allDonations = await getAllDonations();
    const pendingVerificationDonations = allDonations
        .filter(donation => donation.status === 'Pending verification')
        .sort((a, b) => (b.createdAt as any) - (a.createdAt as any));

    return (
        <AccordionItem value="pending-donations">
            <AccordionTrigger>
                <div className="flex items-center gap-2 font-headline text-destructive text-base">
                    <AlertTriangle />
                    Action Required: Pending Donation Verifications
                    <Badge variant="destructive">{pendingVerificationDonations.length}</Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent>
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
                        <div className="text-center py-6">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-medium">All Caught Up!</h3>
                            <p className="mt-1 text-sm text-muted-foreground">There are no pending donations that require verification.</p>
                        </div>
                    )}
                </CardContent>
            </AccordionContent>
        </AccordionItem>
    )
}

export const LeadsReadyToPublishCard = async () => {
    const allLeads = await getAllLeads();
    const readyToPublishLeads = allLeads
        .filter(lead => lead.verifiedStatus === 'Verified' && lead.caseAction === 'Ready For Help')
        .sort((a, b) => (a.dateCreated as any) - (b.dateCreated as any));

    return (
        <AccordionItem value="ready-to-publish">
            <AccordionTrigger>
                <div className="flex items-center gap-2 font-headline text-blue-600 text-base">
                    <UploadCloud />
                    Action Required: Leads Ready for Publishing
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">{readyToPublishLeads.length}</Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <CardContent>
                    {readyToPublishLeads.length > 0 ? (
                        <div className="space-y-4">
                            {readyToPublishLeads.slice(0, 3).map(lead => (
                                <div key={lead.id} className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="font-semibold">{lead.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Requested <span className="font-medium text-foreground">₹{lead.helpRequested.toLocaleString()}</span> for {lead.purpose}
                                        </p>
                                    </div>
                                    <Button asChild size="sm">
                                        <Link href={`/admin/leads/${lead.id}/edit`}>
                                            Publish <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h3 className="mt-4 text-lg font-medium">All Caught Up!</h3>
                            <p className="mt-1 text-sm text-muted-foreground">There are no leads waiting to be published.</p>
                        </div>
                    )}
                </CardContent>
            </AccordionContent>
        </AccordionItem>
    )
}

export const TopDonorsCard = () => {
    const [donors, setDonors] = useState<{ name: string; total: number; count: number; id: string; }[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchDonors = async () => {
            setLoading(true);
            try {
                const allDonations = await getAllDonations();
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

                const sortedDonors = Object.entries(donationsByDonor)
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.total - a.total);
                setDonors(sortedDonors);
            } catch (error) {
                console.error("Failed to fetch top donors", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDonors();
    }, []);

    const totalPages = Math.ceil(donors.length / itemsPerPage);
    const paginatedDonors = donors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="col-span-4 md:col-span-3">
            <CardHeader>
                <CardTitle className="font-headline">Top Donors</CardTitle>
                <CardDescription>Our most generous supporters. Thank you for your contributions!</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                ) : donors.length > 0 ? (
                    <ScrollArea className="h-80 pr-4">
                        <div className="space-y-4">
                            {paginatedDonors.map(donor => (
                                <div key={donor.id} className="flex items-center rounded-lg border p-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={`https://placehold.co/100x100.png?text=${donor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}`} alt={donor.name} data-ai-hint="male portrait" />
                                        <AvatarFallback>{donor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 flex-grow">
                                        <p className="text-sm font-medium leading-none">{donor.name}</p>
                                        <p className="text-sm text-muted-foreground">{donor.count} donations</p>
                                    </div>
                                    <div className="ml-4 font-semibold text-lg">₹{donor.total.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center py-10 h-full flex flex-col items-center justify-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Awaiting Donations</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Donation data is not yet available.</p>
                    </div>
                )}
            </CardContent>
             <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Page</span>
                </Button>
                 <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Page</span>
                </Button>
            </CardFooter>
        </Card>
    );
};


export const RecentCampaignsCard = async () => {
    const [allCampaigns, allLeads] = await Promise.all([getAllCampaigns(), getAllLeads()]);

     const campaignStatusColors: Record<string, string> = {
        "Active": "bg-blue-500/20 text-blue-700 border-blue-500/30",
        "Completed": "bg-green-500/20 text-green-700 border-green-500/30",
        "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
        "Cancelled": "bg-red-500/20 text-red-700 border-red-500/30",
    };

    return (
        <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CheckCircle className="text-primary"/>
                Active & Recent Campaigns
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
                            const linkedLeads = allLeads.filter(lead => lead.campaignId === campaign.id);
                            const raisedAmount = linkedLeads.reduce((sum, lead) => sum + lead.helpGiven, 0);
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
    )
}

const leadPurposeIcons: Record<LeadPurpose, React.ElementType> = {
    'Education': HandHeart,
    'Medical': HeartHandshake,
    'Relief Fund': HomeIcon,
    'Deen': Building,
    'Loan': DollarSign,
    'Other': FileText,
};

export const LeadBreakdownCard = ({ allLeads }: { allLeads: Lead[] }) => {
    const leadPurposeBreakdown = allLeads.reduce((acc, lead) => {
        const purpose = lead.purpose || 'Other';
        if (!acc[purpose]) {
            acc[purpose] = { count: 0, requested: 0 };
        }
        acc[purpose].count += 1;
        acc[purpose].requested += lead.helpRequested;
        return acc;
    }, {} as Record<LeadPurpose, { count: number, requested: number }>);
        
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <FileText />
                    Lead Purpose Breakdown
                </CardTitle>
                <CardDescription>
                    A summary of all leads organized by their primary purpose.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {Object.entries(leadPurposeBreakdown).map(([purpose, data]) => {
                    const Icon = leadPurposeIcons[purpose as LeadPurpose] || FileText;
                    return (
                        <Link href={`/admin/leads?purpose=${purpose}`} key={purpose}>
                            <div className="p-4 border rounded-lg flex items-start gap-4 hover:bg-muted transition-colors">
                                <Icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-lg">{purpose}</p>
                                    <p className="text-2xl font-bold text-foreground">{data.count}</p>
                                    <p className="text-xs text-muted-foreground">cases</p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </CardContent>
        </Card>
    )
}

type TopDonation = Donation & { anonymousDonorId?: string };

export const TopDonationsCard = ({ donations: allDonations, isPublicView = false }: { donations: TopDonation[], isPublicView?: boolean }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const topDonations = useMemo(() => {
        return allDonations
            .filter(d => d.status === 'Verified' || d.status === 'Allocated')
            .sort((a, b) => b.amount - a.amount);
    }, [allDonations]);

    const totalPages = Math.ceil(topDonations.length / itemsPerPage);
    const paginatedDonations = topDonations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const CardRow = ({ children, donationId }: { children: React.ReactNode, donationId: string }) => {
        if (isPublicView) {
            return <div className="flex items-center rounded-lg border p-4">{children}</div>;
        }
        return (
            <Link href={`/admin/donations/${encodeURIComponent(donationId)}/edit`}>
                <div className="flex items-center rounded-lg border p-4 hover:bg-muted transition-colors">
                    {children}
                </div>
            </Link>
        )
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Top Donations</CardTitle>
                <CardDescription>The largest recent contributions to our cause.</CardDescription>
            </CardHeader>
            <CardContent>
                {topDonations.length > 0 ? (
                    <ScrollArea className="h-80 pr-4">
                        <div className="space-y-4">
                            {paginatedDonations.map((donation, index) => {
                                let displayName: string;
                                let avatarText: string;

                                if (isPublicView) {
                                    displayName = donation.anonymousDonorId || `Anonymous Donor #${index + 1}`;
                                    avatarText = `D${index + 1}`;
                                } else {
                                    displayName = donation.donorName;
                                    avatarText = donation.donorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                }
                                
                                return (
                                    <CardRow key={donation.id} donationId={donation.id!}>
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={`https://placehold.co/100x100.png?text=${avatarText}`} alt={displayName} data-ai-hint="abstract geometric" />
                                            <AvatarFallback>{avatarText}</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4 flex-grow">
                                            <p className="text-sm font-medium leading-none">{displayName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(donation.donationDate as Date, "dd MMM, yyyy")}
                                            </p>
                                        </div>
                                        <div className="ml-4 font-semibold text-lg">₹{donation.amount.toLocaleString()}</div>
                                    </CardRow>
                                );
                            })}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center py-10 h-full flex flex-col items-center justify-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Awaiting Donations</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Donation data is not yet available.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Page</span>
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Page</span>
                </Button>
            </CardFooter>
        </Card>
    );
};
