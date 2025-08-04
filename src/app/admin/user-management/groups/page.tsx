
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Group } from "lucide-react";

export default function UserGroupsPage() {
  return (
    <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">User Groups</h2>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Group className="h-6 w-6 text-primary" />
                    Manage User Groups
                </CardTitle>
                <CardDescription>
                    Create groups to organize users, such as "Founders" or "Finance Team".
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-10">
                    <p className="text-muted-foreground">User Groups management is not yet implemented.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
