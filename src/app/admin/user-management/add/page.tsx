

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddUserForm } from "./add-user-form";
import { getAppSettings } from "@/services/app-settings-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function AddUserPage() {
    let settings;
    let error: string | null = null;

    try {
        settings = await getAppSettings();
    } catch (e) {
        error = e instanceof Error ? e.message : "An unknown error occurred while loading settings.";
        console.error(error);
        // Create a default settings object to allow the form to render
        settings = { 
            userConfiguration: {},
        } as any;
    }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New User</h2>
             {error && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning: Could Not Load App Settings</AlertTitle>
                    <AlertDescription>
                        The form is available, but some settings (like mandatory fields) may not be loaded due to a database permission error. Please refer to the troubleshooting guide to resolve the underlying issue.
                        <p className="mt-2 text-xs font-mono bg-destructive/20 p-2 rounded">Details: {error}</p>
                    </AlertDescription>
                </Alert>
             )}
            <Card>
                <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>
                        Fill in the form below to create a new user account. If you were redirected from a donation scan, some details may be pre-filled.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddUserForm settings={settings} />
                </CardContent>
            </Card>
        </div>
    );
}
