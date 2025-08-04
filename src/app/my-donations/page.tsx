
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, ChevronLeft, ChevronRight, HandHeart } from "lucide-react";
import { getDonationsByUserId } from "@/services/donation-service";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Donation, DonationStatus } from "@/services/types";
import Link from "next/link";

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
  
    const paginatedDonations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return donations.slice(startIndex, startIndex + itemsPerPage);
    }, [donations, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(donations.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
  
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
                <TableHead>Sr. No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {paginatedDonations.map((donation, index) => (
                <TableRow key={donation.id}>
                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
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
          {paginatedDonations.map((donation, index) => (
               <Card key={donation.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-lg">#{(currentPage - 1) * itemsPerPage + index + 1}: ₹{donation.amount.toFixed(2)}</CardTitle>
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
  
   const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedDonations.length} of {donations.length} donations.
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${itemsPerPage}`}
                        onValueChange={(value) => {
                            setItemsPerPage(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                        {[10, 25, 50].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next</span>
                    </Button>
                </div>
            </div>
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
                <Button asChild className="mt-4">
                    <Link href="/campaigns">
                        <HandHeart className="mr-2 h-4 w-4" />
                        Donate Now
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            {isMobile ? renderMobileCards() : renderDesktopTable()}
            {totalPages > 1 && renderPaginationControls()}
        </>
    )
  }
  
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">My Donations</h2>
           <Button asChild>
                <Link href="/campaigns">
                    <HandHeart className="mr-2 h-4 w-4" />
                    Donate Now
                </Link>
            </Button>
      </div>
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
