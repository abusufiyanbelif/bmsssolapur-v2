
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Quote, BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getOpenLeads } from "./campaigns/actions";
import { Badge } from "@/components/ui/badge";
import { type DonationType, type DonationPurpose } from "@/services/donation-service";
import { getInspirationalQuotes, type Quote as QuoteType } from "@/ai/flows/get-inspirational-quotes-flow";

const staticQuotes: QuoteType[] = [
  {
    text: "Those who in charity spend of their goods by night and by day, in secret and in public, have their reward with their Lord: on them shall be no fear, nor shall they grieve.",
    source: "Quran, 2:274"
  },
  {
    text: "The believer's shade on the Day of Resurrection will be his charity.",
    source: "Hadith, Tirmidhi"
  },
  {
    text: "When a man dies, his deeds come to an end except for three things: Sadaqah Jariyah (ceaseless charity); a knowledge which is beneficial, or a virtuous descendant who prays for him (for the deceased).",
    source: "Hadith, Muslim"
  }
];

const donationCategories: (DonationType | DonationPurpose)[] = [
    'Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah',
    'Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use'
];


export default async function LandingPage() {
  const openLeads = await getOpenLeads();
  const featuredLeads = openLeads.slice(0, 3);
  
  let quotes: QuoteType[];
  try {
    quotes = await getInspirationalQuotes();
    if(quotes.length === 0) {
        // Fallback if AI returns empty array
        quotes = staticQuotes;
    }
  } catch (error) {
    console.error("Failed to fetch dynamic quotes, using fallback.", error);
    quotes = staticQuotes;
  }


  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[calc(80vh-150px)] text-center p-4 bg-background">
        <div className="max-w-4xl">
           <h1 className="text-5xl font-bold tracking-tighter font-headline sm:text-6xl md:text-7xl">
            <span className="text-primary font-bold">Baitul Mal</span>{' '}
            <span className="text-accent font-bold">Samajik Sanstha</span>{' '}
            <span className="text-primary font-bold">(Solapur)</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            A non-profit organization dedicated to serving the community through various social welfare activities, guided by Islamic principles of charity and compassion.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/campaigns">
                Donate Now <HeartHandshake className="ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/organization">
                About Us <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Campaigns Section */}
      {featuredLeads.length > 0 && (
        <section id="campaigns" className="py-16 lg:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold tracking-tight font-headline">Featured Campaigns</h2>
                    <p className="mt-2 text-lg text-muted-foreground">Your contribution can make a world of difference. Here are some urgent needs.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {featuredLeads.map((lead) => {
                        const progress = lead.helpRequested > 0 ? (lead.helpGiven / lead.helpRequested) * 100 : 100;
                        const remainingAmount = lead.helpRequested - lead.helpGiven;
                        return (
                             <Card key={lead.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{lead.name === "Anonymous" ? "Anonymous Beneficiary" : lead.name}</CardTitle>
                                    <CardDescription>
                                        Seeking help for: <span className="font-semibold">{lead.category}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{lead.caseDetails || "No details provided."}</p>
                                    <Progress value={progress} className="mb-2" />
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold">Raised: ₹{lead.helpGiven.toLocaleString()}</span>
                                        <span className="text-muted-foreground">Goal: ₹{lead.helpRequested.toLocaleString()}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href="/login">
                                            Donate Now
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
                 <div className="text-center mt-12">
                    <Button asChild variant="secondary">
                        <Link href="/campaigns">View All Campaigns <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
            </div>
        </section>
      )}
      
      {/* Our Causes Section */}
      <section id="causes" className="py-16 lg:py-24">
         <div className="container mx-auto px-4">
             <div className="text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tight font-headline">Our Causes</h2>
                <p className="mt-2 text-lg text-muted-foreground">We channel your donations into various categories of need.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-center">
                {donationCategories.map(category => (
                    <Badge key={category} variant="outline" className="text-base px-4 py-2 border-primary/50 text-primary-foreground bg-primary/10">
                       <BookOpenCheck className="mr-2" />
                       {category}
                    </Badge>
                ))}
            </div>
         </div>
      </section>

      {/* Quotes Section */}
      <section id="quotes" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tight font-headline">Wisdom & Reflection</h2>
                <p className="mt-2 text-lg text-muted-foreground">Inspiration from Islamic teachings on charity and compassion.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
                {quotes.map((quote, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardContent className="pt-6 flex-grow">
                            <Quote className="w-8 h-8 text-primary mb-4" />
                            <blockquote className="text-lg italic text-foreground">
                                "{quote.text}"
                            </blockquote>
                        </CardContent>
                        <CardFooter>
                            <cite className="font-semibold not-italic">{quote.source}</cite>
                        </CardFooter>
                    </Card>
                ))}
            </div>
             <div className="text-center mt-12">
                <Button asChild variant="secondary">
                    <Link href="/quotes">View All Quotes <ArrowRight className="ml-2" /></Link>
                </Button>
            </div>
        </div>
      </section>

    </div>
  );
}
