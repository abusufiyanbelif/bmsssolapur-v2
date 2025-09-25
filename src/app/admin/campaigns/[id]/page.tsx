

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaign } from "@/services/campaign-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default async function CampaignDetailsPage({ params }: { params: { id: string } }) {
    const campaign = await getCampaign(params.id);

    if (!campaign) {
        notFound();
    }
    
    const progress = campaign.goal > 0 && campaign.collectedAmount ? (campaign.collectedAmount / campaign.goal) * 100 : 0;

    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/campaigns" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Campaigns
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details: {campaign.name}</CardTitle>
                    <CardDescription>
                       An overview of the &quot;{campaign.name}&quot; campaign.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="font-semibold">Funding Progress</h3>
                         <Progress value={progress} className="w-full" />
                         <div className="flex justify-between text-sm text-muted-foreground">
                            <span>
                                <span className="font-bold text-foreground">₹{(campaign.collectedAmount || 0).toLocaleString()}</span> collected
                            </span>
                             <span>
                                Goal: <span className="font-bold text-foreground">₹{campaign.goal.toLocaleString()}</span>
                            </span>
                         </div>
                    </div>
                   <div className="space-y-2">
                        <h3 className="font-semibold">Raw Data</h3>
                        <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                            {JSON.stringify(campaign, (key, value) => {
                                // Exclude bulky fields from the default JSON view
                                if (key === 'description' || key === 'acceptableDonationTypes' || key === 'linkedCompletedCampaignIds') {
                                    return undefined;
                                }
                                return value;
                            }, 2)}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
