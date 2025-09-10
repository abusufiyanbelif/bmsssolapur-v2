

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { User, Lead, Campaign, Donation, DonationType, LeadPurpose } from "@/services/types";
import { HandHeart, HeartHandshake, Baby, PersonStanding, HomeIcon, Users, Megaphone, DollarSign, Wheat, Gift, Building, Shield, TrendingUp, HandCoins, CheckCircle, Hourglass, Eye, Banknote, Repeat, AlertTriangle, UploadCloud, ArrowRight, Award, FileText, ChevronLeft, ChevronRight, Target as TargetIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useState, useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


export const MainMetricsCard = ({ allDonations = [], allLeads = [] }: { allDonations: Donation[], allLeads: Lead[] }) => {
    
    const stats = useMemo(() => {
        const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
        const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
        const helpedBeneficiaryIds = new Set(allLeads.filter(l => l.helpGiven > 0).map(l => l.beneficiaryId));
        const casesClosed = allLeads.filter(l => l.caseAction === 'Closed').length;
        const casesPending = allLeads.filter(l => l.caseStatus === 'Pending' || l.caseStatus === 'Open' || l.caseStatus === 'Partial').length;
        const casesPublished = allLeads.filter(l => l.caseAction === 'Publish').length;
        const totalRequired = allLeads
            .filter(l => l.caseStatus === 'Open' || l.caseStatus === 'Partial' || l.caseAction === 'Publish')
            .reduce((acc, l) => acc + (l.helpRequested - l.helpGiven), 0);
        
        return {
            totalRaised,
            totalDistributed,
            beneficiariesHelpedCount: helpedBeneficiaryIds.size,
            casesClosed,
            casesPending,
            casesPublished,
            totalRequired,
        };
    }, [allDonations, allLeads]);

    const mainMetrics = [
        { id: "totalRaised", title: "Total Verified Funds", value: `₹${stats.totalRaised.toLocaleString()}`, icon: TrendingUp, href: "/admin/donations?status=Verified" },
        { id: "totalDistributed", title: "Total Distributed", value: `₹${stats.totalDistributed.toLocaleString()}`, icon: HandCoins, href: "/admin/leads" },
        { id: "totalRequired", title: "Total Required", value: `₹${stats.totalRequired.toLocaleString()}`, icon: TargetIcon, description: "Total pending amount for all open leads.", href: "/admin/leads?status=Open" },
        { id: "casesClosed", title: "Cases Closed", value: stats.casesClosed.toString(), icon: CheckCircle, description: "Total leads successfully completed.", href: "/admin/leads?caseAction=Closed" },
        { id: "openLeads", title: "Open Leads", value: stats.casesPublished.toString(), icon: Eye, description: "Cases visible to the public for funding.", href: "/public-leads" },
        { id: "beneficiariesHelped", title: "Beneficiaries Helped", value: stats.beneficiariesHelpedCount.toString(), icon: Users, description: "Total unique beneficiaries supported.", href: "/admin/beneficiaries" },
    ];
    
    const CardWrapper = ({ children, href, isClickable }: { children: React.ReactNode, href: string, isClickable: boolean }) => {
        if (!isClickable) {
            return <div className="h-full">{children}</div>;
        }
        return <Link href={href}>{children}</Link>;
    };


    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {mainMetrics.map((metric) => (
                <CardWrapper href={metric.href} key={metric.title} isClickable={true}>
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
            ))}
        </div>
    )
}

export const FundsInHandCard = ({ allDonations = [], allLeads = [] }: { allDonations: Donation[], allLeads: Lead[] }) => {
     const stats = useMemo(() => {
        const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
        const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
        return { pendingToDisburse: Math.max(0, totalRaised - totalDistributed) };
    }, [allDonations, allLeads]);

    return (
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
    )
}

export const OrganizationFundsCard = ({ allDonations = [] }: { allDonations: Donation[] }) => {
    const orgFunds = useMemo(() => {
        return allDonations
            .filter(d => (d.status === 'Verified' || d.status === 'Allocated') && d.purpose === 'To Organization Use')
            .reduce((sum, d) => sum + d.amount, 0);
    }, [allDonations]);

    return (
        <Link href="/admin/donations?purpose=To+Organization+Use">
            <Card className="h-full transition-all hover:shadow-md hover:border-accent/50 bg-accent/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Organization Support Funds</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{orgFunds.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Funds from pledges and direct support.</p>
                </CardContent>
            </Card>
        </Link>
    )
}


export const MonthlyContributorsCard = ({ allUsers = [] }: { allUsers: User[] }) => {
    const stats = useMemo(() => {
        // This logic will need to be updated when contributions are tracked monthly.
        // For now, it's a placeholder.
        const monthlyContributorsCount = allUsers.filter(u => u.monthlyPledgeEnabled).length;
        const contributedThisMonthCount = 0; // Placeholder
        return { monthlyContributorsCount, contributedThisMonthCount };
    }, [allUsers]);

    return (
        <Link href="/admin/donors">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Contributors</CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.contributedThisMonthCount} / {stats.monthlyContributorsCount}</div>
                    <p className="text-xs text-muted-foreground">Contributed this month vs. total pledged.</p>
                </CardContent>
            </Card>
        </Link>
    )
}

export const MonthlyPledgeCard = ({ allUsers = [] }: { allUsers: User[] }) => {
    const totalPledge = useMemo(() => {
        return allUsers.reduce((sum, user) => {
            if(user.monthlyPledgeEnabled && user.monthlyPledgeAmount) {
                return sum + user.monthlyPledgeAmount;
            }
            return sum;
        }, 0);
    }, [allUsers]);

    return (
         <Link href="/admin/donors">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Monthly Pledge</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalPledge.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total amount pledged per month.</p>
                </CardContent>
            </Card>
        </Link>
    )
}

export const PendingLeadsCard = ({ allLeads = [] }: { allLeads: Lead[] }) => {
    const leads = useMemo(() => allLeads.filter(l => l.caseVerification === 'Pending'), [allLeads]);

    return (
        <AccordionItem value="pending-leads">
            <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2 text-destructive">
                     <AlertTriangle />
                    Action: Pending Lead Verifications
                    <Badge variant="destructive">{leads.length}</Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <CardContent>
                    {leads.length > 0 ? (
                        <div className="space-y-4">
                            {leads.slice(0, 3).map(lead => (
                                <div key={lead.id} className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="font-semibold">{lead.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Requested <span className="font-medium text-foreground">₹{lead.helpRequested.toLocaleString()}</span> for {lead.purpose}
                                        </p>
                                            <p className="text-xs text-muted-foreground">
                                            Submitted on {format(new Date(lead.dateCreated), 'dd MMM, yyyy')}
                                        </p>
                                    </div>
                                    <Button asChild size="sm">
                                        <Link href={`/admin/leads/${lead.id}`}>
                                            Review <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                            {leads.length > 3 && (
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href="/admin/leads?verification=Pending">View All {leads.length} Pending Leads</Link>
                                </Button>
                            )}
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

export const PendingDonationsCard = ({ allDonations = [] }: { allDonations: Donation[] }) => {
    const donations = useMemo(() => allDonations.filter(d => d.status === 'Pending verification' || d.status === 'Pending'), [allDonations]);

    return (
        <AccordionItem value="pending-donations">
            <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle />
                    Action: Pending Donation Verifications
                    <Badge variant="destructive">{donations.length}</Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <CardContent>
                    {donations.length > 0 ? (
                        <div className="space-y-4">
                            {donations.slice(0, 3).map(donation => (
                                <div key={donation.id} className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <p className="font-semibold">{donation.donorName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Donated <span className="font-medium text-foreground">₹{donation.amount.toLocaleString()}</span> for {donation.type}
                                        </p>
                                            <p className="text-xs text-muted-foreground">
                                            Received {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <Button asChild size="sm">
                                        <Link href={`/admin/donations/${donation.id}/edit`}>
                                            Review <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                             {donations.length > 3 && (
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href="/admin/donations?status=Pending+verification">View All {donations.length} Pending Donations</Link>
                                </Button>
                            )}
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

export const LeadsReadyToPublishCard = ({ allLeads = [] }: { allLeads: Lead[] }) => {
    const leads = useMemo(() => allLeads.filter(l => l.caseAction === 'Ready For Help'), [allLeads]);

    return (
        <AccordionItem value="ready-to-publish">
            <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2 text-blue-600">
                    <UploadCloud />
                    Action: Leads Ready for Publishing
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">{leads.length}</Badge>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <CardContent>
                    {leads.length > 0 ? (
                        <div className="space-y-4">
                            {leads.slice(0, 3).map(lead => (
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
                             {leads.length > 3 && (
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href="/admin/leads?caseAction=Ready+For+Help">View All {leads.length} Ready Leads</Link>
                                </Button>
                            )}
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

export const TopDonorsCard = ({ allDonations = [] }: { allDonations: Donation[] }) => {
    const donors = useMemo(() => {
        const donorData = allDonations.reduce((acc, d) => {
            if (d.status === 'Verified' || d.status === 'Allocated') {
                if (!acc[d.donorId]) {
                    acc[d.donorId] = { name: d.donorName, total: 0, count: 0, id: d.donorId };
                }
                acc[d.donorId].total += d.amount;
                acc[d.donorId].count += 1;
            }
            return acc;
        }, {} as Record<string, { name: string; total: number; count: number; id: string; }>);

        return Object.values(donorData).sort((a, b) => b.total - a.total);
    }, [allDonations]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(donors.length / itemsPerPage);
    const paginatedDonors = donors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="col-span-4 md:col-span-3">
            <CardHeader>
                <CardTitle className="font-headline">Top Donors</CardTitle>
                <CardDescription>Our most generous supporters. Thank you for your contributions!</CardDescription>
            </CardHeader>
            <CardContent>
                {donors.length > 0 ? (
                    <ScrollArea className="h-80 pr-4">
                        <div className="space-y-4">
                            {paginatedDonors.map(donor => (
                                <Link href={`/admin/donors?name=${donor.name}`} key={donor.id}>
                                    <div className="flex items-center rounded-lg border p-4 hover:bg-muted transition-colors">
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
                                </Link>
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


export const RecentCampaignsCard = ({ allCampaigns = [], allLeads = [] }: { allCampaigns: Campaign[], allLeads: Lead[] }) => {
    
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
                                        {format(new Date(campaign.startDate), "dd MMM yyyy")} - {format(new Date(campaign.endDate), "dd MMM yyyy")}
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

const leadPurposeIcons: Record<string, React.ElementType> = {
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
    }, {} as Record<string, { count: number, requested: number }>);
        
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
                    const Icon = leadPurposeIcons[purpose] || FileText;
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

export const TopDonationsCard = ({ allDonations = [], isPublicView = false }: { allDonations: Donation[], isPublicView?: boolean }) => {
    const donations = useMemo(() => {
        return [...allDonations]
            .filter(d => d.status === 'Verified' || d.status === 'Allocated')
            .sort((a,b) => b.amount - a.amount);
    }, [allDonations]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(donations.length / itemsPerPage);
    const paginatedDonations = donations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                {donations.length > 0 ? (
                    <ScrollArea className="h-80 pr-4">
                        <div className="space-y-4">
                            {paginatedDonations.map((donation, index) => {
                                let displayName: string;
                                let avatarText: string;

                                if (isPublicView && donation.isAnonymous) {
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
                                                {format(new Date(donation.donationDate), "dd MMM, yyyy")}
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

export const BeneficiaryBreakdownCard = ({ allUsers, allLeads, isAdmin }: { allUsers: User[], allLeads: Lead[], isAdmin?: boolean }) => {

    const beneficiaryStats = useMemo(() => {
        const helpedBeneficiaryIds = new Set(allLeads.filter(l => l.helpGiven > 0).map(l => l.beneficiaryId));
        const allBeneficiaries = allUsers.filter(u => u.roles.includes('Beneficiary'));

        const stats = allBeneficiaries.reduce((acc, user) => {
            if (!helpedBeneficiaryIds.has(user.id!)) return acc;
            
            if (user.isWidow) acc.widows++;
            if (user.beneficiaryType === 'Kid') acc.kids++;
            if (user.beneficiaryType === 'Adult') acc.adults++;
            if (user.beneficiaryType === 'Family') acc.families++;
            
            return acc;
        }, { kids: 0, adults: 0, widows: 0, families: 0 });

        return stats;
    }, [allUsers, allLeads]);

    const beneficiaryTypes = [
        { label: "Kids", value: beneficiaryStats.kids, icon: Baby, href: "/admin/beneficiaries?type=Kid" },
        { label: "Adults", value: beneficiaryStats.adults, icon: PersonStanding, href: "/admin/beneficiaries?type=Adult" },
        { label: "Families", value: beneficiaryStats.families, icon: HomeIcon, href: "/admin/beneficiaries?type=Family" },
        { label: "Widows", value: beneficiaryStats.widows, icon: HeartHandshake, href: "/admin/beneficiaries?isWidow=true" },
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Users /> Beneficiaries Helped
                </CardTitle>
                 <CardDescription>Breakdown of unique beneficiaries who have received aid.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                {beneficiaryTypes.map(item => {
                    const CardItem = () => (
                        <div className="p-4 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors h-full">
                            <item.icon className="h-8 w-8 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-2xl font-bold">{item.value}</p>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                            </div>
                        </div>
                    );
                    return isAdmin ? <Link href={item.href} key={item.label}><CardItem /></Link> : <CardItem key={item.label} />;
                })}
            </CardContent>
        </Card>
    );
};

export const CampaignBreakdownCard = ({ allCampaigns }: { allCampaigns: Campaign[] }) => {

     const campaignStats = useMemo(() => {
        return allCampaigns.reduce((acc, campaign) => {
            if (campaign.status === 'Active') acc.active++;
            if (campaign.status === 'Completed') acc.completed++;
            if (campaign.status === 'Upcoming') acc.upcoming++;
            return acc;
        }, { active: 0, completed: 0, upcoming: 0 });
    }, [allCampaigns]);

    const campaignTypes = [
        { label: "Active", value: campaignStats.active, href: "/admin/campaigns?status=Active" },
        { label: "Completed", value: campaignStats.completed, href: "/admin/campaigns?status=Completed" },
        { label: "Upcoming", value: campaignStats.upcoming, href: "/admin/campaigns?status=Upcoming" },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Megaphone /> Campaigns Overview
                </CardTitle>
                 <CardDescription>A summary of our fundraising campaigns.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
                 {campaignTypes.map(item => (
                    <Link href={item.href} key={item.label}>
                        <div className="p-4 border rounded-lg text-center hover:bg-muted transition-colors h-full">
                            <p className="text-3xl font-bold">{item.value}</p>
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

const donationTypeIcons: Record<DonationType, React.ElementType> = {
    Zakat: Wheat,
    Sadaqah: Gift,
    Fitr: Wheat,
    Lillah: Building,
    Kaffarah: Shield,
    Interest: Banknote,
    Split: DollarSign,
    Any: DollarSign,
};

export const DonationTypeCard = ({ donations: allDonations, isPublicView = false }: { donations: Donation[], isPublicView?: boolean }) => {

    const donationTypeBreakdown = useMemo(() => {
        return allDonations
            .filter(d => d.status === 'Verified' || d.status === 'Allocated')
            .reduce((acc, donation) => {
                const type = donation.type || 'Other';
                if (!acc[type]) {
                    acc[type] = 0;
                }
                acc[type] += donation.amount;
                return acc;
            }, {} as Record<string, number>);
    }, [allDonations]);

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <HandHeart /> Donation Types Received
                </CardTitle>
                <CardDescription>Total amounts received per donation category.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(donationTypeBreakdown).map(([type, amount]) => {
                    const Icon = donationTypeIcons[type as DonationType] || DollarSign;
                    const CardItem = () => (
                         <div className="p-4 border rounded-lg flex items-start gap-4 hover:bg-muted transition-colors h-full">
                            <Icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-semibold text-lg">{type}</p>
                                <p className="text-2xl font-bold text-foreground">₹{amount.toLocaleString()}</p>
                            </div>
                        </div>
                    );
                    return isPublicView ? <CardItem key={type} /> : <Link href={`/admin/donations?type=${type}`} key={type}><CardItem /></Link>
                })}
            </CardContent>
        </Card>
    );
};

export const ReferralSummaryCard = ({ allUsers, allLeads, currentUser }: { allUsers: User[], allLeads: Lead[], currentUser: User }) => {
    const stats = useMemo(() => {
        let beneficiaries;
        if(currentUser && currentUser.roles.includes('Referral')) {
            beneficiaries = allUsers.filter(u => u.referredByUserId === currentUser.id);
        } else {
            beneficiaries = allUsers.filter(u => u.referredByUserId); // All referred users
        }
        
        const beneficiaryIds = new Set(beneficiaries.map(b => b.id));
        const relevantLeads = allLeads.filter(l => l.beneficiaryId && beneficiaryIds.has(l.beneficiaryId));
        
        const totalRequested = relevantLeads.reduce((sum, l) => sum + l.helpRequested, 0);
        const totalReceived = relevantLeads.reduce((sum, l) => sum + l.helpGiven, 0);

        return {
            referredCount: beneficiaryIds.size,
            totalRequested,
            totalReceived
        };
    }, [allUsers, allLeads, currentUser]);
    
    return (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Users /> Referral Impact
                </CardTitle>
                <CardDescription>Summary of all beneficiaries referred to the organization.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
                 <div className="p-4 border rounded-lg">
                    <p className="text-3xl font-bold">{stats.referredCount}</p>
                    <p className="text-sm text-muted-foreground">Beneficiaries Referred</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <p className="text-3xl font-bold">₹{stats.totalRequested.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Aid Requested</p>
                </div>
                 <div className="p-4 border rounded-lg">
                    <p className="text-3xl font-bold text-primary">₹{stats.totalReceived.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Aid Received</p>
                </div>
            </CardContent>
        </Card>
    )
}
