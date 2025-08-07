
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, Users, CheckCircle, Quote as QuoteIcon, Target, Loader2, PartyPopper } from "lucide-react";
import { getRandomQuotes } from "@/services/quotes-service";
import Image from "next/image";
import { getAllDonations } from "@/services/donation-service";
import { getOpenGeneralLeads as getOpenLeads } from "@/app/campaigns/actions";
import { Progress } from "@/components/ui/progress";
import { getAllLeads } from "@/services/lead-service";
import { useEffect, useState } from "react";
import type { Quote, Donation, Lead, Campaign } from "@/services/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { getAllCampaigns } from "@/services/campaign-service";
import { format } from "date-fns";

export default function LandingPage() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [featuredLeads, setFeaturedLeads] = useState<Lead[]>([]);
    const [recentlyClosedLeads, setRecentlyClosedLeads] = useState<Lead[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState({ totalRaised: 0, beneficiariesHelped: 0, casesClosed: 0 });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedQuotes, openLeads, allDonations, allLeads, fetchedCampaigns] = await Promise.all([
                    getRandomQuotes(3),
                    getOpenLeads(),
                    getAllDonations(),
                    getAllLeads(),
                    getAllCampaigns(),
                ]);
                
                setQuotes(fetchedQuotes);
                setFeaturedLeads(openLeads.slice(0, 3));
                setCampaigns(fetchedCampaigns);

                const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
                const beneficiariesHelped = new Set(allLeads.map(l => l.beneficiaryId)).size;
                const casesClosed = allLeads.filter(l => l.status === 'Closed').length;
                
                setStats({ totalRaised, beneficiariesHelped, casesClosed });

                // Filter for recently closed leads
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const closedThisMonth = allLeads.filter(lead => {
                    if (lead.status !== 'Closed' || !lead.closedAt) return false;
                    const closedDate = (lead.closedAt as any).toDate ? (lead.closedAt as any).toDate() : new Date(lead.closedAt);
                    return closedDate >= startOfMonth;
                }).sort((a,b) => {
                    if (!a.closedAt || !b.closedAt) return 0;
                     const dateA = (a.closedAt as any).toDate ? (a.closedAt as any).toDate() : new Date(a.closedAt);
                    const dateB = (b.closedAt as any).toDate ? (b.closedAt as any).toDate() : new Date(b.closedAt);
                    return dateB.getTime() - dateA.getTime();
                });
                
                setRecentlyClosedLeads(closedThisMonth.slice(0, 3));


            } catch (error) {
                console.error("Failed to fetch landing page data:", error);
                // Set stats to 0 or show an error state if fetching fails
                setStats({ totalRaised: 0, beneficiariesHelped: 0, casesClosed: 0 });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDonateClick = () => {
        router.push('/donate');
    }

    const metrics = [
        {
            title: "Total Verified Funds Raised",
            value: `₹${stats.totalRaised.toLocaleString()}`,
            icon: HandHeart,
            description: "Total verified donations received to date.",
        },
        {
            title: "Beneficiaries Helped",
            value: stats.beneficiariesHelped.toString(),
            icon: Users,
            description: "Unique individuals and families supported.",
        },
        {
            title: "Cases Successfully Closed",
            value: stats.casesClosed.toString(),
            icon: Target,
            description: "Help requests that have been fully funded.",
        },
    ];
    
    const statusColors: Record<string, string> = {
        "Active": "bg-blue-500/20 text-blue-700 border-blue-500/30",
        "Completed": "bg-green-500/20 text-green-700 border-green-500/30",
        "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
        "Cancelled": "bg-red-500/20 text-red-700 border-red-500/30",
    };


    return (
        <div className="flex-1 space-y-8">
            {/* Hero Section */}
            <section className="text-center py-20 px-4 bg-secondary rounded-lg">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline text-primary">
                    Your small help can make a large impact.
                </h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
                    Join BaitulMal Samajik Sanstha (Solapur) to make a lasting impact. Your contribution brings hope, changes lives, and empowers our community.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button onClick={handleDonateClick} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                        Donate Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>

             {/* Public Dashboard Section */}
            <section id="impact">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Our Impact</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                        We believe in complete transparency. Here's a live look at the impact your generosity has created. Together, we are making a difference.
                    </p>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-2">Loading impact stats...</p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {metrics.map((metric) => (
                        <Card key={metric.title}>
                            <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <metric.icon className="h-8 w-8 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-primary">{metric.value}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{metric.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    </div>
                )}
            </section>

            {/* Featured Campaigns Section */}
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading featured campaigns...</p>
                </div>
            ) : featuredLeads.length > 0 && (
                <section id="featured-campaigns">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Cases Needing Support</h2>
                        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                            These are verified, open cases that need your urgent attention. Choose a cause that speaks to you.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {featuredLeads.map((lead) => {
                            const progress = lead.helpRequested > 0 ? (lead.helpGiven / lead.helpRequested) * 100 : 100;
                            const remainingAmount = lead.helpRequested - lead.helpGiven;
                            return (
                                <Card key={lead.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{lead.name}</CardTitle>
                                        <CardDescription>
                                            Seeking help for: <span className="font-semibold">{lead.purpose} {lead.category && `(${lead.category})`}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-3">{lead.caseDetails || "No details provided."}</p>
                                        <div>
                                            <Progress value={progress} className="mb-2" />
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold text-primary">Raised: ₹{lead.helpGiven.toLocaleString()}</span>
                                                <span className="text-muted-foreground">Goal: ₹{lead.helpRequested.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className='flex-col items-stretch gap-4'>
                                        {remainingAmount > 0 && 
                                            <p className="text-destructive font-bold text-center w-full">
                                                ₹{remainingAmount.toLocaleString()} still needed
                                            </p>
                                        }
                                        <Button onClick={() => router.push(`/donate?leadId=${lead.id}`)} className="w-full">
                                            Donate Now
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                    })}
                    </div>
                    <div className="mt-12 text-center">
                        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                            <Link href="/public-leads">View All Cases</Link>
                        </Button>
                    </div>
                </section>
            )}
            
            {/* Recently Closed Cases Section */}
            {loading ? null : recentlyClosedLeads.length > 0 && (
                <section id="success-stories">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Success Stories: Recently Funded</h2>
                        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                            Alhamdulillah! Thanks to your generous support, these cases have been fully funded.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recentlyClosedLeads.map((lead) => (
                        <Card key={lead.id} className="flex flex-col bg-green-500/5 border-green-500/20">
                            <CardHeader>
                                <CardTitle>{lead.name}</CardTitle>
                                <CardDescription>
                                    Funded for: <span className="font-semibold">{lead.purpose} {lead.category && `(${lead.category})`}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-3">{lead.caseDetails || "No details provided."}</p>
                            </CardContent>
                            <CardFooter className="flex items-center justify-between text-sm">
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Closed
                                </Badge>
                                 <span className="text-muted-foreground">
                                    <span className="font-bold text-primary">₹{lead.helpGiven.toLocaleString()}</span> raised
                                </span>
                            </CardFooter>
                        </Card>
                    ))}
                    </div>
                </section>
            )}


            {/* Our Campaigns Section */}
            <section id="our-campaigns">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Our Campaigns</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                        We run various campaigns throughout the year to address the community's needs.
                    </p>
                </div>
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
                       {loading ? (
                           <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="ml-2">Loading campaigns...</p>
                            </div>
                       ) : campaigns.length > 0 ? (
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
                                    {campaigns.slice(0, 5).map((campaign) => {
                                        const raisedAmount = campaign.status === 'Completed' ? campaign.goal : campaign.goal / 2; // Placeholder logic
                                        const progress = campaign.goal > 0 ? (raisedAmount / campaign.goal) * 100 : 0;
                                        return (
                                            <TableRow key={campaign.id}>
                                                <TableCell>
                                                    <div className="font-medium">{campaign.name}</div>
                                                    <div className="text-xs text-muted-foreground">{campaign.description.substring(0, 50)}...</div>
                                                </TableCell>
                                                <TableCell>
                                                    {format(campaign.startDate, "dd MMM yyyy")} - {format(campaign.endDate, "dd MMM yyyy")}
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
                                                    <Badge variant="outline" className={cn(statusColors[campaign.status])}>{campaign.status}</Badge>
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
            </section>


            {/* Wisdom and Reflection Section */}
            <section id="wisdom">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Wisdom & Reflection</h2>
                    <p className="mt-2 text-muted-foreground">A little inspiration for your journey of giving.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {quotes.map((quote, index) => (
                         <Card key={index} className="flex flex-col p-6">
                            <CardContent className="flex-grow flex flex-col gap-4 p-0">
                                <QuoteIcon className="w-8 h-8 text-accent" />
                                <blockquote className="italic text-muted-foreground flex-grow">
                                    "{quote.text}"
                                </blockquote>
                            </CardContent>
                            <CardFooter className="p-0 mt-4">
                                 <cite className="w-full text-right text-sm not-italic text-primary font-medium">— {quote.source}</cite>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
