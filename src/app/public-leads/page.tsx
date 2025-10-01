

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getOpenGeneralLeads, EnrichedLead } from "@/app/home/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Copy, Loader2, AlertCircle, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Organization, User } from "@/services/types";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { HandHeart } from 'lucide-react';
import { getCurrentOrganization } from "@/services/organization-service";
import Link from "next/link";

interface PublicLeadsListProps {
    leads: EnrichedLead[];
}

function PublicLeadsList({ leads }: PublicLeadsListProps) {
    const router = useRouter();
    
    const handleDonateClick = (leadId: string) => {
        router.push(`/donate?leadId=${leadId}`);
    }

    const handleShare = (lead: EnrichedLead) => {
        const leadUrl = `${window.location.origin}/donate?leadId=${lead.id}`;
        const displayName = lead.beneficiary?.isAnonymousAsBeneficiary ? `an Anonymous Beneficiary` : lead.name;
        const message = `*Help Needed for ${displayName}*\n\nThis case requires assistance for *${lead.purpose} (${lead.category})*.\n\n*Amount Required:* ₹${lead.helpRequested.toLocaleString()}\n\nYour contribution can make a significant difference. Please donate and share this message.\n\nView more and donate here:\n${leadUrl}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (leads.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/50 rounded-lg">
                <HandHeart className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-semibold mt-4">All General Cases Are Funded!</h3>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                    Your generosity is making a real difference. Check back later for new general cases that need your support, or view our official Campaigns.
                </p>
                 <Button className="mt-6" onClick={() => {
                    sessionStorage.setItem('redirectAfterLogin', '/donate');
                    router.push('/login');
                 }}>
                    Donate to Organization
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => {
                const progress = lead.helpRequested > 0 ? (lead.helpGiven / lead.helpRequested) * 100 : 100;
                const remainingAmount = lead.helpRequested - lead.helpGiven;
                const displayName = lead.beneficiary?.isAnonymousAsBeneficiary 
                    ? lead.beneficiary?.anonymousBeneficiaryId || "Anonymous Beneficiary"
                    : lead.name;

                return (
                    <Card key={lead.id} id={lead.id} className="flex flex-col">
                        <CardHeader>
                             <div className="flex justify-between items-start gap-4">
                                <CardTitle>{displayName}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => handleShare(lead)}>
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </div>
                            <CardDescription>
                                Seeking help for: <span className="font-semibold">{lead.purpose} {lead.category ? `(${lead.category})` : ''}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground line-clamp-3">{lead.caseDetails || "No details provided."}</p>
                            <Progress value={progress} className="my-2" />
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold">Raised: ₹{lead.helpGiven.toLocaleString()}</span>
                                <span className="text-muted-foreground">Goal: ₹{lead.helpRequested.toLocaleString()}</span>
                            </div>
                        </CardContent>
                        <CardFooter className='flex-col items-start gap-4'>
                            {remainingAmount > 0 && 
                                <p className="text-primary font-bold text-center w-full">
                                    ₹{remainingAmount.toLocaleString()} still needed
                                </p>
                            }
                            <Button onClick={() => handleDonateClick(lead.id!)} className="w-full">
                                Donate Now
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}


export default function PublicLeadsPage() {
    const [leads, setLeads] = useState<EnrichedLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const fetchedLeads = await getOpenGeneralLeads();
                if (fetchedLeads) {
                    setLeads(fetchedLeads);
                } else {
                    setError("The list of general cases could not be retrieved from the server.");
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "An unknown server error occurred.";
                setError(`Failed to load general cases: ${errorMessage}`);
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    
    return (
        <div className="flex-1 space-y-4">
            <h2 id="page-header" className="text-3xl font-bold tracking-tight font-headline text-primary scroll-mt-20">General Help Cases</h2>

            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Support an Individual or Family</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        These are verified general help requests that are not part of a specific campaign. Your donation can make a direct impact.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Loading cases...</p>
                        </div>
                    ) : error ? (
                         <Alert variant="destructive" className="my-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error Loading Cases</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <PublicLeadsList leads={leads} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
