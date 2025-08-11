
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, ChevronLeft, ChevronRight, HandHeart, Save } from "lucide-react";
import { getDonationsByUserId } from "@/services/donation-service";
import { getUser, updateUser } from "@/services/user-service";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Donation, DonationStatus, User } from "@/services/types";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { DonationReceiptDialog } from "@/components/donation-receipt-dialog";

const statusColors: Record<DonationStatus, string> = {
    "Pending verification": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Verified": "bg-green-500/20 text-green-700 border-green-500/30",
    "Failed/Incomplete": "bg-red-500/20 text-red-700 border-red-500/30",
    "Partially Allocated": "bg-orange-500/20 text-orange-700 border-orange-500/30",
    "Allocated": "bg-blue-500/20 text-blue-700 border-blue-500/30",
};


function PledgeSettings({ user, onUpdate }: { user: User, onUpdate: () => void }) {
    const { toast } = useToast();
    const [monthlyPledgeEnabled, setMonthlyPledgeEnabled] = useState(user.monthlyPledgeEnabled || false);
    const [monthlyPledgeAmount, setMonthlyPledgeAmount] = useState(user.monthlyPledgeAmount || 0);
    const [enableMonthlyDonationReminder, setEnableMonthlyDonationReminder] = useState(user.enableMonthlyDonationReminder || false);
    const [isSavingPledge, setIsSavingPledge] = useState(false);

    const handleSavePledge = async () => {
        setIsSavingPledge(true);
        try {
            await updateUser(user.id!, {
                monthlyPledgeEnabled,
                monthlyPledgeAmount: Number(monthlyPledgeAmount),
                enableMonthlyDonationReminder,
            });
            toast({ variant: 'success', title: 'Settings Updated', description: 'Your pledge and notification settings have been saved.' });
            onUpdate(); // Callback to re-fetch user data in parent
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save your settings.' });
            console.error(e);
        } finally {
            setIsSavingPledge(false);
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Notification & Pledge Settings</CardTitle>
                <CardDescription>Manage your recurring donation commitment and related notification settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="monthly-pledge-switch" className="font-semibold">Enable Monthly Donation Pledge</Label>
                        <Switch
                            id="monthly-pledge-switch"
                            checked={monthlyPledgeEnabled}
                            onCheckedChange={setMonthlyPledgeEnabled}
                        />
                    </div>
                     {monthlyPledgeEnabled && (
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="pledge-amount">My Monthly Pledge Amount (₹)</Label>
                            <Input
                                id="pledge-amount"
                                type="number"
                                value={monthlyPledgeAmount}
                                onChange={(e) => setMonthlyPledgeAmount(Number(e.target.value))}
                                placeholder="e.g., 500"
                            />
                        </div>
                    )}
                </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="monthly-reminder-switch" className="font-semibold">Enable Monthly Donation Reminder</Label>
                         <Switch
                            id="monthly-reminder-switch"
                            checked={enableMonthlyDonationReminder}
                            onCheckedChange={setEnableMonthlyDonationReminder}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">If enabled, you will receive an email reminder to make your monthly donation.</p>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSavePledge} disabled={isSavingPledge}>
                    {isSavingPledge ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function MyDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [user, setUser] = useState<User | null>(null);
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

  const fetchData = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const [userDonations, fetchedUser] = await Promise.all([
          getDonationsByUserId(userId),
          getUser(userId)
        ]);
        
        userDonations.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
        setDonations(userDonations);
        setUser(fetchedUser);
        setError(null);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to fetch donation history: ${errorMessage}`);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (userId) {
        fetchData();
    }
  }, [userId]);
  
    const paginatedDonations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return donations.slice(startIndex, startIndex + itemsPerPage);
    }, [donations, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(donations.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);
  
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
                    <TableCell>{format(donation.createdAt as Date, "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-semibold">₹{donation.amount.toLocaleString()}</TableCell>
                    <TableCell>{donation.type}</TableCell>
                    <TableCell>{donation.purpose || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn("capitalize", statusColors[donation.status])}>
                            {donation.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DonationReceiptDialog donation={donation} user={user!} />
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
                                <CardDescription>{format(donation.createdAt as Date, "dd MMM yyyy")}</CardDescription>
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
                       <DonationReceiptDialog donation={donation} user={user!} />
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
    if (loading && !user) {
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
        
        {user && user.roles.includes('Donor') && <PledgeSettings user={user} onUpdate={fetchData} />}
        
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
