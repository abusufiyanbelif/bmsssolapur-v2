

import { getUser } from "@/services/user-service";
import { notFound } from "next/navigation";
import { EditUserForm } from "./edit-user-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function EditUserPage({ params }: { params: { id: string } }) {
    // We get the user on the server
    const user = await getUser(params.id);

    if (!user) {
        notFound();
    }
    
    // CRITICAL FIX: Ensure the user object is plain and serializable
    // by stringifying and parsing it before passing to the Client Component.
    const plainUser = JSON.parse(JSON.stringify(user));

    return (
        <div className="flex-1 space-y-4">
            <Link href="/admin/user-management" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to User Management
            </Link>

             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Editing User Account</AlertTitle>
                <AlertDescription>
                   You are editing a user&apos;s record. Changes made here will affect their access and information across the app.
                </AlertDescription>
            </Alert>
            
            <EditUserForm user={plainUser} />
        </div>
    );
}

