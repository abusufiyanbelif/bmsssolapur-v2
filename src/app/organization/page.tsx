

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization } from "@/services/organization-service";
import { Building, Mail, Phone, Globe, Hash, MapPin, ShieldCheck, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

export default async function OrganizationPage() {
    let organization;
    let error = null;

    try {
        organization = await getCurrentOrganization();
    } catch(e) {
        error = e instanceof Error ? e.message : "An unknown error occurred while fetching organization details.";
        console.error(e);
    }
    
    if (error) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                       {error}
                       <p className="text-xs mt-2">This is likely due to a missing or invalid Firebase configuration. Please ensure your environment variables are set correctly.</p>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!organization) {
        return (
             <div className="flex-1 space-y-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Organization Found</AlertTitle>
                    <AlertDescription>
                        No organization details have been configured in the database yet. This could also be due to missing Firebase credentials.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const details = [
        { icon: Building, label: "Organization Name", value: organization.name },
        { icon: MapPin, label: "Address", value: `${organization.address}, ${organization.city}` },
        { icon: Hash, label: "Registration No.", value: organization.registrationNumber },
        { icon: Mail, label: "Contact Email", value: organization.contactEmail },
        { icon: Phone, label: "Contact Phone", value: organization.contactPhone },
        { icon: CreditCard, label: "UPI ID", value: organization.upiId || "Not Available" },
        { icon: Globe, label: "Website", value: organization.website || "Not Available" },
        { icon: ShieldCheck, label: "PAN Number", value: organization.panNumber || "Not Available" },
        { icon: ShieldCheck, label: "Aadhaar Number", value: organization.aadhaarNumber || "Not Available" },
    ];
    
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">About Our Organization</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Verifiable Details</CardTitle>
                    <CardDescription>
                        Transparency is important to us. Here are the official details of our organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            {details.map(item => (
                                <div key={item.label} className="flex items-start gap-4">
                                    <item.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">{item.label}</p>
                                        <p className="text-muted-foreground">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {organization.qrCodeUrl && (
                             <div className="flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-muted/50">
                                <h3 className="font-semibold text-center">Scan to Pay with UPI</h3>
                                <div className="relative w-56 h-56">
                                     <Image src={organization.qrCodeUrl} alt="UPI QR Code" fill className="object-contain rounded-md" />
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    You can use any UPI app like Google Pay, PhonePe, or Paytm to donate directly.
                                </p>
                             </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
