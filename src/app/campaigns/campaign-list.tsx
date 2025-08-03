
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getUser } from '@/services/user-service';
import type { Lead, User } from '@/services/types';

interface CampaignListProps {
    initialLeads: Lead[];
}

interface EnrichedLead extends Lead {
    beneficiary?: User;
}

export function CampaignList({ initialLeads }: CampaignListProps) {
    const [leads, setLeads] = useState<EnrichedLead[]>(initialLeads);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function enrichLeads() {
            try {
                const enriched = await Promise.all(initialLeads.map(async (lead) => {
                    const beneficiary = await getUser(lead.beneficiaryId);
                    return { ...lead, beneficiary };
                }));
                setLeads(enriched as EnrichedLead[]);
            } catch (e) {
                setError("Failed to load beneficiary details for cases.");
            } finally {
                setLoading(false);
            }
        }
        enrichLeads();
    }, [initialLeads]);


    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading cases...</p>
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

    if (leads.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/50 rounded-lg">
                <h3 className="text-xl font-semibold">All Cases Fully Funded!</h3>
                <p className="text-muted-foreground mt-2">
                    Thank you for your generosity. There are no open cases at the moment.
                </p>
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
                                Seeking help for: <span className="font-semibold">{lead.category}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground mb-4">{lead.caseDetails || "No details provided."}</p>
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
                            <Button asChild className="w-full">
                                <Link href="/login">
                                    Donate Now
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
