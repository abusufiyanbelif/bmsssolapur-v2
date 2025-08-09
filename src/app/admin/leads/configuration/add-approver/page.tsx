
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddApproverForm } from "./add-approver-form";
import { getAllUsers } from "@/services/user-service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AddApproverPage() {
    const users = await getAllUsers();
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/leads/configuration" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lead Configuration
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>Add Lead Approver</CardTitle>
                    <CardDescription>
                       Select a user to add to the 'Lead Approver' group. Only users with an Admin role are shown.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddApproverForm users={users} />
                </CardContent>
            </Card>
        </div>
    );
}
