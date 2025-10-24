
// src/app/admin/organization-profile/page.tsx
import { getCurrentOrganization } from "@/services/organization-service";
import { EditOrganizationForm } from "./edit-organization-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function OrganizationSettingsPage() {
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
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Profile</h2>
            {isCreating && (
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Organization Profile Found</AlertTitle>
                    <AlertDescription>
                        Please fill out the form below to create your organization's public profile.
                    </AlertDescription>
                </Alert>
            )}
            <EditOrganizationForm organization={JSON.parse(JSON.stringify(orgData))} isCreating={isCreating} />
        </div>
    );
}
