
// src/app/organization/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Building, Mail, Phone, Globe, Hash, ShieldCheck, CreditCard, Award, Users, Banknote, MapPin, AlertCircle, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { User, Organization } from "@/services/types";
import { getAllUsers } from "@/services/user-service";
import { getCurrentOrganization } from "@/services/organization-service";
import { AdminEditButton } from "@/components/app-shell";
import { OrganizationView } from "./organization-view";

export default async function OrganizationPage() {
    let organization: Organization | null = null;
    let allUsers: User[] = [];
    let error = null;

    try {
        const [org, users] = await Promise.all([
            getCurrentOrganization(),
            getAllUsers(),
        ]);
        organization = org;
        allUsers = users;
    } catch(e) {
        error = e instanceof Error ? e.message : "An unknown error occurred while fetching organization details.";
        console.error(e);
    }

    if (error) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Page</AlertTitle>
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
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">About Our Organization</h2>
                     <AdminEditButton editPath="/admin/organization" />
                </div>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Organization Details Not Available</AlertTitle>
                    <AlertDescription>
                        The organization's profile has not been set up yet. An administrator needs to create it in the admin panel.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
    
    // Serialize data before passing to the client-side rendered component
    const safeOrganization = JSON.parse(JSON.stringify(organization));
    const safeUsers = JSON.parse(JSON.stringify(allUsers));
    
    return (
        <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">About Our Organization</h2>
                <AdminEditButton editPath="/admin/organization" />
            </div>
            <OrganizationView organization={safeOrganization} allUsers={safeUsers} />
        </div>
    );
}
