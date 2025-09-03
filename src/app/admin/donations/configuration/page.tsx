
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, AlertCircle } from "lucide-react";
import { getAppSettings } from "@/services/app-settings-service";
import { DonationConfigForm } from "./donation-config-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default async function DonationConfigurationPage() {
    const settings = await getAppSettings();

    if (!settings) {
        return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Page</AlertTitle>
                    <AlertDescription>Could not load application settings from the database.</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Donation Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings />
                        Donation Settings
                    </CardTitle>
                    <CardDescription>
                        Configure settings related to donation types, purposes, and verification workflows.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DonationConfigForm settings={settings.donationConfiguration} />
                </CardContent>
            </Card>
        </div>
    );
}
