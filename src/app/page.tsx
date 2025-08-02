

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, Users, CheckCircle, Quote as QuoteIcon, Target } from "lucide-react";
import { getRandomQuotes, Quote } from "@/services/quotes-service";
import Image from "next/image";
import { getAllDonations } from "@/services/donation-service";
import { Lead } from "@/services/lead-service";
import { getOpenLeads } from "@/app/campaigns/actions";
import { Progress } from "@/components/ui/progress";
import { getAllLeads } from "@/services/lead-service";

export default async function LandingPage() {
    const quotes = await getRandomQuotes(3);
    const allDonations = await getAllDonations();
    const allLeads = await getAllLeads();
    const featuredLeads = (await getOpenLeads()).slice(0, 3);

    const totalRaised = allDonations.reduce((acc, d) => d.status === 'Verified' || d.status === 'Allocated' ? acc + d.amount : acc, 0);
    const beneficiariesHelped = new Set(allLeads.map(l => l.beneficiaryId)).size;
    const casesClosed = allLeads.filter(l => l.status === 'Closed').length;

    const metrics = [
        {
            title: "Total Verified Funds Raised",
            value: `₹${totalRaised.toLocaleString()}`,
            icon: HandHeart,
            description: "Total verified donations received to date.",
        },
        {
            title: "Beneficiaries Helped",
            value: beneficiariesHelped.toString(),
            icon: Users,
            description: "Unique individuals and families supported.",
        },
        {
            title: "Cases Successfully Closed",
            value: casesClosed.toString(),
            icon: Target,
            description: "Help requests that have been fully funded.",
        },
    ];

    return (
        <div className="flex-1 space-y-12">
            {/* Hero Section */}
            <section className="text-center py-20 px-4 bg-secondary rounded-lg">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline text-primary">
                    Connecting Hearts, Empowering Communities
                </h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
                    Join BaitulMal Samajik Sanstha (Solapur) to make a lasting impact. Your contribution, whether Zakat, Sadaqah, or General Help, brings hope and changes lives.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link href="/organization">Donate Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
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
            </section>

            {/* Featured Campaigns Section */}
            <section id="featured-campaigns">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Featured Campaigns</h2>
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
                                    <Button asChild className="w-full">
                                        <Link href="/login">Donate Now</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                   })}
                </div>
                <div className="mt-12 text-center">
                    <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link href="/campaigns">View All Campaigns</Link>
                    </Button>
                </div>
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
                            <CardContent className="flex-grow flex flex-col gap-4">
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
