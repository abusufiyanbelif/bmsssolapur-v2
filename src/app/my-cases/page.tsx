
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type LeadStatus } from "@/services/lead-service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";

// In a real app, this data would be fetched for the logged-in user
const userCases = [
  {
    id: "case-1",
    category: "Education",
    status: "Pending",
    helpRequested: 50000,
    helpGiven: 10000,
    dateCreated: "2024-07-15",
  },
  {
    id: "case-2",
    category: "Hospital",
    status: "Closed",
    helpRequested: 75000,
    helpGiven: 75000,
    dateCreated: "2024-05-02",
  },
   {
    id: "case-3",
    category: "Loan and Relief Fund",
    status: "Partial",
    helpRequested: 25000,
    helpGiven: 15000,
    dateCreated: "2024-06-20",
  },
];

const statusColors: Record<LeadStatus, string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
};


export default function MyCasesPage() {
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
                    {userCases.map((caseItem) => {
                        const progress = caseItem.helpRequested > 0 ? (caseItem.helpGiven / caseItem.helpRequested) * 100 : 100;
                        return (
                            <TableRow key={caseItem.id}>
                                <TableCell>{caseItem.dateCreated}</TableCell>
                                <TableCell>{caseItem.category}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn("capitalize", statusColors[caseItem.status as LeadStatus])}>
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
        </CardContent>
      </Card>
    </div>
  );
}
