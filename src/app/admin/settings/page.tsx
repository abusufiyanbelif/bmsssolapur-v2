

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings } from "./actions";
import { AppSettingsForm } from "./app-settings-form";

export default async function AppSettingsPage() {
    const settings = await getAppSettings();

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">App Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Application Configuration</CardTitle>
                    <CardDescription>
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

    
