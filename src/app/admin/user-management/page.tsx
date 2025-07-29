
// src/app/admin/user-management/page.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { getAllUsers, type User } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, UserCog } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleFeatureInProgress = () => {
        toast({
            title: "In Progress",
            description: "This feature is currently in development and will be available soon.",
        });
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const fetchedUsers = await getAllUsers();
                // Sort by name
                fetchedUsers.sort((a, b) => a.name.localeCompare(b.name));
                setUsers(fetchedUsers);
                setError(null);
            } catch (e) {
                setError("Failed to fetch users. Please try again later.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading users...</p>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        if (users.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No users found.</p>
                     <Button className="mt-4" onClick={handleFeatureInProgress}>
                           <PlusCircle className="mr-2" />
                           Add First User
                     </Button>
                </div>
            )
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Groups</TableHead>
                        <TableHead>Joined On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{user.phone}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {user.roles?.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                                </div>
                            </TableCell>
                             <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {user.groups?.length ? user.groups.map(group => <Badge key={group} variant="outline">{group}</Badge>) : 'N/A'}
                                </div>
                            </TableCell>
                            <TableCell>{format(user.createdAt, "dd MMM yyyy")}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={handleFeatureInProgress}>
                                    <UserCog className="mr-2 h-3 w-3" /> Manage
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">User Management</h2>
            <Button onClick={handleFeatureInProgress}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                    View and manage all users, their roles, and permissions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  )
}
