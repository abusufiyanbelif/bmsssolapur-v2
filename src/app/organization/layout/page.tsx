

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Palette } from "lucide-react";
import { LayoutSettingsForm } from "@/app/admin/organization/layout/layout-settings-form";
import type { Organization, OrganizationFooter } from "@/services/types";

const defaultFooter: OrganizationFooter = {
    organizationInfo: { titleLine1: 'Baitul Mal (System Default)', titleLine2: 'Samajik Sanstha (System Default)', titleLine3: '(Solapur)', description: 'Default description text. Please seed or create an organization profile to update this.', registrationInfo: 'Reg. No. (System Default)', taxInfo: 'PAN: (System Default)' },
    contactUs: { title: 'Contact Us (System Default)', address: 'Default Address, Solapur', email: 'contact@example.com' },
    keyContacts: { title: 'Key Contacts', contacts: [{name: 'Default Contact', phone: '0000000000'}] },
    connectWithUs: { title: 'Connect With Us (System Default)', socialLinks: [] },
    ourCommitment: { title: 'Our Commitment (System Default)', text: 'Default commitment text. Please update this in the layout settings.', linkText: 'Learn More', linkUrl: '#' },
    copyright: { text: `© ${new Date().getFullYear()} Organization Name. All Rights Reserved. (System Default)` }
};

const defaultOrganization: Organization = {
    id: "new_org_placeholder",
    name: "New Organization",
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/organization%2Fassets%2Flogo%2FIMG-20250816-WA0000.jpg?alt=media&token=49c54b33-286c-481d-bd33-1a16e8db22c5",
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

    
