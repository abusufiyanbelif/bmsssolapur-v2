

'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getDonation, type Donation } from '@/services/donation-service';
import { getLead, type Lead } from '@/services/lead-service';
import { getUser, type User } from '@/services/user-service';
import { getDonationActivity, type ActivityLog } from '@/services/activity-log-service';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Loader2, FileText, User as UserIcon, HandHeart, CalendarIcon, CheckCircle, Hash } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditTrail } from '../../audit-trail';
import { format } from "date-fns";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


export default function AllocationDetailPage() {
    const params = useParams();
    const donationId = Array.isArray(params.id) ? params.id[0] : params.id;
    const allocationIndex = parseInt(Array.isArray(params.index) ? params.index[0] : params.index, 10);

    const [donation, setDonation] = useState<Donation | null>(null);
    const [lead, setLead] = useState<Lead | null>(null);
    const [beneficiary, setBeneficiary] = useState<User | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!donationId || isNaN(allocationIndex)) {
            setError("Invalid donation or allocation details provided.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const fetchedDonation = await getDonation(donationId);
                if (!fetchedDonation) {
                    notFound();
                    return;
                }
                setDonation(fetchedDonation);

                const allocation = fetchedDonation.allocations?.[allocationIndex];
                if (!allocation) {
                    setError("This allocation could not be found.");
                    setLoading(false);
                    return;
                }

                const [fetchedLead, fetchedLogs] = await Promise.all([
                    getLead(allocation.leadId),
                    getDonationActivity(fetchedDonation.id!)
                ]);
                
                if(!fetchedLead) {
                    setError("The lead linked to this allocation could not be found.");
                    setLead(null);
                } else {
                     setLead(fetchedLead);
                     const fetchedBeneficiary = await getUser(fetchedLead.beneficiaryId);
                     setBeneficiary(fetchedBeneficiary);
                }
                setActivityLogs(fetchedLogs);
                
            } catch (e) {
                console.error(e);
                setError("Failed to load allocation details.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [donationId, allocationIndex]);


    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (error || !donation) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || "Allocation not found."}</AlertDescription>
            </Alert>
        );
    }
    
    const allocation = donation.allocations?.[allocationIndex];
    if (!allocation) {
         return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Allocation index is out of bounds.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <Link href={`/admin/donations/${donationId}`} className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Parent Donation
            </Link>

            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
                Allocation Details
            </h2>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Allocation #{allocationIndex + 1}</CardTitle>
                    <CardDescription>
                        A portion of <span className="font-semibold">₹{donation.amount.toLocaleString()}</span> from {donation.donorName} was allocated to this case.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Allocated Amount</span>
                            <span className="font-semibold text-lg text-primary">₹{allocation.amount.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Allocated By</span>
                            <span className="font-semibold">{allocation.allocatedByUserName}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Allocation Date</span>
                            <span className="font-semibold">{format(allocation.allocatedAt as Date, 'PPP p')}</span>
                        </div>
                    </div>
                     <div className="space-y-3">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Parent Donation ID</span>
                             <Link href={`/admin/donations/${donation.id}`} className="font-mono text-xs hover:underline text-primary">
                                {donation.id}
                            </Link>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Parent Donation Status</span>
                            <Badge variant="outline">{donation.status}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText />
                            Linked Lead
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lead ? (
                             <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lead Name</span>
                                    <span className="font-semibold">{lead.name}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lead Purpose</span>
                                    <span className="font-semibold">{lead.purpose}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount Requested</span>
                                    <span className="font-semibold">₹{lead.helpRequested.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lead Status</span>
                                    <Badge variant="outline">{lead.status}</Badge>
                                </div>
                                 <div className="pt-2">
                                     <Button asChild className="w-full">
                                        <Link href={`/admin/leads/${lead.id}`}>View Full Lead Details</Link>
                                    </Button>
                                 </div>
                             </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">Lead information could not be loaded.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <UserIcon />
                           Beneficiary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {beneficiary ? (
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name</span>
                                    <span className="font-semibold">{beneficiary.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phone</span>
                                    <span className="font-semibold">{beneficiary.phone}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Member Since</span>
                                    <span className="font-semibold">{format(beneficiary.createdAt, 'dd MMM yyyy')}</span>
                                </div>
                                 <div className="pt-2">
                                     <Button asChild className="w-full" variant="secondary">
                                        <Link href={`/admin/user-management/${beneficiary.id}/edit`}>View Full Profile</Link>
                                    </Button>
                                 </div>
                            </div>
                        ) : (
                             <p className="text-muted-foreground text-center py-4">Beneficiary information could not be loaded.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <AuditTrail activityLogs={activityLogs} />
        </div>
    );
}
