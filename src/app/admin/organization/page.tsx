

import { getCurrentOrganization } from "@/services/organization-service";
import { EditOrganizationForm } from "./edit-organization-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const defaultOrganization = {
    id: "main_org", // A default, predictable ID for creation
    name: "",
    logoUrl: "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/organization%2Fassets%2Flogo%2FIMG-20250816-WA0000.jpg?alt=media&token=49c54b33-286c-481d-bd33-1a16e8db22c5",
    address: "",
    city: "Solapur",
    registrationNumber: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    upiId: "",
    qrCodeUrl: "https://firebasestorage.googleapis.com/v0/b/baitul-mal-connect.appspot.com/o/app-assets%2Fupi-qr-code.png?alt=media&token=c1374b76-b568-450f-90de-3f191195a63c",
    footer: undefined, // Let the form handle default footer
    createdAt: new Date(),
    updatedAt: new Date(),
};


export default async function OrganizationSettingsPage() {
    let organization;
    let error = null;

    try {
        organization = await getCurrentOrganization();
    } catch (e) {
        // Catch the error but allow the page to render with a warning.
        error = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error(e);
    }

    if (error) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    // Determine if we are creating a new org.
    // This is true if the fetched organization is null.
    const isCreating = !organization;


    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Profile</h2>
            {isCreating && (
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Organization Profile Found</AlertTitle>
                    <AlertDescription>
                        Please fill out the form below to create your organization's public profile.
                    </AlertDescription>
                </Alert>
            )}
            <EditOrganizationForm organization={organization || defaultOrganization} isCreating={isCreating} />
        </div>
    );
}

    
