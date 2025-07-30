

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "./activity-feed";
import { getUser, User } from '@/services/user-service';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
        setUserId(storedUserId);
    } else {
        setError("You must be logged in to view your profile.");
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const fetchedUser = await getUser(userId);
        if (fetchedUser) {
          setUser(fetchedUser);
        } else {
          setError("User not found.");
        }
      } catch (e) {
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleFeatureInProgress = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    toast({
        title: "In Progress",
        description: "This feature is currently in development and will be available soon.",
    });
  };

  const handleSwitchChange = () => {
    handleFeatureInProgress();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error || !user) {
    return (
       <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Could not load user profile."}</AlertDescription>
        </Alert>
    );
  }

  const isAdmin = user.roles.includes("Admin") || user.roles.includes("Super Admin");
  const userInitials = user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline">User Profile</h2>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={`https://placehold.co/100x100.png?text=${userInitials}`} alt={user.name} data-ai-hint="female portrait" />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                    <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? "bg-green-500/20 text-green-700" : ""}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                     <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {user.roles.map(role => (
                            <Badge key={role} variant="secondary">{role}</Badge>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={handleFeatureInProgress}>Edit Profile</Button>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
           <Tabs defaultValue="account">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="account">Account Settings</TabsTrigger>
                    <TabsTrigger value="history">Activity History</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Settings</CardTitle>
                            <CardDescription>Update your account details and preferences. Editing is currently disabled.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" defaultValue={user.name} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" defaultValue={user.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Primary Phone</Label>
                                    <Input id="phone" defaultValue={user.phone} disabled />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Input id="gender" defaultValue={user.gender || 'Not set'} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pan">PAN Number</Label>
                                    <Input id="pan" defaultValue={user.panNumber || 'Not set'} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="aadhaar">Aadhaar Number</Label>
                                    <Input id="aadhaar" defaultValue={user.aadhaarNumber || 'Not set'} disabled />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" defaultValue={user.address || 'Not set'} disabled />
                            </div>
                            <Button onClick={handleFeatureInProgress} disabled>Save Changes</Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <CardDescription>Manage how you receive notifications from us.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label htmlFor="monthly-reminder" className="font-semibold">Monthly Donation Reminder</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive a gentle reminder on the 1st of every month.
                                    </p>
                                </div>
                                <Switch id="monthly-reminder" onCheckedChange={handleSwitchChange} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                     <Card>
                        <CardHeader>
                            <CardTitle>Activity History</CardTitle>
                            <CardDescription>A log of actions you have performed in the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ActivityFeed userId={user.id!} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
