import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddDonationForm } from "./add-donation-form";
import { getAllUsers } from "@/services/user-service";

export default async function AddDonationPage() {
    const users = await getAllUsers();
    
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New Donation</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Donation Details</CardTitle>
                    <CardDescription>
                        Fill in the form below to record a new donation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddDonationForm users={users} />
                </CardContent>
            </Card>
        </div>
    );
}
