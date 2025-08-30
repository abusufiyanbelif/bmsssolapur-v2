

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings } from "@/services/app-settings-service";
import { DashboardSettingsForm } from "./dashboard-settings-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function DashboardSettingsPage() {
    const settings = await getAppSettings();

    if (!settings) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Could not load application settings.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Card Visibility</CardTitle>
                    <CardDescription>
                       Click &quot;Edit Settings&quot; to configure which cards are visible on each user role&apos;s dashboard. Use the filter to check visibility for a specific role.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <DashboardSettingsForm settings={settings.dashboard} />
                </CardContent>
            </Card>
        </div>
    );
}
