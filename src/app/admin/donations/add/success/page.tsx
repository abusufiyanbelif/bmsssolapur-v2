
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, HandHeart, PlusCircle, ArrowLeft } from 'lucide-react';
import type { Donation } from '@/services/types';
import { getDonation } from '@/services/donation-service';
import { format } from 'date-fns';
import Link from 'next/link';

function SuccessPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const donationId = searchParams.get('id');
    const [donation, setDonation] = useState<Donation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!donationId) {
            setError("No donation ID provided.");
            setLoading(false);
            return;
        }

        const fetchDonation = async () => {
            try {
                const fetchedDonation = await getDonation(donationId);
                if (!fetchedDonation) {
                    setError("Could not find the donation record.");
                } else {
                    setDonation(fetchedDonation);
                }
            } catch (e) {
                setError("Failed to fetch donation details.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchDonation();
    }, [donationId]);
    
    return (
        <div className="flex-1 space-y-4 flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 text-green-700 rounded-full p-3 w-fit mb-4">
                        <CheckCircle className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-2xl">Donation Recorded!</CardTitle>
                    <CardDescription>
                        The donation record has been successfully created and is now pending verification.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <p className="text-destructive">{error}</p>
                    ) : donation ? (
                        <div className="text-left space-y-3 rounded-lg border bg-muted/50 p-4">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Donation ID</span>
                                <span className="font-mono text-xs">{donation.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Donor</span>
                                <span className="font-semibold">{donation.donorName}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-semibold">₹{donation.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date</span>
                                <span className="font-semibold">{format(donation.donationDate, "PPP")}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-semibold">{donation.status}</span>
                            </div>
                        </div>
                    ) : null}
                </CardContent>
                <CardFooter className="flex-col sm:flex-row gap-2">
                    <Button className="w-full" onClick={() => router.push('/admin/donations')}>
                        <ArrowLeft className="mr-2" /> Done
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => router.push('/admin/donations/add')}>
                        <PlusCircle className="mr-2" /> Add Another Donation
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function AddDonationSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessPageContent />
        </Suspense>
    );
}
