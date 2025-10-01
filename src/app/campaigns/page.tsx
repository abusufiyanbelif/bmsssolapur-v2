

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllPublicCampaigns } from "./actions";
import { CampaignList } from "./campaign-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { Suspense } from "react";

async function CampaignsData() {
    try {
        const campaigns = await getAllPublicCampaigns();
        return <CampaignList campaigns={campaigns} />;
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown server error occurred.";
        return (
            <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Campaigns</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
}


export default function CampaignsPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 id="page-header" className="text-3xl font-bold tracking-tight font-headline text-primary scroll-mt-20">Fundraising Campaigns</h2>

            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Our Campaigns</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Browse through our focused fundraising campaigns. Your donation can help us achieve these specific goals.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Loading campaigns...</p>
                        </div>
                    }>
                        <CampaignsData />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
