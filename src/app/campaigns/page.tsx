
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOpenLeads } from "@/app/campaigns/actions";
import { CampaignList } from "./campaign-list";
import { getCurrentOrganization } from "@/services/organization-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Copy, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { EnrichedLead } from "./actions";
import type { Organization, User } from "@/services/types";
import { Button } from "@/components/ui/button";

interface CampaignsPageProps {
  user: User | null;
}

export default function CampaignsPage({ user }: CampaignsPageProps) {
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
                    getOpenLeads(),
                    getCurrentOrganization()
                ]);
                setLeads(fetchedLeads);
                setOrganization(fetchedOrganization);
            } catch (e) {
                setError("Failed to load campaign data. Please try again later.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    
    return (
        <div className="flex-1 space-y-4">
            <h2 id="page-header" className="text-3xl font-bold tracking-tight font-headline text-primary scroll-mt-20">Verified Cases for Donation</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Support an Individual Case</CardTitle>
                    <CardDescription>
                        Browse through the verified cases that are currently seeking support. Your donation can make a difference.
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
                        <CampaignList leads={leads} organization={organization} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
