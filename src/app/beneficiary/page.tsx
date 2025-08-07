// In a real app, this would be a server component fetching data for the logged-in user.
// For now, we'll keep it as a client component and simulate the data fetching.
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle, Quote as QuoteIcon, Search, FilterX, Target, ChevronLeft, ChevronRight, Check, Save, FilePlus2, Baby, PersonStanding, HomeIcon, DollarSign, Wheat, Gift, Building, Shield, PiggyBank, PackageOpen, History, Megaphone, Users as UsersIcon } from "lucide-react";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getRandomQuotes } from "@/services/quotes-service";
import type { User, Lead, Quote, LeadStatus } from "@/services/types";
import { getUser } from "@/services/user-service";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function BeneficiaryDashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [cases, setCases] = useState<Lead[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                if (!fetchedUser || !fetchedUser.roles.includes('Beneficiary')) {
                    setError("You do not have permission to view this page.");
                    setLoading(false);
                    return;
                }
                setUser(fetchedUser);

                const [beneficiaryCases, randomQuotes] = await Promise.all([
                    getLeadsByBeneficiaryId(storedUserId),
                    getRandomQuotes(3)
                ]);
                setCases(beneficiaryCases);
                setQuotes(randomQuotes);

            } catch (e) {
                setError("Failed to load dashboard data.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
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
                Beneficiary Dashboard
            </h2>
            <p className="text-muted-foreground">
              Welcome back, {user.name}. Manage your help requests here.
            </p>
        </div>
      <BeneficiaryDashboard cases={cases} quotes={quotes} />
    </div>
  );
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
    
    const {
        totalAidReceived,
        activeCases,
        casesClosed,
        totalRequested
    } = useMemo(() => {
        let totalAidReceived = 0;
        let activeCases = 0;
        let casesClosed = 0;
        let totalRequested = 0;

        cases.forEach(caseItem => {
            totalRequested += caseItem.helpRequested;
            if (caseItem.status === 'Closed') {
                casesClosed++;
                totalAidReceived += caseItem.helpGiven;
            }
            if (caseItem.status === 'Pending' || caseItem.status === 'Partial') {
                activeCases++;
            }
        });
        return { totalAidReceived, activeCases, casesClosed, totalRequested };
    }, [cases]);

    const stats = [
        { title: "Total Aid Received", value: `₹${totalAidReceived.toLocaleString()}`, icon: PiggyBank },
        { title: "Active Cases", value: activeCases, icon: PackageOpen },
        { title: "Cases Closed", value: casesClosed, icon: Check },
        { title: "Total Aid Requested", value: `₹${totalRequested.toLocaleString()}`, icon: History },
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
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
