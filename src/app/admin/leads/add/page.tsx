

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLeadForm } from "./add-lead-form";
import { getAllUsers } from "@/services/user-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { getAppSettings } from "@/services/app-settings-service";

export default async function AddLeadPage() {
    const [users, campaigns, settings] = await Promise.all([
        getAllUsers(),
        getAllCampaigns(),
        getAppSettings(),
    ]);
    
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New Lead</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Lead Details</CardTitle>
                    <CardDescription>
                        Fill in the form below to create a new help case (lead). You can also upload documents and use the AI to auto-fill the form.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddLeadForm 
                        users={users} 
                        campaigns={campaigns} 
                        settings={settings}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
