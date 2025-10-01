

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllQuotes, type Quote } from "@/services/quotes-service";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchQuotes = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedQuotes = await getAllQuotes();
            // Sort by category, then by number
            fetchedQuotes.sort((a, b) => {
                if (a.category < b.category) return -1;
                if (a.category > b.category) return 1;
                return a.number - b.number;
            });
            setQuotes(fetchedQuotes);
        } catch (e) {
            console.error("Failed to fetch quotes from database.", e);
            setError("Could not load quotes due to a database error.");
            setQuotes([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchQuotes();
    }, []);

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                 <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Inspirational Quotes</h2>
                 <Button onClick={fetchQuotes} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Refresh Quotes
                 </Button>
            </div>
           
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">A Collection of Wisdom</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        A collection of quotes from the Quran, Hadith, and scholars about charity, compassion, and helping others.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                         <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {loading && quotes.length === 0 ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Loading quotes...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">No.</TableHead>
                                    <TableHead className="w-[60%]">Quote</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Source</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotes.map((quote, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{quote.number}</TableCell>
                                        <TableCell className="font-medium italic">&quot;{quote.text}&quot;</TableCell>
                                        <TableCell>{quote.category}</TableCell>
                                        <TableCell>{quote.source}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
