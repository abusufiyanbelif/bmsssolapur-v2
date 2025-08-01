import { getDonation } from "@/services/donation-service";
import { notFound } from "next/navigation";
import { EditDonationForm } from "./edit-donation-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function EditDonationPage({ params }: { params: { id: string } }) {
    const donation = await getDonation(params.id);

    if (!donation) {
        notFound();
    }
    
    // In a real app, this would come from a session provider.
    const adminUserId = "admin_user_placeholder_id";

    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/donations" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Donations
            </Link>
            
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Editing Donation</AlertTitle>
                <AlertDescription>
                   You are editing a donation record. Changes will be logged in the activity feed.
                </AlertDescription>
            </Alert>
            
            <EditDonationForm donation={donation} adminUserId={adminUserId} />
        </div>
    );
}
