
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { type Donation, type DonationStatus, getDonationsByUserId } from "@/services/donation-service";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<DonationStatus, string> = {
    "Pending verification": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Verified": "bg-green-500/20 text-green-700 border-green-500/30",
    "Failed/Incomplete": "bg-red-500/20 text-red-700 border-red-500/30",
    "Allocated": "bg-blue-500/20 text-blue-700 border-blue-500/30",
};


export default function MyDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
        setError("You must be logged in to view your donations.");
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const userDonations = await getDonationsByUserId(userId);
        // Sort by most recent first
        userDonations.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setDonations(userDonations);
        setError(null);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to fetch donation history: ${errorMessage}`);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [userId]);
  
  const handleDownloadReceipt = () => {
    toast({
        title: "In Progress",
        description: "PDF receipt generation is planned for a future update.",
    });
  }
  
  const renderReceiptButton = (donation: Donation) => (
      <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownloadReceipt}
          disabled={donation.status !== 'Verified' && donation.status !== 'Allocated'}
      >
          <Download className="mr-2 h-4 w-4" />
          Receipt
      </Button>
  );

  const renderDesktopTable = () => (
     <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {donations.map((donation) => (
                <TableRow key={donation.id}>
                    <TableCell>{format(donation.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-semibold">₹{donation.amount.toLocaleString()}</TableCell>
                    <TableCell>{donation.type}</TableCell>
                    <TableCell>{donation.purpose || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn("capitalize", statusColors[donation.status])}>
                            {donation.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {renderReceiptButton(donation)}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
  );

  const renderMobileCards = () => (
      <div className="space-y-4">
          {donations.map(donation => (
               <Card key={donation.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg">₹{donation.amount.toFixed(2)}</CardTitle>
                                <CardDescription>{format(donation.createdAt.toDate(), "dd MMM yyyy")}</CardDescription>
                            </div>
                             <Badge variant="outline" className={cn("capitalize", statusColors[donation.status])}>
                                {donation.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Category</span>
                            <span>{donation.type}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Purpose</span>
                            <span>{donation.purpose || 'N/A'}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                       {renderReceiptButton(donation)}
                    </CardFooter>
                </Card>
          ))}
      </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
          <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading your donations...</p>
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

    if (donations.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">You have not made any donations yet.</p>
            </div>
        )
    }

    return isMobile ? renderMobileCards() : renderDesktopTable();
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
            {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

    