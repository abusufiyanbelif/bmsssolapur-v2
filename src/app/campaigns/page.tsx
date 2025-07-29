
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOpenLeads } from "./actions";
import { CampaignList } from "./campaign-list";

export default async function CampaignsPage() {
    const leads = await getOpenLeads();
    
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Approved Campaigns</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Help a Cause</CardTitle>
                    <CardDescription>
                        Browse through the verified cases that are currently seeking support. Your donation can make a difference.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CampaignList initialLeads={leads} />
                </CardContent>
            </Card>
        </div>
    );
}
