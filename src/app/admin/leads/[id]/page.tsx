

import { getLead, Lead } from "@/services/lead-service";
import { getUser, User } from "@/services/user-service";
import { getDonation, Donation, getAllDonations } from "@/services/donation-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, User as UserIcon, HandHeart, FileText, ShieldCheck, ShieldAlert, ShieldX, Banknote, Edit, Megaphone, CalendarIcon, Target, CheckCircle, UserPlus, Coins, MoreHorizontal, Clock, Ban, Paperclip, Upload, History, FileUp, Eye, Package, UserSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { DeleteLeadButton } from "./delete-lead-button";
import { Separator } from "@/components/ui/separator";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { ActivityLog, getUserActivity } from "@/services/activity-log-service";
import { AddTransferDialog } from "./add-transfer-dialog";
import { AuditTrail } from "./audit-trail";
import { VerificationStatusCard } from "./verification-status-card";
import { getAllUsers } from "@/services/user-service";
import { AllocateDonationsDialog } from "./allocate-donations-dialog";

// Helper data for styling statuses
const statusColors: Record<Lead['caseAction'], string> = {
    "Pending": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Ready For Help": "bg-cyan-500/20 text-cyan-700 border-cyan-500/30",
    "Publish": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Partial": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Complete": "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
    "Closed": "bg-green-500/20 text-green-700 border-green-500/30",
    "On Hold": "bg-orange-500/20 text-orange-700 border-orange-500/30",
    "Cancelled": "bg-gray-500/20 text-gray-700 border-gray-500/30",
};

const statusIcons: Record<Lead['caseAction'], React.ElementType> = {
    "Pending": Clock,
    "Ready For Help": Package,
    "Publish": Eye,
    "Partial": Clock,
    "Complete": CheckCircle,
    "Closed": CheckCircle,
    "On Hold": MoreHorizontal,
    "Cancelled": Ban,
};

const verificationStatusConfig: Record<Lead['verifiedStatus'], { color: string; icon: React.ElementType }> = {
    "Pending": { color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", icon: ShieldAlert },
    "Verified": { color: "bg-green-500/20 text-green-700 border-green-500/30", icon: ShieldCheck },
    "Rejected": { color: "bg-red-500/20 text-red-700 border-red-500/30", icon: ShieldX },
    "More Info Required": { color: "bg-blue-500/20 text-blue-700 border-blue-500/30", icon: MoreHorizontal },
    "Duplicate": { color: "bg-purple-500/20 text-purple-700 border-purple-500/30", icon: Ban },
    "Other": { color: "bg-gray-500/20 text-gray-700 border-gray-500/30", icon: MoreHorizontal },
};

type AllocatedDonation = Donation & { amountAllocated: number, allocatedByUserName: string, allocatedAt: any };

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
    const lead = await getLead(params.id);

    if (!lead) {
        notFound();
    }
    
    const [beneficiary, allocatedDonations, activityLogs, allUsers, allDonations] = await Promise.all([
        getUser(lead.beneficiaryId),
        Promise.all(
            (lead.donations || []).map(async (alloc) => {
                const donation = await getDonation(alloc.donationId);
                return donation ? { ...donation, amountAllocated: alloc.amount, allocatedByUserName: alloc.allocatedByUserName, allocatedAt: alloc.allocatedAt } : null;
            })
        ),
        getUserActivity(lead.beneficiaryId), // Fetching activity for the beneficiary
        getAllUsers(), // Fetch all users to identify approvers
        getAllDonations(),
    ]);
    
    const validAllocatedDonations = allocatedDonations.filter(d => d !== null) as AllocatedDonation[];
    const verifConfig = verificationStatusConfig[lead.verifiedStatus];
    const caseAction = lead.caseAction || 'Pending';
    const StatusIcon = statusIcons[caseAction];
    const fundingProgress = lead.helpRequested > 0 ? (lead.helpGiven / lead.helpRequested) * 100 : 0;
    const pendingAmount = Math.max(0, lead.helpRequested - lead.helpGiven);
    const dueDate = lead.dueDate;
    const closedDate = lead.closedAt;

    const leadSpecificActivity = activityLogs.filter(log => log.details.leadId === lead.id || log.details.linkedLeadId === lead.id);


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
                            {lead.headline && (
                                <blockquote className="mt-2 border-l-2 pl-6 italic">
                                    "{lead.headline}"
                                </blockquote>
                            )}
                             {lead.story && (
                                <div>
                                    <Label>Story</Label>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{lead.story}</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center">
                                    <span className="text-muted-foreground mr-2">Case Action:</span> 
                                    <Badge variant="outline" className={cn("capitalize", statusColors[caseAction])}>
                                      <StatusIcon className="mr-1 h-3 w-3" />
                                      {caseAction}
                                    </Badge>
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
                                {closedDate && (
                                     <div className="flex items-center">
                                         <span className="text-muted-foreground mr-2">Closed Date:</span> 
                                         <Badge variant="outline" className="bg-green-100 text-green-800">
                                            <CheckCircle className="mr-1 h-3 w-3" />
                                            {format(closedDate, "dd MMM yyyy")}
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
                            
                             {lead.referredByUserName && (
                                <div>
                                    <Label className="flex items-center gap-2">
                                        <UserSquare />
                                        Referred By
                                    </Label>
                                    <p className="text-sm font-semibold mt-1">{lead.referredByUserName}</p>
                                </div>
                            )}
                            
                            <div>
                                <Label>Internal Case Summary</Label>
                                <p className="text-sm text-muted-foreground mt-1">{lead.caseDetails || "No details provided."}</p>
                            </div>
                             {lead.acceptableDonationTypes && lead.acceptableDonationTypes.length > 0 && (
                                <div>
                                    <Label className="flex items-center gap-2">
                                        <Coins />
                                        Acceptable Donation Types
                                    </Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {lead.acceptableDonationTypes.map(type => (
                                            <Badge key={type} variant="secondary">{type}</Badge>
                                        ))}
                                    </div>
                                </div>
                             )}
                         </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Banknote />
                                    Fund Transfers
                                </CardTitle>
                                <CardDescription>
                                    A record of all funds transferred to the beneficiary for this case.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                 <AddTransferDialog leadId={lead.id!} />
                                 <AllocateDonationsDialog lead={lead} allDonations={allDonations} />
                            </div>
                        </CardHeader>
                        <CardContent>
                           {lead.fundTransfers && lead.fundTransfers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead className="text-right">Proof</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lead.fundTransfers.map((transfer, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                  <p>{format(transfer.transferredAt as any, "dd MMM yyyy, p")}</p>
                                                  <p className="text-xs text-muted-foreground">{transfer.paymentApp} ({transfer.status})</p>
                                                </TableCell>
                                                <TableCell className="font-semibold">₹{transfer.amount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                  <p>{transfer.senderName || 'N/A'}</p>
                                                  <p className="font-mono text-xs text-muted-foreground">{transfer.senderAccountNumber || 'N/A'}</p>
                                                </TableCell>
                                                 <TableCell>
                                                  <p>{transfer.recipientName || 'N/A'}</p>
                                                  <p className="font-mono text-xs text-muted-foreground">{transfer.recipientAccountNumber || transfer.recipientUpiId || 'N/A'}</p>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={transfer.proofUrl} target="_blank" rel="noopener noreferrer">View Proof</Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                           ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No fund transfers have been recorded for this lead yet.</p>
                           )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row justify-between items-start">
                             <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Paperclip />
                                    Attached Documents
                                </CardTitle>
                                <CardDescription>
                                Supporting documents uploaded for this case.
                                </CardDescription>
                            </div>
                            <UploadDocumentDialog leadId={lead.id!} />
                        </CardHeader>
                         <CardContent>
                             {lead.verificationDocumentUrl ? (
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <p className="font-semibold">Verification Document</p>
                                    </div>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={lead.verificationDocumentUrl} target="_blank" rel="noopener noreferrer">
                                            View Document
                                        </Link>
                                    </Button>
                                </div>
                             ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No documents have been uploaded for this lead.</p>
                             )}
                         </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HandHeart />
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
                                            <TableHead>Allocated By</TableHead>
                                            <TableHead>From Donation</TableHead>
                                            <TableHead className="text-right">Amount Allocated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {validAllocatedDonations.map(donation => (
                                            <TableRow key={donation.id}>
                                                <TableCell>{format(donation.allocatedAt, 'dd MMM yyyy, p')}</TableCell>
                                                <TableCell>{donation.allocatedByUserName || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <p>{donation.donorName}</p>
                                                    <p className="font-mono text-xs text-muted-foreground">{donation.transactionId || 'N/A'}</p>
                                                </TableCell>
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
                    
                    <AuditTrail lead={lead} activityLogs={activityLogs} />

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
                    <VerificationStatusCard lead={lead} allApprovers={allUsers} />
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
                                        <span className="font-semibold">{format(beneficiary.createdAt, 'dd MMM yyyy')}</span>
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
