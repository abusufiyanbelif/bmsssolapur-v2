

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOpenGeneralLeads, EnrichedLead } from "@/app/campaigns/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Copy, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Organization, User } from "@/services/types";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { HandHeart } from 'lucide-react';
import { getCurrentOrganization } from "@/services/organization-service";

interface PublicLeadsListProps {
    leads: EnrichedLead[];
    organization: Organization | null;
}

function PublicLeadsList({ leads, organization }: PublicLeadsListProps) {
    const router = useRouter();
    
    const handleDonateClick = () => {
        sessionStorage.setItem('redirectAfterLogin', '/public-leads');
        router.push('/login');
    }

    if (leads.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/50 rounded-lg">
                <HandHeart className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-semibold mt-4">All General Cases Are Funded!</h3>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                    Your generosity is making a real difference. Check back later for new general cases that need your support, or view our official Campaigns.
                </p>
                 <Button className="mt-6" asChild>
                    <a href="/campaigns">View Campaigns</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => {
                const progress = lead.helpRequested > 0 ? (lead.helpGiven / lead.helpRequested) * 100 : 100;
                const remainingAmount = lead.helpRequested - lead.helpGiven;
                const displayName = lead.beneficiary?.isAnonymous 
                    ? lead.beneficiary?.anonymousId || "Anonymous Beneficiary"
                    : lead.name;

                return (
                    <Card key={lead.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{displayName}</CardTitle>
                            <CardDescription>
                                Seeking help for: <span className="font-semibold">{lead.purpose} {lead.category ? `(${lead.category})` : ''}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{lead.caseDetails || "No details provided."}</p>
                            <Progress value={progress} className="mb-2" />
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
                            <Button onClick={handleDonateClick} className="w-full">
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
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const [fetchedLeads, fetchedOrganization] = await Promise.all([
                    getOpenGeneralLeads(),
                    getCurrentOrganization()
                ]);
                setLeads(fetchedLeads);
                setOrganization(fetchedOrganization);
            } catch (e) {
                setError("Failed to load general cases. Please try again later.");
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
                    <CardTitle>Support an Individual or Family</CardTitle>
                    <CardDescription>
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
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <PublicLeadsList leads={leads} organization={organization} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
