
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization } from "@/services/organization-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Palette } from "lucide-react";
import { LayoutSettingsForm } from "@/app/admin/organization/layout/layout-settings-form";
import type { Organization } from "@/services/types";

export default async function LayoutSettingsPage() {
    // This now directly uses the more robust service.
    const organization = await getCurrentOrganization();
    
    // If no org exists, the service now provides a reliable default.
    // The check for `!organization` might still be useful for showing a "first time setup" message.
    if (!organization) {
        return (
            <div className="flex-1 space-y-4">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Layout Configuration</h2>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Profile</AlertTitle>
                    <AlertDescription>
                        Could not load the organization profile from the database. Please ensure it has been created and the server has the correct permissions.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
     
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Layout Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Palette />
                        Header & Footer Configuration
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                       Manage the content displayed in the header and footer across the public-facing pages of the website.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LayoutSettingsForm organization={JSON.parse(JSON.stringify(organization))} />
                </CardContent>
            </Card>
        </div>
    );
}
