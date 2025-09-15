
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLeadForm } from "./add-lead-form";
import { getAllUsers } from "@/services/user-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { getAppSettings } from "@/services/app-settings-service";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default async function AddLeadPage() {
    try {
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
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        // This is a special case to handle the page crashing due to IAM permission issues.
        // We will render the form but show an error.
        const isPermissionError = error.includes("Permission Denied");

        return (
             <div className="flex-1 space-y-4">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New Lead</h2>
                {isPermissionError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning: Could Not Load App Settings</AlertTitle>
                        <AlertDescription>
                            The form is available, but some settings (like Lead Purposes) may not be loaded. This is likely due to a database permission issue. Please see the troubleshooting guide.
                            <p className="mt-2 text-xs font-mono bg-destructive/20 p-2 rounded">Details: {error}</p>
                        </AlertDescription>
                    </Alert>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle>Lead Details</CardTitle>
                        <CardDescription>
                            Fill in the form below to create a new help case (lead).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddLeadForm 
                            users={[]} 
                            campaigns={[]} 
                            settings={{} as any}
                        />
                    </CardContent>
                </Card>
            </div>
        )
    }
}
