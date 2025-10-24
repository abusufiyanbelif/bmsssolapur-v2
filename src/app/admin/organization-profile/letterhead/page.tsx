
// src/app/admin/organization-profile/letterhead/page.tsx
import { getCurrentOrganization } from "@/services/organization-service";
import { LetterheadDocument } from "./letterhead-document";
import { getImageAsBase64 } from "./actions";
import type { Organization } from "@/services/types";
import { defaultOrganization } from "@/services/organization-service-client";


export default async function LetterheadPage() {
    let organization: Organization | null = null;
    try {
      organization = await getCurrentOrganization();
    } catch(e) {
      console.error("Failed to load organization for letterhead, using default.", e);
    }

    if (!organization) {
        organization = defaultOrganization;
    }

    const logoDataUri = await getImageAsBase64(organization.logoUrl);

    return (
        <LetterheadDocument organization={JSON.parse(JSON.stringify(organization))} logoDataUri={logoDataUri} />
    )
}
