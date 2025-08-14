

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { handleUpdateUser, handleSetPassword } from "./actions";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Save, RefreshCw, AlertTriangle, Edit, X, PlusCircle, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { User, UserRole } from "@/services/types";
import { getUser } from "@/services/user-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { UserActivityFeed } from "./user-activity-feed";
import { DeleteUserButton } from "./delete-user-button";


const setPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  userId: z.string(),
});
type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

function SetPasswordSection({ userId }: { userId: string }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<SetPasswordFormValues>({
        resolver: zodResolver(setPasswordSchema),
        defaultValues: {
            newPassword: "",
            userId: userId,
        },
    });

    const onSubmit = async (values: SetPasswordFormValues) => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("userId", values.userId);
        formData.append("newPassword", values.newPassword);
        
        const result = await handleSetPassword(formData);
        
        if (result.success) {
            toast({
                variant: 'success',
                title: "Password Set",
                description: "The user's password has been updated successfully.",
                icon: <CheckCircle />
            });
            form.reset();
            setIsDialogOpen(false); // Close dialog on success
        } else {
            toast({
                variant: 'destructive',
                title: "Set Password Failed",
                description: result.error,
            });
        }
        setIsSubmitting(false);
    };

    return (
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="secondary" type="button">
                    <RefreshCw className="mr-2 h-4 w-4" /> Set New Password
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Set a New Password</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will change the user's password immediately. They will lose access with their old password.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                                <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter new password" {...field} autoFocus />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting} onClick={() => setIsDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            type="submit"
                            disabled={isSubmitting || !form.formState.isValid}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Set Password
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </form>
                </Form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

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
  userId: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
  isAnonymousAsBeneficiary: z.boolean().default(false),
  isAnonymousAsDonor: z.boolean().default(false),
  isActive: z.boolean().default(true),
  gender: z.enum(["Male", "Female", "Other"]),
  beneficiaryType: z.enum(["Adult", "Old Age", "Kid", "Family"]).optional(),
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
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  upiPhone: z.string().optional(),
  upiIds: z.array(z.object({ value: z.string() })).optional(),
});

type EditUserFormValues = z.infer<typeof formSchema>;

interface EditUserFormProps {
    user: User;
}

export function EditUserForm({ user }: EditUserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const adminId = localStorage.getItem('userId');
    if (adminId) {
      getUser(adminId).then(setCurrentAdmin);
    }
  }, []);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: user.userId || '',
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      phone: user.phone,
      roles: user.roles,
      isAnonymousAsBeneficiary: user.isAnonymousAsBeneficiary || false,
      isAnonymousAsDonor: user.isAnonymousAsDonor || false,
      isActive: user.isActive,
      gender: user.gender || 'Other',
      beneficiaryType: user.beneficiaryType,
      addressLine1: user.address?.addressLine1 || '',
      city: user.address?.city || 'Solapur',
      state: user.address?.state || 'Maharashtra',
      country: user.address?.country || 'India',
      pincode: user.address?.pincode || '',
      occupation: user.occupation || '',
      familyMembers: user.familyMembers || 0,
      isWidow: user.isWidow || false,
      panNumber: user.panNumber || '',
      aadhaarNumber: user.aadhaarNumber || '',
      bankAccountName: user.bankAccountName || '',
      bankAccountNumber: user.bankAccountNumber || '',
      bankIfscCode: user.bankIfscCode || '',
      upiPhone: user.upiPhone || '',
      upiIds: user.upiIds?.map(id => ({ value: id })) || [{ value: "" }],
    },
  });

  const { formState: { isDirty }, reset, control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "upiIds" });
  const selectedRoles = form.watch("roles");
  const selectedGender = form.watch("gender");
  const isAnonymousBeneficiary = form.watch("isAnonymousAsBeneficiary");
  const isAnonymousDonor = form.watch("isAnonymousAsDonor");
  
  const handleCancel = () => {
      reset({
          userId: user.userId || '',
          firstName: user.firstName,
          middleName: user.middleName || '',
          lastName: user.lastName,
          phone: user.phone,
          roles: user.roles,
          isAnonymousAsBeneficiary: user.isAnonymousAsBeneficiary || false,
          isAnonymousAsDonor: user.isAnonymousAsDonor || false,
          isActive: user.isActive,
          gender: user.gender || 'Other',
          beneficiaryType: user.beneficiaryType,
          addressLine1: user.address?.addressLine1 || '',
          city: user.address?.city || 'Solapur',
          state: user.address?.state || 'Maharashtra',
          country: user.address?.country || 'India',
          pincode: user.address?.pincode || '',
          occupation: user.occupation || '',
          familyMembers: user.familyMembers || 0,
          isWidow: user.isWidow || false,
          panNumber: user.panNumber || '',
          aadhaarNumber: user.aadhaarNumber || '',
          bankAccountName: user.bankAccountName || '',
          bankAccountNumber: user.bankAccountNumber || '',
          bankIfscCode: user.bankIfscCode || '',
          upiPhone: user.upiPhone || '',
          upiIds: user.upiIds?.map(id => ({ value: id })) || [{ value: "" }],
      });
      setIsEditing(false);
  }


  async function onSubmit(values: EditUserFormValues) {
    if(!currentAdmin?.id) {
        toast({ variant: "destructive", title: "Error", description: "Admin user not found. Cannot perform update." });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'upiIds' && Array.isArray(value)) {
        value.forEach(item => {
          if (item.value) formData.append(key, item.value)
        });
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const result = await handleUpdateUser(user.id!, formData, currentAdmin.id);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "User Updated",
        description: `Successfully updated user ${user.name}.`,
        icon: <CheckCircle />,
      });
      form.reset(values);
      setIsEditing(false);
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
    <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Edit User</CardTitle>
                        <CardDescription>Update the details for {user.name}.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <Button onClick={() => setIsEditing(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || !isDirty}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        )}
                        <DeleteUserButton userId={user.id!} userName={user.name} />
                         <SetPasswordSection userId={user.id!} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form className="space-y-8 max-w-2xl">
                    <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                     <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>User ID</FormLabel>
                            <FormControl>
                                <Input {...field} disabled />
                            </FormControl>
                             <FormDescription>The user's custom ID cannot be changed.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                                <Input placeholder="First Name" {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="middleName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Middle Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Middle Name" {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Last Name" {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <FormLabel>Email Address</FormLabel>
                            <Input type="email" value={user.email} disabled />
                            <FormDescription>Email address cannot be changed.</FormDescription>
                        </div>
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number (10 digits)</FormLabel>
                        <FormControl>
                            <Input type="tel" maxLength={10} placeholder="9876543210" {...field} disabled={!isEditing} />
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
                                <Textarea placeholder="Enter user's full address" {...field} disabled={!isEditing} />
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
                                    <Input placeholder="e.g., 413001" {...field} disabled={!isEditing} />
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
                                    <Input placeholder="e.g., Daily wage worker, Unemployed" {...field} disabled={!isEditing} />
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
                                    <Input type="number" placeholder="e.g., 5" {...field} disabled={!isEditing} />
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
                                    disabled={!isEditing}
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
                                            disabled={!isEditing}
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
                        <FormField
                            control={form.control}
                            name="isAnonymousAsBeneficiary"
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
                                    Mark as Anonymous Beneficiary
                                    </FormLabel>
                                    <FormDescription>
                                    If checked, their name will be hidden from public view and their Anonymous ID will be used instead.
                                    </FormDescription>
                                </div>
                                </FormItem>
                            )}
                        />
                    )}
                    {selectedRoles.includes("Donor") && (
                         <FormField
                            control={form.control}
                            name="isAnonymousAsDonor"
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
                                    Mark as Anonymous Donor
                                    </FormLabel>
                                    <FormDescription>
                                    If checked, their name will be hidden from public view for all their donations.
                                    </FormDescription>
                                </div>
                                </FormItem>
                            )}
                        />
                    )}
                    {(isAnonymousBeneficiary) && (
                        <div className="space-y-2">
                            <FormLabel>Anonymous Beneficiary ID</FormLabel>
                            <Input value={user.anonymousBeneficiaryId || "Will be generated on save"} disabled />
                            <FormDescription>This ID is used for public display to protect privacy.</FormDescription>
                        </div>
                    )}
                     {(isAnonymousDonor) && (
                        <div className="space-y-2">
                            <FormLabel>Anonymous Donor ID</FormLabel>
                            <Input value={user.anonymousDonorId || "Will be generated on save"} disabled />
                            <FormDescription>This ID is used for public display to protect privacy.</FormDescription>
                        </div>
                    )}
                     {selectedRoles.includes("Beneficiary") && (
                        <FormField
                            control={form.control}
                            name="beneficiaryType"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Beneficiary Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-row space-x-4 pt-2"
                                    disabled={!isEditing}
                                    >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Adult" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Adult</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Old Age" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Old Age</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Kid" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Kid</FormLabel>
                                    </FormItem>
                                     <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Family" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Family</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    
                    <h3 className="text-lg font-semibold border-b pb-2">Verification & Payment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                        control={form.control}
                        name="panNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>PAN Number (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter PAN number" {...field} disabled={!isEditing} />
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
                                <Input placeholder="Enter Aadhaar number" {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bank Account Number (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter bank account number" {...field} disabled={!isEditing} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="space-y-4">
                        <FormLabel>UPI IDs</FormLabel>
                        <FormDescription>Add one or more UPI IDs for this user to help with automatic donor detection.</FormDescription>
                        {fields.map((field, index) => (
                            <FormField
                            control={form.control}
                            key={field.id}
                            name={`upiIds.${index}.value`}
                            render={({ field }) => (
                                <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                    <Input {...field} placeholder="e.g., username@okhdfc" disabled={!isEditing} />
                                    </FormControl>
                                    {isEditing && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    )}
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        ))}
                        {isEditing && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ value: "" })}
                            >
                                <PlusCircle className="mr-2" />
                                Add UPI ID
                            </Button>
                        )}
                    </div>

                    <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">
                            User Status
                            </FormLabel>
                            <FormDescription>
                            Set the user account to active or inactive. Inactive users cannot log in.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isEditing}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    
                </form>
                </Form>
            </CardContent>
        </Card>
        
        {currentAdmin?.roles.includes("Super Admin") && (
            <div className="mt-6">
                <UserActivityFeed userId={user.id!} />
            </div>
        )}
    </>
  );
}
