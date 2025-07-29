
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { type DonationStatus } from "@/services/donation-service";
import { cn } from "@/lib/utils";

// In a real app, this data would be fetched for the logged-in user
const userDonations = [
  {
    id: "don-1",
    date: "2024-07-20",
    amount: 5000,
    type: "Zakat",
    status: "Verified",
    lead: "Education for Orphans"
  },
  {
    id: "don-2",
    date: "2024-07-18",
    amount: 1000,
    type: "Sadaqah",
    status: "Pending verification",
    lead: "Hospital Bill for Patient X"
  },
  {
    id: "don-3",
    date: "2024-06-15",
    amount: 2500,
    type: "Fitr",
    status: "Allocated",
    lead: "Community Iftar Program"
  },
   {
    id: "don-4",
    date: "2024-06-01",
    amount: 750,
    type: "Sadaqah",
    status: "Failed/Incomplete",
    lead: "N/A"
  },
];

const statusColors: Record<DonationStatus, string> = {
    "Pending verification": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Verified": "bg-green-500/20 text-green-700 border-green-500/30",
    "Failed/Incomplete": "bg-red-500/20 text-red-700 border-red-500/30",
    "Allocated": "bg-blue-500/20 text-blue-700 border-blue-500/30",
};


export default function MyDonationsPage() {
  // A real implementation would have a function here to handle receipt download
  const handleDownloadReceipt = () => {
    // Placeholder functionality
    alert("Receipt download functionality is in progress.");
  }
  
  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline">My Donations</h2>
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
          <CardDescription>
            A record of all your generous contributions. Thank you for your support.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Supported Cause</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {userDonations.map((donation) => (
                        <TableRow key={donation.id}>
                            <TableCell>{donation.date}</TableCell>
                            <TableCell className="font-semibold">₹{donation.amount.toLocaleString()}</TableCell>
                            <TableCell>{donation.type}</TableCell>
                            <TableCell>{donation.lead}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("capitalize", statusColors[donation.status as DonationStatus])}>
                                    {donation.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleDownloadReceipt}
                                    disabled={donation.status !== 'Verified' && donation.status !== 'Allocated'}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Receipt
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
