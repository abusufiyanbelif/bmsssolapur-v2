import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLeadForm } from "./add-lead-form";
import { getAllUsers } from "@/services/user-service";

export default async function AddLeadPage() {
    const users = await getAllUsers();
    
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Add New Lead</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Lead Details</CardTitle>
                    <CardDescription>
                        Fill in the form below to create a new help case (lead).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddLeadForm users={users} />
                </CardContent>
            </Card>
        </div>
    );
}
