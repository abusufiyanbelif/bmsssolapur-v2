
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type Lead, type LeadStatus, getAllLeads } from "@/services/lead-service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FilePlus2, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const statusColors: Record<LeadStatus, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
};


export default function MyCasesPage() {
    const [cases, setCases] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string |null>(null);

    // In a real app, this ID would come from the logged-in user's context.
    const userId = "beneficiary_user_placeholder_id";

    useEffect(() => {
        const fetchCases = async () => {
            try {
                setLoading(true);
                // This fetches all leads. In a real app, this service would be updated
                // to fetch only leads associated with the logged-in beneficiary.
                const allLeads = await getAllLeads();
                const userCases = allLeads.filter(l => l.id === userId); // Placeholder logic
                 userCases.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                setCases(userCases);
            } catch (e) {
                setError("Failed to load your cases.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchCases();
    }, [userId]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading your cases...</p>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        if (cases.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">You have not submitted any help requests.</p>
                </div>
            )
        }

        return (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date Submitted</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[30%]">Funding Progress</TableHead>
                        <TableHead className="text-right">Amount Requested</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cases.map((caseItem) => {
                        const progress = caseItem.helpRequested > 0 ? (caseItem.helpGiven / caseItem.helpRequested) * 100 : 100;
                        return (
                            <TableRow key={caseItem.id}>
                                <TableCell>{format(caseItem.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                                <TableCell>{caseItem.category}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("capitalize", statusColors[caseItem.status])}>
                                        {caseItem.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <Progress value={progress}  />
                                        <span className="text-xs text-muted-foreground">
                                            ₹{caseItem.helpGiven.toLocaleString()} / ₹{caseItem.helpRequested.toLocaleString()}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold">₹{caseItem.helpRequested.toLocaleString()}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        );
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">My Help Requests</h2>
             <Button asChild>
                <Link href="/request-help">
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Submit New Request
                </Link>
            </Button>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>My Cases</CardTitle>
          <CardDescription>
            Here is a list of all the help requests you have submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
