

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddDonationForm } from "./add-donation-form";
import { getAllUsers } from "@/services/user-service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AddDonationPage() {
    const users = await getAllUsers();
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/donations" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Donations
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>Add Donation Manually</CardTitle>
                    <CardDescription>
                        Fill in the form below to record a new donation. If you scanned a screenshot, some details may be pre-filled.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddDonationForm users={users} />
                </CardContent>
            </Card>
        </div>
    );
}
