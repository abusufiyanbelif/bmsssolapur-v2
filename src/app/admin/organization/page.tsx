
// src/app/admin/organization/page.tsx
import { getCurrentOrganization } from "@/services/organization-service";
import { OrganizationProfileClient } from "./organization-profile-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

async function OrganizationPageDataLoader() {
    let organization;
    let error = null;

    try {
        organization = await getCurrentOrganization();
    } catch (e) {
        // Catch the error but allow the page to render with a warning.
        error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error(e);
    }
    
    if (error) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    // Determine if we are creating a new org.
    // This is true if the fetched organization is null.
    const isCreating = !organization;
    
    // The service now provides a reliable default, so we pass it if org is null
    const orgData = organization;

    return (
        <OrganizationProfileClient 
            organization={JSON.parse(JSON.stringify(orgData))} 
            isCreating={isCreating} 
        />
    )
}


export default function OrganizationSettingsPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Profile</h2>
            <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <OrganizationPageDataLoader />
            </Suspense>
        </div>
    );
}
