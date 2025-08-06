

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCampaigns } from "./actions";
import { CampaignList } from "./campaign-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Campaign } from "@/services/types";

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const fetchedCampaigns = await getActiveCampaigns();
                setCampaigns(fetchedCampaigns);
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
            <h2 id="page-header" className="text-3xl font-bold tracking-tight font-headline text-primary scroll-mt-20">Fundraising Campaigns</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Our Special Campaigns</CardTitle>
                    <CardDescription>
                        Browse through our focused fundraising campaigns. Your donation can help us achieve these specific goals.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Loading campaigns...</p>
                        </div>
                    ) : error ? (
                         <Alert variant="destructive" className="my-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <CampaignList campaigns={campaigns} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
