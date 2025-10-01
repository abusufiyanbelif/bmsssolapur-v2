

import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { notFound } from "next/navigation";
import { LetterheadDocument } from "@/app/admin/organization/letterhead/letterhead-document";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getImageAsBase64 } from "./actions";


export default async function LetterheadPage() {
    const organization = await getCurrentOrganization();

    if (!organization) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Organization Found</AlertTitle>
                    <AlertDescription>
                        Organization details must be configured before a letterhead can be generated. Please set up the organization profile first.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    const logoDataUri = await getImageAsBase64(organization.logoUrl);

    return (
        <LetterheadDocument organization={organization} logoDataUri={logoDataUri} />
    )
}
