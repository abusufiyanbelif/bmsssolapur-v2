
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { notFound } from "next/navigation";
import { LetterheadDocument } from "@/app/admin/organization/letterhead/letterhead-document";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getImageAsBase64 } from "./actions";
import type { Organization, OrganizationFooter } from "@/services/types";

const defaultFooter: OrganizationFooter = {
    organizationInfo: { titleLine1: '', titleLine2: '', titleLine3: '', description: '', registrationInfo: '', taxInfo: '' },
    contactUs: { title: '', address: '', email: '' },
    keyContacts: { title: '', contacts: [] },
    connectWithUs: { title: '', socialLinks: [] },
    ourCommitment: { title: '', text: '', linkText: '', linkUrl: '' },
    copyright: { text: '' }
};

const defaultOrganization: Organization = {
    id: "new_org_placeholder",
    name: "New Organization",
    address: "",
    city: "",
    registrationNumber: "",
    contactEmail: "",
    contactPhone: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    footer: defaultFooter,
};


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
