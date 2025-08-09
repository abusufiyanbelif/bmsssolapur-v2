
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMemberForm } from "./add-member-form";
import { getAllUsers } from "@/services/user-service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AddBoardMemberPage() {
    const users = await getAllUsers();
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/board-management" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Board Management
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>Add Board Member</CardTitle>
                    <CardDescription>
                       Select a user and assign them a role on the board.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddMemberForm users={users} />
                </CardContent>
            </Card>
        </div>
    );
}
