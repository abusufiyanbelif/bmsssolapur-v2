
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "./activity-feed";

export default function ProfilePage() {
  const { toast } = useToast();

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

  // Placeholder user data - in a real app, this would come from an auth context
  const user = {
    id: "user_placeholder_id_12345",
    name: "Aisha Khan",
    email: "aisha.khan@example.com",
    avatar: "https://placehold.co/100x100.png",
    initials: "AK",
    secondaryPhone: "9876543210",
    roles: ["Super Admin", "Donor"], // Example of multiple roles
  };

  const isAdmin = user.roles.includes("Admin") || user.roles.includes("Super Admin");

  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline">User Profile</h2>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="female portrait" />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
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
                            <CardDescription>Update your account details and preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" defaultValue={user.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" defaultValue={user.email} />
                            </div>
                            {isAdmin && (
                                <div className="space-y-2">
                                    <Label htmlFor="secondaryPhone">Secondary Phone (for Account Recovery)</Label>
                                    <Input id="secondaryPhone" defaultValue={user.secondaryPhone} />
                                </div>
                            )}
                            <Button onClick={handleFeatureInProgress}>Save Changes</Button>
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
                           <ActivityFeed userId={user.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
