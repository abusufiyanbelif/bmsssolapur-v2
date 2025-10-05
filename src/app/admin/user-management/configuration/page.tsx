

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, AlertCircle } from "lucide-react";
import { getAppSettings } from "@/services/app-settings-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { handleUpdateUserConfiguration } from "./actions";
import { UserConfigForm } from "./user-config-form";

export default async function UserManagementConfigurationPage() {
    const settings = await getAppSettings();

    if (!settings) {
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
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">User Management Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <User className="h-6 w-6" />
                        User Settings
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Configure global settings related to user profiles and registration.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <UserConfigForm settings={settings.userConfiguration} />
                </CardContent>
            </Card>
        </div>
    );
}


    
