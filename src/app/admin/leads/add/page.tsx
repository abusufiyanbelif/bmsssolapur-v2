
// src/app/admin/leads/add/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLeadForm } from "./add-lead-form";
import { getAllUsers } from "@/services/user-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { getAppSettings } from "@/services/app-settings-service";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function AddLeadPageLoader() {
    try {
        const [settings, users, campaigns] = await Promise.all([
            getAppSettings(),
            getAllUsers(),
            getAllCampaigns(),
        ]);
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Lead Details</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Fill in the form below to create a new help case (lead). You can also upload documents and use the AI to auto-fill the form.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddLeadForm 
                        users={JSON.parse(JSON.stringify(users))} 
                        campaigns={JSON.parse(JSON.stringify(campaigns))} 
                        settings={JSON.parse(JSON.stringify(settings))}
                    />
                </CardContent>
            </Card>
        )
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred fetching initial data.";
        return (
             <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Form</AlertTitle>
                    <AlertDescription>
                        There was an issue loading required data like users or settings. Please check the server logs.
                        <p className="mt-2 text-xs font-mono bg-destructive/20 p-2 rounded">Details: {error}</p>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
}


export default function AddLeadPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New Lead</h2>
            <Suspense fallback={<div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <AddLeadPageLoader />
            </Suspense>
        </div>
    );
}

    