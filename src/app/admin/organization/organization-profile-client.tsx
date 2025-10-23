
// src/app/admin/organization/organization-profile-client.tsx
"use client";

import { EditOrganizationForm } from "./edit-organization-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Organization } from "@/services/types";

interface OrganizationProfileClientProps {
    organization: Organization | null;
    isCreating: boolean;
}

export function OrganizationProfileClient({ organization, isCreating }: OrganizationProfileClientProps) {
    if (isCreating) {
         return (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Organization Profile Found</AlertTitle>
                <AlertDescription>
                    Please fill out the form below to create your organization's public profile.
                </AlertDescription>
            </Alert>
         )
    }

    if (!organization) {
         return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Profile</AlertTitle>
                <AlertDescription>
                    Could not load the organization profile from the database. Please ensure it has been created and the server has the correct permissions.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <EditOrganizationForm organization={organization} isCreating={isCreating} />
    )
}

