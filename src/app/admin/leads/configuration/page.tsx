// src/app/admin/leads/configuration/page.tsx

import { getAppSettings } from "@/services/app-settings-service";
import { getAllUsers } from "@/services/user-service";
import { LeadConfigurationClient } from "./lead-config-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function LeadConfigDataLoader() {
    try {
        const [settings, users] = await Promise.all([
            getAppSettings(),
            getAllUsers(),
        ]);
        
        if (!settings || !users) {
             throw new Error("Failed to load necessary configuration or user data.");
        }

        return <LeadConfigurationClient settings={settings} allUsers={users} />;

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Page</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
}


export default function LeadConfigurationPage() {
    return (
        <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Lead Configuration</h2>
            <Suspense fallback={<div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <LeadConfigDataLoader />
            </Suspense>
        </div>
    );
}
