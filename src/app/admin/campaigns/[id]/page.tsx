
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaign } from "@/services/campaign-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CampaignDetailsPage({ params }: { params: { id: string } }) {
    const campaign = await getCampaign(params.id);

    if (!campaign) {
        notFound();
    }
    
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
                       This is a placeholder for the full campaign details view.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <pre className="p-4 bg-muted rounded-lg text-sm">
                        {JSON.stringify(campaign, null, 2)}
                   </pre>
                </CardContent>
            </Card>
        </div>
    );
}
