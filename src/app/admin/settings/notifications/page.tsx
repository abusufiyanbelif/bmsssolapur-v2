

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings } from "@/services/app-settings-service";
import { NotificationSettingsForm } from "./notification-settings-form";
import { BellRing } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function NotificationSettingsPage() {
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
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Notification Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <BellRing />
                        Manage Notification Providers
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                       Configure credentials for external notification services like Twilio and Nodemailer. Disabled services will not send notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <NotificationSettingsForm settings={settings.notificationSettings} />
                </CardContent>
            </Card>
        </div>
    );
}


    