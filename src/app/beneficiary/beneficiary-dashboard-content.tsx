

"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, Quote as QuoteIcon, Target, ChevronLeft, ChevronRight, FilePlus2, DollarSign, Wheat, Gift, Building, Shield, Banknote, PackageOpen, History, Megaphone, Users as UsersIcon, TrendingUp, CheckCircle, Hourglass, Eye, HandCoins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { User, Lead, Quote, LeadStatus, Campaign, Donation, AppSettings } from "@/services/types";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";

const statusColors: Record<LeadStatus, string> = {
    "Open": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Complete": "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
    "On Hold": "bg-orange-500/20 text-orange-700 border-orange-500/30",
    "Cancelled": "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

export function BeneficiaryDashboardContent({ cases, quotes, settings }: { cases: Lead[], quotes: Quote[], settings: AppSettings }) {
    const isMobile = useIsMobile();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [loadingStats, setLoadingStats] = useState(true);
    const [mainMetrics, setMainMetrics] = useState<any[]>([]);
    
    const dashboardSettings = settings.dashboard;
    const allowBeneficiaryRequests = settings.leadConfiguration?.allowBeneficiaryRequests ?? true;

    useEffect(() => {
        const fetchStats = async () => {
            setLoadingStats(true);
            const [allDonations, allLeads] = await Promise.all([
                getAllDonations(),
                getAllLeads()
            ]);
            
            const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
            const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
            const pendingToDisburse = Math.max(0, totalRaised - totalDistributed);
            const helpedBeneficiaryIds = new Set(allLeads.map(l => l.beneficiaryId));
            const beneficiariesHelpedCount = helpedBeneficiaryIds.size;
            const casesClosed = allLeads.filter(l => l.caseAction === 'Closed').length;
            const casesPublished = allLeads.filter(l => l.caseAction === 'Publish').length;
            
            setMainMetrics([
                { id: 'mainMetrics', title: "Total Verified Funds", value: `₹${totalRaised.toLocaleString()}`, icon: TrendingUp, description: "Total verified donations received by the Organization.", href: "/public-leads" },
                { id: 'mainMetrics', title: "Total Distributed", value: `₹${totalDistributed.toLocaleString()}`, icon: HandCoins, description: "Total funds given to all beneficiaries.", href: "/public-leads" },
                { id: 'fundsInHand', title: "Funds in Hand", value: `₹${pendingToDisburse.toLocaleString()}`, icon: Banknote, description: "Verified funds ready for disbursement.", href: "/public-leads" },
                { id: 'mainMetrics', title: "Cases Closed", value: casesClosed.toString(), icon: CheckCircle, description: "Total help requests successfully completed.", href: "/public-leads" },
                { id: 'mainMetrics', title: "Published Leads", value: casesPublished.toString(), icon: Eye, description: "Cases currently visible to the public.", href: "/public-leads" },
                { id: 'mainMetrics', title: "Beneficiaries Helped", value: beneficiariesHelpedCount.toString(), icon: UsersIcon, description: "Total unique individuals and families supported.", href: "/public-leads" },
            ]);
            setLoadingStats(false);
        };
        fetchStats();
    }, []);
    
    // Beneficiary specific stats
    const { totalAidReceived, activeCases, casesClosed: myCasesClosed, totalRequested } = useMemo(() => {
        let totalAidReceived = 0;
        let activeCases = 0;
        let myCasesClosed = 0;
        let totalRequested = 0;

        cases.forEach(caseItem => {
            totalRequested += caseItem.helpRequested;
            totalAidReceived += caseItem.helpGiven;
            if (caseItem.caseStatus === 'Closed') {
                myCasesClosed++;
            }
            if (caseItem.caseStatus === 'Pending' || caseItem.caseStatus === 'Partial' || caseItem.caseStatus === 'Open') {
                activeCases++;
            }
        });
        return { totalAidReceived, activeCases, casesClosed: myCasesClosed, totalRequested };
    }, [cases]);

    const beneficiaryMetrics = [
        { title: "My Total Aid Received", value: `₹${totalAidReceived.toLocaleString()}`, icon: HandHeart, description: "The total funds you have received across all your cases." },
        { title: "My Total Requested", value: `₹${totalRequested.toLocaleString()}`, icon: FilePlus2, description: "The total amount you have requested across all your cases." },
        { title: "My Active Cases", value: activeCases.toString(), icon: Hourglass, description: "Your cases that are currently open or partially funded." },
        { title: "My Closed Cases", value: myCasesClosed.toString(), icon: CheckCircle, description: "Your cases that have been successfully completed." },
    ];

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
                    <TableHead className="text-right">Amount Req.</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedCases.map((caseItem) => {
                    const progress = caseItem.helpRequested > 0 ? (caseItem.helpGiven / caseItem.helpRequested) * 100 : 100;
                    const remainingAmount = caseItem.helpRequested - caseItem.helpGiven;
                    const donationCount = caseItem.donations?.length || 0;
                    const caseStatus = caseItem.caseStatus || 'Pending';
                    return (
                        <TableRow key={caseItem.id}>
                            <TableCell>{format(caseItem.dateCreated, "dd MMM yyyy")}</TableCell>
                            <TableCell>{caseItem.purpose}{caseItem.category && ` (${caseItem.category})`}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[caseStatus as LeadStatus])}>
                                    {caseStatus}
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
                const caseStatus = caseItem.caseStatus || 'Pending';
                return (
                    <Card key={caseItem.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg text-primary">For: {caseItem.purpose}</CardTitle>
                                    <CardDescription>Submitted: {format(caseItem.createdAt, "dd MMM yyyy")}</CardDescription>
                                </div>
                                <Badge variant="outline" className={cn("capitalize", statusColors[caseStatus as LeadStatus])}>
                                    {caseStatus}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-semibold">Funding Goal</span>
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
        <div className="space-y-6">
            <InspirationalQuotes quotes={quotes} loading={false} />
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Organization Impact</CardTitle>
                    <CardDescription>A real-time overview of our collective efforts.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loadingStats ? (
                        Array.from({ length: 6 }).map((_, i) => <div key={i} className="p-4 border rounded-lg h-32 bg-muted animate-pulse" />)
                    ) : (
                        mainMetrics.filter(m => dashboardSettings?.[m.id]?.visibleTo.includes('Beneficiary')).map((metric) => (
                            <Link href={metric.href} key={metric.title}>
                                <div className="p-4 border rounded-lg h-full hover:bg-muted transition-colors">
                                    <metric.icon className="h-6 w-6 text-muted-foreground mb-2" />
                                    <p className="text-2xl font-bold">{metric.value}</p>
                                    <p className="text-sm font-medium text-primary">{metric.title}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </CardContent>
            </Card>

            {dashboardSettings?.beneficiarySummary?.visibleTo.includes('Beneficiary') && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-primary">My Personal Summary</CardTitle>
                        <CardDescription>Your personal history and status with our organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {beneficiaryMetrics.map((metric) => (
                            <Link href="/my-cases" key={metric.title}>
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

            <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <FileText />
                            My Case History
                        </CardTitle>
                        <CardDescription>
                        Here is the status of all your help requests.
                        </CardDescription>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2">
                        {allowBeneficiaryRequests && (
                            <Button asChild variant="secondary">
                                <Link href="/request-help"><FilePlus2 className="mr-2" />Request Help</Link>
                            </Button>
                        )}
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
                     {allowBeneficiaryRequests && (
                        <Button asChild className="mt-4">
                            <Link href="/request-help">Request Help Now</Link>
                        </Button>
                    )}
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
    )
}

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
