

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddUserForm } from "./add-user-form";

export default async function AddUserPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Add New User</h2>
            <Card>
                <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>
                        Fill in the form below to create a new user account. If you were redirected from a donation scan, some details may be pre-filled.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddUserForm />
                </CardContent>
            </Card>
        </div>
    );
}
