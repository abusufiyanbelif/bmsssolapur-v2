
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getQuotes, type Quote } from "@/services/quotes-service";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function QuotesPage() {
    let quotes: Quote[] = [];
    let error: string | null = null;

    try {
        quotes = await getQuotes();
         if(quotes.length === 0) {
            error = "No quotes have been added to the database yet. Please run the seeder if this is a new setup.";
        }
    } catch (e) {
        console.error("Failed to fetch quotes from DB.", e);
        error = "Could not load quotes due to a database error.";
        quotes = [];
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
