

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOpenLeads } from "./actions";
import { CampaignList } from "./campaign-list";
import { getCurrentOrganization } from "@/services/organization-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Copy } from "lucide-react";
import Image from "next/image";

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
                    <AlertDescription className="flex flex-col md:flex-row items-center justify-between gap-4">
                       <span className="flex-grow">You can donate directly to our organization's UPI ID: <strong className="font-mono">{organization.upiId}</strong></span>
                       {organization.qrCodeUrl && (
                           <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                               <Image src={organization.qrCodeUrl} alt="UPI QR Code" width={40} height={40} />
                               <span className="text-xs text-muted-foreground">Scan to Pay</span>
                           </div>
                       )}
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
