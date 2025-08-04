
import { getLead, Lead } from "@/services/lead-service";
import { getUser, User } from "@/services/user-service";
import { getDonation, Donation } from "@/services/donation-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, User as UserIcon, HandHeart, FileText, ShieldCheck, ShieldAlert, ShieldX, Banknote, Edit, Megaphone, CalendarIcon, Target } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { DeleteLeadButton } from "./delete-lead-button";

// Helper data for styling statuses
const statusColors: Record<Lead['status'], string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
};

const verificationStatusConfig: Record<Lead['verifiedStatus'], { color: string; icon: React.ElementType }> = {
    "Pending": { color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", icon: ShieldAlert },
    "Verified": { color: "bg-green-500/20 text-green-700 border-green-500/30", icon: ShieldCheck },
    "Rejected": { color: "bg-red-500/20 text-red-700 border-red-500/30", icon: ShieldX },
};

type AllocatedDonation = Donation & { amountAllocated: number };

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
    const lead = await getLead(params.id);

    if (!lead) {
        notFound();
    }
    
    const [beneficiary, allocatedDonations] = await Promise.all([
        getUser(lead.beneficiaryId),
        Promise.all(
            (lead.donations || []).map(async (alloc) => {
                const donation = await getDonation(alloc.donationId);
                return donation ? { ...donation, amountAllocated: alloc.amount } : null;
            })
        )
    ]);
    
    const validAllocatedDonations = allocatedDonations.filter(d => d !== null) as AllocatedDonation[];
    const verifConfig = verificationStatusConfig[lead.verifiedStatus];
    const fundingProgress = lead.helpRequested > 0 ? (lead.helpGiven / lead.helpRequested) * 100 : 0;
    const pendingAmount = Math.max(0, lead.helpRequested - lead.helpGiven);
    const dueDate = lead.dueDate ? (lead.dueDate as any).toDate() : null;

    return (
        <div className="flex-1 space-y-6">
             <Link href="/admin/leads" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Leads
            </Link>
            
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Lead Details</h2>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href={`/admin/leads/${lead.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Lead
                        </Link>
                    </Button>
                     <DeleteLeadButton leadId={lead.id!} leadName={lead.name} />
                </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText />
                                Case Summary
                            </CardTitle>
                             <CardDescription>
                                Purpose: {lead.purpose} {lead.category && `> ${lead.category}`}
                            </CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center">
                                    <span className="text-muted-foreground mr-2">Case Status:</span> 
                                    <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>{lead.status}</Badge>
                                </div>
                                <div className="flex items-center">
                                     <span className="text-muted-foreground mr-2">Verification:</span> 
                                     <Badge variant="outline" className={cn("capitalize", verifConfig.color)}>
                                        <verifConfig.icon className="mr-1 h-3 w-3" />
                                        {lead.verifiedStatus}
                                    </Badge>
                                </div>
                                 <div className="flex items-center">
                                     <span className="text-muted-foreground mr-2">Type:</span> 
                                     <Badge variant="secondary">{lead.isLoan ? "Loan" : "Aid"}</Badge>
                                </div>
                                {dueDate && (
                                     <div className="flex items-center">
                                         <span className="text-muted-foreground mr-2">Due Date:</span> 
                                         <Badge variant="outline" className="text-destructive border-destructive/50">
                                            <CalendarIcon className="mr-1 h-3 w-3" />
                                            {format(dueDate, "dd MMM yyyy")}
                                        </Badge>
                                    </div>
                                )}
                                {lead.campaignName && (
                                    <div className="flex items-center">
                                        <span className="text-muted-foreground mr-2">Campaign:</span> 
                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20">
                                            <Megaphone className="mr-1 h-3 w-3" />
                                            {lead.campaignName}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <Label>Case Details</Label>
                                <p className="text-sm text-muted-foreground mt-1">{lead.caseDetails || "No details provided."}</p>
                            </div>
                         </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Banknote />
                                Allocated Donations ({validAllocatedDonations.length})
                            </CardTitle>
                             <CardDescription>
                               Donations from the organization's funds that have been applied to this specific case.
                            </CardDescription>
                        </CardHeader>
                         <CardContent>
                             {validAllocatedDonations.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Donor</TableHead>
                                            <TableHead>Transaction ID</TableHead>
                                            <TableHead className="text-right">Amount Allocated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {validAllocatedDonations.map(donation => (
                                            <TableRow key={donation.id}>
                                                <TableCell>{format(donation.createdAt.toDate(), 'dd MMM yyyy')}</TableCell>
                                                <TableCell>{donation.donorName}</TableCell>
                                                <TableCell className="font-mono text-xs">{donation.transactionId || 'N/A'}</TableCell>
                                                <TableCell className="text-right font-semibold">₹{donation.amountAllocated.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No donations have been allocated to this lead yet.</p>
                             )}
                         </CardContent>
                    </Card>
                </div>
                
                {/* Right Column */}
                <div className="md:col-span-1 space-y-6">
                     <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2">
                                <Target />
                                Funding Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={fundingProgress} className="h-4" />
                            <div className="grid grid-cols-2 text-sm">
                                 <div>
                                    <p className="text-muted-foreground">Raised</p>
                                    <p className="font-bold text-lg text-primary">₹{lead.helpGiven.toLocaleString()}</p>
                                </div>
                                 <div className="text-right">
                                    <p className="text-muted-foreground">Goal</p>
                                    <p className="font-bold text-lg">₹{lead.helpRequested.toLocaleString()}</p>
                                </div>
                            </div>
                            {pendingAmount > 0 && (
                                <Alert className="border-amber-500/50 text-amber-900 dark:text-amber-300">
                                    <AlertCircle className="h-4 w-4 !text-amber-500" />
                                    <AlertTitle>Pending Amount</AlertTitle>
                                    <AlertDescription>
                                        <span className="font-bold text-lg">₹{pendingAmount.toLocaleString()}</span> is still needed to complete this case.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon />
                                Beneficiary Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                             {beneficiary ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Name</span>
                                        <span className="font-semibold">{beneficiary.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phone</span>
                                        <span className="font-semibold">{beneficiary.phone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email</span>
                                        <span className="font-semibold">{beneficiary.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Member Since</span>
                                        <span className="font-semibold">{format(beneficiary.createdAt.toDate(), 'dd MMM yyyy')}</span>
                                    </div>
                                </>
                            ) : (
                                 <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>Could not load beneficiary details.</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                         {beneficiary && (
                            <CardFooter>
                                <Button variant="secondary" className="w-full" asChild>
                                    <Link href={`/admin/user-management/${beneficiary.id}/edit`}>View Full Profile</Link>
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
