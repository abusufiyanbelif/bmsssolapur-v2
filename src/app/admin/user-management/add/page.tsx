

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddUserForm } from "./add-user-form";
import { getAppSettings } from "@/services/app-settings-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function AddUserPageLoader() {
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

    if (error) {
         return (
             <div className="flex-1 space-y-4">
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning: Could Not Load App Settings</AlertTitle>
                    <AlertDescription>
                        The form is available, but some settings (like mandatory fields) may not be loaded due to a database permission error. Please refer to the troubleshooting guide to resolve the underlying issue.
                        <p className="mt-2 text-xs font-mono bg-destructive/20 p-2 rounded">Details: {error}</p>
                    </AlertDescription>
                </Alert>
                <Card>
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                        <CardDescription>
                            Fill in the form below to create a new user account. You can also scan an ID document to auto-fill the form.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddUserForm settings={settings} />
                    </CardContent>
                </Card>
            </div>
         )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>
                    Fill in the form below to create a new user account. You can also scan an ID document to auto-fill the form.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AddUserForm settings={settings} />
            </CardContent>
        </Card>
    )
}


export default function AddUserPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New User</h2>
            <Suspense fallback={<div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <AddUserPageLoader />
            </Suspense>
        </div>
    );
}
