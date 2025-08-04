
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "./campaign-form";

export default function AddCampaignPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New Campaign</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>
                        Fill in the form below to create a new fundraising campaign.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CampaignForm />
                </CardContent>
            </Card>
        </div>
    );
}
