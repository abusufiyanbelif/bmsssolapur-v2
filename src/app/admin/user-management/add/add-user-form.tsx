
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { handleAddUser } from "./actions";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { User, UserRole } from "@/services/types";
import { getUser } from "@/services/user-service";

const allRoles: Exclude<UserRole, 'Guest'>[] = [
    "Donor",
    "Beneficiary",
    "Admin",
    "Finance Admin",
    "Super Admin",
    "Referral",
];

const normalAdminRoles: Exclude<UserRole, 'Guest' | 'Admin' | 'Super Admin' | 'Finance Admin'>[] = [
    "Donor",
    "Beneficiary",
    "Referral",
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
  createProfile: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  gender: z.enum(["Male", "Female", "Other"]),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  occupation: z.string().optional(),
  familyMembers: z.coerce.number().optional(),
  isWidow: z.boolean().default(false),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
}).refine(data => {
    // If creating a beneficiary profile, phone number is required
    if (data.roles.includes("Beneficiary") && data.createProfile) {
        return data.phone && /^[0-9]{10}$/.test(data.phone);
    }
    return true;
}, {
    message: "A valid 10-digit phone number is required to create a profile.",
    path: ["phone"],
});


type AddUserFormValues = z.infer<typeof formSchema>;

export function AddUserForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);

  useEffect(() => {
    const adminId = localStorage.getItem('userId');
    if (adminId) {
      getUser(adminId).then(setCurrentAdmin);
    }
  }, []);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      roles: ["Donor"],
      createProfile: false,
      isAnonymous: false,
      isWidow: false,
      city: 'Solapur',
      state: 'Maharashtra',
      country: 'India',
    },
  });

  const selectedRoles = form.watch("roles");
  const selectedGender = form.watch("gender");


  async function onSubmit(values: AddUserFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    if(values.phone) formData.append("phone", values.phone);
    values.roles.forEach(role => formData.append("roles", role));
    if(values.createProfile) formData.append("createProfile", "on");
    if(values.isAnonymous) formData.append("isAnonymous", "on");
    formData.append("gender", values.gender);
    if(values.addressLine1) formData.append("addressLine1", values.addressLine1);
    if(values.city) formData.append("city", values.city);
    if(values.state) formData.append("state", values.state);
    if(values.country) formData.append("country", values.country);
    if(values.pincode) formData.append("pincode", values.pincode);
    if(values.occupation) formData.append("occupation", values.occupation);
    if(values.familyMembers) formData.append("familyMembers", String(values.familyMembers));
    if(values.isWidow) formData.append("isWidow", "on");
    if(values.panNumber) formData.append("panNumber", values.panNumber);
    if(values.aadhaarNumber) formData.append("aadhaarNumber", values.aadhaarNumber);

    const result = await handleAddUser(formData);

    setIsSubmitting(false);

    if (result.success && result.user) {
      toast({
        variant: "success",
        title: "User Created",
        description: `Successfully created user ${result.user.name}.`,
        icon: <CheckCircle />,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  const availableRoles = currentAdmin?.roles.includes('Super Admin') ? allRoles : normalAdminRoles;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        
        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                    <Input placeholder="Enter user's full name" {...field} />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Phone Number (10 digits)</FormLabel>
                <FormControl>
                    <Input type="tel" maxLength={10} placeholder="9876543210" {...field} />
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
                <FormLabel>Address Line 1 (Street, Area)</FormLabel>
                <FormControl>
                    <Textarea placeholder="Enter user's full address" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Solapur" {...field} disabled />
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
                        <Input placeholder="e.g., 413001" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Maharashtra" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
             <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., India" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>


        <h3 className="text-lg font-semibold border-b pb-2">Family & Occupation</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Daily wage worker, Unemployed" {...field} />
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
                        <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>
        
        {selectedGender === 'Female' && selectedRoles.includes('Beneficiary') && (
            <FormField
                control={form.control}
                name="isWidow"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                        Is the Beneficiary a Widow?
                        </FormLabel>
                        <FormDescription>
                        Check this box if the user is a widow. This helps in prioritizing cases.
                        </FormDescription>
                    </div>
                    </FormItem>
                )}
            />
        )}


        <h3 className="text-lg font-semibold border-b pb-2">Account Settings & Roles</h3>
        <FormField
          control={form.control}
          name="roles"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">User Roles</FormLabel>
                <FormDescription>
                  Select all roles that apply to this user.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableRoles.map((role) => (
                    <FormField
                    key={role}
                    control={form.control}
                    name="roles"
                    render={({ field }) => {
                        return (
                        <FormItem
                            key={role}
                            className="flex flex-row items-start space-x-3 space-y-0"
                        >
                            <FormControl>
                            <Checkbox
                                checked={field.value?.includes(role)}
                                onCheckedChange={(checked) => {
                                return checked
                                    ? field.onChange([...field.value, role])
                                    : field.onChange(
                                        field.value?.filter(
                                        (value) => value !== role
                                        )
                                    )
                                }}
                            />
                            </FormControl>
                            <FormLabel className="font-normal">
                                {role}
                            </FormLabel>
                        </FormItem>
                        )
                    }}
                    />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedRoles.includes("Beneficiary") && (
            <>
                <FormField
                    control={form.control}
                    name="createProfile"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                            Create Beneficiary Profile
                            </FormLabel>
                            <FormDescription>
                            If checked, a profile will be created for the beneficiary, and a phone number becomes mandatory.
                            </FormDescription>
                        </div>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="isAnonymous"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                            Mark as Anonymous Beneficiary
                            </FormLabel>
                            <FormDescription>
                            If checked, a unique ID will be generated and their real name will be hidden from public view.
                            </FormDescription>
                        </div>
                        </FormItem>
                    )}
                />
            </>
        )}

        <h3 className="text-lg font-semibold border-b pb-2">Verification Details</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="panNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>PAN Number (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="Enter PAN number" {...field} />
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
                <FormLabel>Aadhaar Number (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="Enter Aadhaar number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create User
        </Button>
      </form>
    </Form>
  );
}
