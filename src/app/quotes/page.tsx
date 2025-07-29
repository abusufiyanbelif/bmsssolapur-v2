
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInspirationalQuotes, type Quote } from "@/ai/flows/get-inspirational-quotes-flow";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const staticQuotes: Quote[] = [
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


export default async function QuotesPage() {
    let quotes: Quote[];
    let error: string | null = null;

    try {
        quotes = await getInspirationalQuotes(10);
         if(quotes.length === 0) {
            // Fallback if AI returns empty array
            quotes = staticQuotes;
        }
    } catch (e) {
        console.error("Failed to fetch dynamic quotes, using fallback.", e);
        error = "Could not load dynamic quotes at this time. Displaying a few examples.";
        quotes = staticQuotes;
    }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Inspirational Quotes</h2>
            <Card>
                <CardHeader>
                    <CardTitle>A Collection of Wisdom</CardTitle>
                    <CardDescription>
                        A collection of quotes from the Quran and Hadith about charity, compassion, and helping others.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                         <Alert variant="default" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Note</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[70%]">Quote</TableHead>
                                <TableHead>Source</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotes.map((quote, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium italic">"{quote.text}"</TableCell>
                                    <TableCell>{quote.source}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
