
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, Users, CheckCircle, Quote as QuoteIcon, Target, TrendingUp } from "lucide-react";
import { getRandomQuotes, Quote } from "@/services/quotes-service";
import Image from "next/image";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";

export default async function LandingPage() {
    const quotes = await getRandomQuotes(3);
    const allDonations = await getAllDonations();
    const allLeads = await getAllLeads();

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
            <section className="text-center py-20 px-4 bg-primary/5 rounded-lg">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline text-primary">
                    Empowering Our Community, Together
                </h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
                    Join Baitul Mal Samajik Sanstha in providing life-enriching aid to underserved populations in Solapur. Your contribution makes a real difference.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button asChild size="lg">
                        <Link href="/campaigns">View Campaigns</Link>
                    </Button>
                </div>
            </section>

             {/* Public Dashboard Section */}
            <section id="impact">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Our Impact</h2>
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

            {/* Wisdom and Reflection Section */}
            <section id="wisdom">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Wisdom & Reflection</h2>
                    <p className="mt-2 text-muted-foreground">A little inspiration for your journey of giving.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {quotes.map((quote, index) => (
                        <Card key={index} className="flex flex-col">
                             <CardHeader className="flex-row gap-4 items-center">
                                <QuoteIcon className="w-8 h-8 text-accent" />
                                <CardTitle className="text-base font-semibold">{quote.category}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <blockquote className="italic text-muted-foreground">
                                    "{quote.text}"
                                </blockquote>
                            </CardContent>
                            <CardFooter>
                                 <cite className="w-full text-right text-sm not-italic text-primary font-medium">— {quote.source}</cite>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
