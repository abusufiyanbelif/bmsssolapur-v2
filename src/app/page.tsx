
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, Users, CheckCircle, Quote as QuoteIcon, Target, Loader2 } from "lucide-react";
import { getRandomQuotes } from "@/services/quotes-service";
import Image from "next/image";
import { getAllDonations } from "@/services/donation-service";
import { getOpenLeads } from "@/app/campaigns/actions";
import { Progress } from "@/components/ui/progress";
import { getAllLeads } from "@/services/lead-service";
import { useEffect, useState } from "react";
import type { Quote, Donation, Lead } from "@/services/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";

export default function LandingPage() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [featuredLeads, setFeaturedLeads] = useState<Lead[]>([]);
    const [stats, setStats] = useState({ totalRaised: 0, beneficiariesHelped: 0, casesClosed: 0 });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedQuotes, openLeads, allDonations, allLeads] = await Promise.all([
                    getRandomQuotes(3),
                    getOpenLeads(),
                    getAllDonations(),
                    getAllLeads(),
                ]);
                
                setQuotes(fetchedQuotes);
                setFeaturedLeads(openLeads.slice(0, 3));

                const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
                const beneficiariesHelped = new Set(allLeads.map(l => l.beneficiaryId)).size;
                const casesClosed = allLeads.filter(l => l.status === 'Closed').length;
                
                setStats({ totalRaised, beneficiariesHelped, casesClosed });

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
        sessionStorage.setItem('redirectAfterLogin', '/campaigns');
        router.push('/login');
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
    
     const exampleCampaigns = [
        { name: "Zakat Drive 2026", purpose: "Collect Zakat for Ramadan", status: "Upcoming", raised: 0, goal: 600000, startDate: "Mar 2026", endDate: "Apr 2026" },
        { name: "Zakat Drive 2025", purpose: "Collect Zakat for Ramadan", status: "Completed", raised: 500000, goal: 500000, startDate: "Mar 2025", endDate: "Apr 2025" },
        { name: "Hospital Emergency Fund", purpose: "Support critical surgery cases", status: "Ongoing", raised: 150000, goal: 300000, startDate: "Jan 2025", endDate: "Dec 2025" },
        { name: "Monthly Relief", purpose: "Provide monthly support to 50 families", status: "Ongoing", raised: 750000, goal: 1200000, startDate: "Jan 2025", endDate: "Dec 2025" },
        { name: "Education Support 2024", purpose: "Raise funds for school fees", status: "Completed", raised: 250000, goal: 250000, startDate: "Jun 2024", endDate: "Aug 2024" },
    ];
    
    const statusColors: Record<string, string> = {
        "Ongoing": "bg-blue-500/20 text-blue-700 border-blue-500/30",
        "Completed": "bg-green-500/20 text-green-700 border-green-500/30",
        "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
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
                        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Featured Cases</h2>
                        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                            Choose a cause that speaks to you. Every donation makes a difference.
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
                                            Seeking help for: <span className="font-semibold">{lead.purpose} {lead.subCategory && `(${lead.subCategory})`}</span>
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
                                        <Button onClick={handleDonateClick} className="w-full">
                                            Donate Now
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                    })}
                    </div>
                    <div className="mt-12 text-center">
                        <Button onClick={handleDonateClick} className="bg-accent text-accent-foreground hover:bg-accent/90">
                            View All Cases
                        </Button>
                    </div>
                </section>
            )}

            {/* Our Campaigns Section */}
            <section id="example-campaigns">
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
                           Types of Campaigns
                        </CardTitle>
                        <CardDescription>
                            We focus on several key areas to provide comprehensive support to our community.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr. No.</TableHead>
                                    <TableHead className="w-[25%]">Campaign</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead className="w-[30%]">Funding Progress</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exampleCampaigns.map((campaign, index) => {
                                    const progress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 100;
                                    return (
                                        <TableRow key={campaign.name}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{campaign.name}</div>
                                                <div className="text-xs text-muted-foreground">{campaign.purpose}</div>
                                            </TableCell>
                                            <TableCell>
                                                {campaign.startDate} - {campaign.endDate}
                                            </TableCell>
                                            <TableCell>
                                                 <div className="flex flex-col gap-2">
                                                    <Progress value={progress} />
                                                    <span className="text-xs text-muted-foreground">
                                                        ₹{campaign.raised.toLocaleString()} / ₹{campaign.goal.toLocaleString()}
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
