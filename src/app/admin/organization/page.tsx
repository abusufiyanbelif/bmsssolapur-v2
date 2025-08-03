

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization } from "@/services/organization-service";
import { EditOrganizationForm } from "./edit-organization-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function OrganizationSettingsPage() {
    const organization = await getCurrentOrganization();

    if (!organization) {
        return (
             <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Organization Found</AlertTitle>
                    <AlertDescription>
                        No organization details have been configured in the database. Please run the seeder or manually add an organization entry.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Profile</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Organization Details</CardTitle>
                    <CardDescription>
                        Update your organization's public information, contact details, and payment settings. These details will be visible on the public-facing pages.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <EditOrganizationForm organization={organization} />
                </CardContent>
            </Card>
        </div>
    );
}

    