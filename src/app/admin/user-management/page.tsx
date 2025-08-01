// src/app/admin/user-management/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { getAllUsers, type User, UserRole } from "@/services/user-service";
import { format } from "date-fns";
import { Loader2, AlertCircle, PlusCircle, UserCog } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserCategory = 'all' | 'admins' | 'donors' | 'beneficiaries';

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<UserCategory>('all');
    const { toast } = useToast();
    const isMobile = useIsMobile();

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
    
    const filteredUsers = useMemo(() => {
        switch(activeTab) {
            case 'admins':
                return users.filter(u => u.roles.some(r => ['Admin', 'Super Admin', 'Finance Admin'].includes(r)));
            case 'donors':
                return users.filter(u => u.roles.includes('Donor'));
            case 'beneficiaries':
                 return users.filter(u => u.roles.includes('Beneficiary'));
            case 'all':
            default:
                return users;
        }
    }, [users, activeTab]);

    const renderDesktopTable = (userList: User[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {userList.map((user) => (
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
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(user.createdAt.toDate(), "dd MMM yyyy")}</TableCell>
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

    const renderMobileCards = (userList: User[]) => (
        <div className="space-y-4">
            {userList.map(user => (
                <Card key={user.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{user.name}</CardTitle>
                            <Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <CardDescription>{user.phone} &middot; {user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold mb-2">Roles</h4>
                             <div className="flex flex-wrap gap-1">
                                {user.roles?.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                             <span>Joined On</span>
                             <span>{format(user.createdAt.toDate(), "dd MMM yyyy")}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={handleFeatureInProgress}>
                            <UserCog className="mr-2 h-3 w-3" /> Manage User
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

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
                     <Button asChild className="mt-4">
                        <Link href="/admin/user-management/add">
                           <PlusCircle className="mr-2" />
                           Add First User
                        </Link>
                    </Button>
                </div>
            )
        }
        
        if (filteredUsers.length === 0) {
             return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No users found in this category.</p>
                </div>
            );
        }

        return isMobile ? renderMobileCards(filteredUsers) : renderDesktopTable(filteredUsers);
    }

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">User Management</h2>
            <Button asChild>
                <Link href="/admin/user-management/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add User
                </Link>
            </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserCategory)}>
            <TabsList>
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
                <TabsTrigger value="donors">Donors</TabsTrigger>
                <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
                 <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>
                            A comprehensive list of every user in the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderContent()}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="admins">
                 <Card>
                    <CardHeader>
                        <CardTitle>Administrators</CardTitle>
                        <CardDescription>
                           Users with administrative privileges (Super Admin, Admin, Finance Admin).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderContent()}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="donors">
                 <Card>
                    <CardHeader>
                        <CardTitle>Donors</CardTitle>
                        <CardDescription>
                            Users who have the Donor role and can make contributions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderContent()}
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="beneficiaries">
                 <Card>
                    <CardHeader>
                        <CardTitle>Beneficiaries</CardTitle>
                        <CardDescription>
                            Users who are eligible to receive aid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderContent()}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
