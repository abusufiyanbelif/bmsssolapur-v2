import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Palette } from "lucide-react";
import { LayoutSettingsForm } from "./layout-settings-form";

export default async function LayoutSettingsPage() {
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
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Layout Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette />
                        Header & Footer Configuration
                    </CardTitle>
                    <CardDescription>
                       Manage the content displayed in the header and footer across the public-facing pages of the website.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LayoutSettingsForm organization={organization} />
                </CardContent>
            </Card>
        </div>
    );
}
