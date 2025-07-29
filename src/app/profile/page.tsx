
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  // Placeholder user data
  const user = {
    name: "Aisha Khan",
    email: "aisha.khan@example.com",
    avatar: "https://placehold.co/100x100.png",
    initials: "AK",
  };

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
                </CardHeader>
                <CardContent>
                    <Button className="w-full">Edit Profile</Button>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
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
                     <Button>Save Changes</Button>
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
                        <Switch id="monthly-reminder" />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
