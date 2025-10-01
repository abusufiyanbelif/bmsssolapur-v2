

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings } from "@/services/app-settings-service";
import { AppSettingsForm } from "./app-settings-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function AppSettingsPage() {
    const settings = await getAppSettings();

    if(!settings) {
        return (
             <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Settings</AlertTitle>
                    <AlertDescription>
                        Could not load application settings from the database.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">App Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Application Configuration</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Manage global settings for the application. Changes made here will affect all users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <AppSettingsForm settings={settings} />
                </CardContent>
            </Card>
        </div>
    );
}
