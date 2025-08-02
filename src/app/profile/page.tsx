
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2, AlertCircle, Edit, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { handleUpdateProfile } from './actions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits."),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']),
  occupation: z.string().optional(),
  familyMembers: z.coerce.number().optional(),
  isWidow: z.boolean().default(false),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
        setUserId(storedUserId);
    } else {
        setError("You must be logged in to view your profile.");
        setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const fetchedUser = await getUser(userId);
        if (fetchedUser) {
          setUser(fetchedUser);
          form.reset({
              name: fetchedUser.name,
              phone: fetchedUser.phone,
              addressLine1: fetchedUser.address?.addressLine1 || '',
              city: fetchedUser.address?.city || '',
              pincode: fetchedUser.address?.pincode || '',
              gender: fetchedUser.gender || 'Other',
              occupation: fetchedUser.occupation || '',
              familyMembers: fetchedUser.familyMembers || 0,
              isWidow: fetchedUser.isWidow || false,
              panNumber: fetchedUser.panNumber || '',
              aadhaarNumber: fetchedUser.aadhaarNumber || '',
          });
        } else {
          setError("User not found.");
        }
      } catch (e) {
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };
    
  useEffect(() => {
    fetchUser();
  }, [userId]);


  async function onSubmit(values: ProfileFormValues) {
      if (!user?.id) return;
      setIsSubmitting(true);
      const result = await handleUpdateProfile(user.id, {
          name: values.name,
          phone: values.phone,
          address: {
              addressLine1: values.addressLine1 || '',
              city: values.city || '',
              pincode: values.pincode || '',
          },
          gender: values.gender,
          occupation: values.occupation,
          familyMembers: values.familyMembers || 0,
          isWidow: values.isWidow,
          panNumber: values.panNumber,
          aadhaarNumber: values.aadhaarNumber,
      });
      
      if (result.success) {
          toast({ variant: "success", title: "Profile Updated", description: "Your changes have been saved." });
          await fetchUser(); // Re-fetch user data to show the latest info
          setIsEditing(false);
      } else {
          toast({ variant: "destructive", title: "Update Failed", description: result.error });
      }

      setIsSubmitting(false);
  }

  const handleFeatureInProgress = () => {
    toast({
        title: "In Progress",
        description: "This feature is currently in development and will be available soon.",
    });
  };

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
                    <Badge variant="outline" className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                     <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {user.roles.map(role => (
                            <Badge key={role} variant="secondary">{role}</Badge>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'secondary' : 'default'}>
                        {isEditing ? <><X className="mr-2 h-4 w-4" /> Cancel Edit</> : <><Edit className="mr-2 h-4 w-4" /> Edit Profile</>}
                    </Button>
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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Settings</CardTitle>
                                    <CardDescription>{isEditing ? "Update your account details below." : "View your account details."}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="gender"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel>Gender</FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex flex-row space-x-4 pt-2"
                                                        disabled={!isEditing}
                                                        >
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                            <RadioGroupItem value="Male" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Male</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                            <RadioGroupItem value="Female" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Female</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                            <RadioGroupItem value="Other" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">Other</FormLabel>
                                                        </FormItem>
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" type="email" defaultValue={user.email} disabled />
                                            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                                        </div>
                                         <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Primary Phone</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <h3 className="text-lg font-semibold border-b pb-2">Address Details</h3>
                                     <FormField
                                        control={form.control}
                                        name="addressLine1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} disabled={!isEditing} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="pincode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Pincode</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    
                                     <h3 className="text-lg font-semibold border-b pb-2">Family & Occupation</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField
                                            control={form.control}
                                            name="occupation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Occupation</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                          <FormField
                                            control={form.control}
                                            name="familyMembers"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Number of Family Members</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} disabled={!isEditing} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                     </div>
                                      <FormField
                                        control={form.control}
                                        name="isWidow"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={!isEditing}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                Are you a Widow?
                                                </FormLabel>
                                                <FormDescription>
                                                This information helps us understand your situation better.
                                                </FormDescription>
                                            </div>
                                            </FormItem>
                                        )}
                                    />


                                     <h3 className="text-lg font-semibold border-b pb-2">Verification Details</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField
                                            control={form.control}
                                            name="panNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>PAN Number</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="aadhaarNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Aadhaar Number</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} disabled={!isEditing} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    
                                    {isEditing && (
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </form>
                    </Form>
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
                                <Switch id="monthly-reminder" onCheckedChange={handleFeatureInProgress} />
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
