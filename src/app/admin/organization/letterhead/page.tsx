
import { getCurrentOrganization } from "@/services/organization-service";
import { notFound } from "next/navigation";
import { LetterheadDocument } from "./letterhead-document";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function LetterheadPage() {
    const organization = await getCurrentOrganization();

    if (!organization) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Organization Found</AlertTitle>
                    <AlertDescription>
                        Organization details must be configured before a letterhead can be generated.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <LetterheadDocument organization={organization} />;
}
