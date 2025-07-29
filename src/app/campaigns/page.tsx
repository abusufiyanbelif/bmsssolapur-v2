
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOpenLeads } from "./actions";
import { CampaignList } from "./campaign-list";
import { getCurrentOrganization } from "@/services/organization-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Copy } from "lucide-react";

export default async function CampaignsPage() {
    const leads = await getOpenLeads();
    const organization = await getCurrentOrganization();
    
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Approved Campaigns</h2>

            {organization?.upiId && (
                <Alert>
                    <CreditCard className="h-4 w-4" />
                    <AlertTitle>Donate via UPI</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                       <span>You can donate directly to our organization's UPI ID: <strong className="font-mono">{organization.upiId}</strong></span>
                       {/* This would need client-side JS to actually copy to clipboard */}
                       {/* <Button variant="ghost" size="sm"><Copy className="mr-2 h-4 w-4" /> Copy</Button> */}
                    </AlertDescription>
                </Alert>
            )}

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
