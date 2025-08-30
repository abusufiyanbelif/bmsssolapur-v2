

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings } from "@/services/app-settings-service";
import { AnalyticsDashboardSettingsForm } from "./analytics-dashboard-settings-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function DataAnalyticsConfigurationPage() {
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
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Analytics Dashboard Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Card Visibility</CardTitle>
                    <CardDescription>
                       Click &quot;Edit Settings&quot; to configure which analytics sections are visible on the dashboard for each admin role.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <AnalyticsDashboardSettingsForm settings={settings.analyticsDashboard} />
                </CardContent>
            </Card>
        </div>
    );
}
