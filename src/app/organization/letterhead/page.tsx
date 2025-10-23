

import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { notFound } from "next/navigation";
import { LetterheadDocument } from "./letterhead-document";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getImageAsBase64 } from "./actions";
import type { Organization, OrganizationFooter } from "@/services/types";
import { DEFAULT_LOGO, defaultOrganization } from "@/services/organization-service-client";

export default async function LetterheadPage() {
    let organization = await getCurrentOrganization();

    if (!organization) {
        organization = defaultOrganization;
    }

    const logoDataUri = await getImageAsBase64(organization.logoUrl);

    return (
        <LetterheadDocument organization={JSON.parse(JSON.stringify(organization))} logoDataUri={logoDataUri} />
    )
}
