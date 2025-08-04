
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function UserRolesPage() {
  return (
    <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">User Roles</h2>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    Manage User Roles
                </CardTitle>
                <CardDescription>
                    Define roles and assign a collection of privileges to them.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-10">
                    <p className="text-muted-foreground">User Roles management is not yet implemented.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
