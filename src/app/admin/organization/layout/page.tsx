
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Palette } from "lucide-react";
import { LayoutSettingsForm } from "./layout-settings-form";
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
    id: "main_org",
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

export default async function LayoutSettingsPage() {
    let organization;
    try {
        organization = await getCurrentOrganization();
    } catch(e) {
        console.error("Could not fetch organization for layout page:", e);
    }
    
    // If no org exists, provide a default structure so the form can render for creation
    const orgData = organization || defaultOrganization;
     
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
                    <LayoutSettingsForm organization={JSON.parse(JSON.stringify(orgData))} />
                </CardContent>
            </Card>
        </div>
    );
}
