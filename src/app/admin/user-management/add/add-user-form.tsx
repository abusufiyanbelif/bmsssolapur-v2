

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
import { handleAddUser, findExistingUsers } from "./actions";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { Loader2, CheckCircle, Trash2, PlusCircle, AlertTriangle, UserCheck, Eye, UserPlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { User, UserRole } from "@/services/types";
import { getUser } from "@/services/user-service";
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { useDebounce } from "@/hooks/use-debounce";


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
  userId: z.string().min(3, "User ID must be at least 3 characters."),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
  createProfile: z.boolean().default(false),
  isAnonymousAsBeneficiary: z.boolean().default(false),
  isAnonymousAsDonor: z.boolean().default(false),
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


type AddUserFormValues = z.infer<typeof formSchema>;

function AddUserFormContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  
  const [potentialDuplicates, setPotentialDuplicates] = useState<User[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  useEffect(() => {
    const adminId = localStorage.getItem('userId');
    if (adminId) {
      getUser(adminId).then(setCurrentAdmin);
    }
  }, []);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      userId: "",
      roles: ["Donor"],
      city: 'Solapur',
      state: 'Maharashtra',
      country: 'India',
      upiIds: [{ value: "" }],
    },
  });

   const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "upiIds"
  });
  
  const { watch } = form;
  
  const watchedFields = watch();
  const debouncedWatchedFields = useDebounce(watchedFields, 500);

  const checkForDuplicates = useCallback(async (values: AddUserFormValues) => {
    const { firstName, lastName, userId, phone, email } = values;
    if (!firstName && !lastName && !userId && !phone && !email) {
      setPotentialDuplicates([]);
      setShowDuplicateDialog(false);
      return;
    }
    
    setIsCheckingDuplicates(true);
    const result = await findExistingUsers({
      userId: userId,
      phone: phone,
      email: email,
      fullName: `${firstName} ${lastName}`.trim(),
    });
    
    if (result.matches.length > 0) {
        setPotentialDuplicates(result.matches);
        setShowDuplicateDialog(true);
    } else {
        setPotentialDuplicates([]);
        setShowDuplicateDialog(false);
    }
    setIsCheckingDuplicates(false);
  }, []);

  useEffect(() => {
      checkForDuplicates(debouncedWatchedFields);
  }, [debouncedWatchedFields, checkForDuplicates]);


  useEffect(() => {
    const donorName = searchParams.get('donorName');
    const donorPhone = searchParams.get('donorPhone');
    const donorUpiId = searchParams.get('donorUpiId');
    const bankAccountNumber = searchParams.get('bankAccountNumber');

    if (donorName) {
        const nameParts = donorName.split(' ');
        form.setValue('firstName', nameParts[0] || '');
        form.setValue('lastName', nameParts.slice(1).join(' ') || '');
    }
    if(donorPhone) form.setValue('phone', donorPhone);
    if(bankAccountNumber) form.setValue('bankAccountNumber', bankAccountNumber);
    if(donorUpiId) form.setValue('upiIds', [{value: donorUpiId}]);
    
  }, [searchParams, form]);

  const selectedRoles = form.watch("roles");
  const selectedGender = form.watch("gender");
  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const isAnonymousBeneficiary = form.watch("isAnonymousAsBeneficiary");
  const isAnonymousDonor = form.watch("isAnonymousAsDonor");
  
  useEffect(() => {
    if (firstName && lastName) {
        const generatedUserId = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '');
        if (!form.formState.dirtyFields.userId) {
            form.setValue('userId', generatedUserId);
        }
    }
  }, [firstName, lastName, form]);


  async function onSubmit(values: AddUserFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    if(values.userId) formData.append("userId", values.userId);
    if(values.firstName) formData.append("firstName", values.firstName);
    if(values.middleName) formData.append("middleName", values.middleName);
    if(values.lastName) formData.append("lastName", values.lastName);
    if(values.email) formData.append("email", values.email);
    formData.append("phone", values.phone);
    values.roles.forEach(role => formData.append("roles", role));
    if(values.createProfile) formData.append("createProfile", "on");
    if(values.isAnonymousAsBeneficiary) formData.append("isAnonymousAsBeneficiary", "on");
    if(values.isAnonymousAsDonor) formData.append("isAnonymousAsDonor", "on");
    formData.append("gender", values.gender);
    if(values.beneficiaryType) formData.append("beneficiaryType", values.beneficiaryType);
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
    if(values.bankAccountName) formData.append("bankAccountName", values.bankAccountName);
    if(values.bankAccountNumber) formData.append("bankAccountNumber", values.bankAccountNumber);
    if(values.bankIfscCode) formData.append("bankIfscCode", values.bankIfscCode);
    if(values.upiPhone) formData.append("upiPhone", values.upiPhone);
    values.upiIds?.forEach(upi => {
        if(upi.value) formData.append("upiIds", upi.value);
    });

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
      setShowDuplicateDialog(false);
      setPotentialDuplicates([]);
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
    <Form {...form}>
      <form className="space-y-6 pt-4" onSubmit={form.handleSubmit(onSubmit)}>
        
        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                        <Input type="text" placeholder="Enter your first name" {...field} />
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
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl>
                        <Input type="text" placeholder="Enter your middle name" {...field} />
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
                        <Input type="text" placeholder="Enter your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

         <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Create a custom user ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
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
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="10-digit number" maxLength={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <FormField
                control={form.control}
                name="isAnonymousAsBeneficiary"
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

         {(isAnonymousBeneficiary || isAnonymousDonor) && (
            <div className="text-sm rounded-lg border bg-muted/50 p-4">
                Unique anonymous IDs for Donor and Beneficiary roles will be generated for this user upon creation.
            </div>
        )}

         {selectedRoles.includes("Beneficiary") && (
            <FormField
                control={form.control}
                name="beneficiaryType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Beneficiary Type</FormLabel>
                    <FormDescription>Categorize the beneficiary for reporting and aid purposes.</FormDescription>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4 pt-2"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
         <FormField
            control={form.control}
            name="bankAccountName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name as per Bank Account</FormLabel>
                <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Bank Account Number (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter bank account number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="bankIfscCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>IFSC Code (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter IFSC code" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="upiPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>UPI Phone Number (Optional)</FormLabel>
                    <FormControl>
                        <Input type="tel" maxLength={10} placeholder="10-digit UPI linked phone" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

         <div className="space-y-4">
            <FormLabel>UPI IDs (Optional)</FormLabel>
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
                      <Input {...field} placeholder="e.g., username@okhdfc" />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "" })}
            >
                <PlusCircle className="mr-2" />
                Add UPI ID
            </Button>
         </div>
        
        <Button type="submit" disabled={isSubmitting || isCheckingDuplicates}>
          {isSubmitting || isCheckingDuplicates ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {isCheckingDuplicates ? 'Checking for duplicates...' : 'Create User'}
        </Button>
      </form>
    </Form>

     <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                Potential Duplicate User Found
            </DialogTitle>
            <DialogDescription>
              A user with similar details already exists in the system. Please review the matches before creating a new user.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 p-2 rounded-md bg-muted">
            {potentialDuplicates.map(user => (
              <div key={user.id} className="p-3 border bg-background rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.phone} / {user.email}</p>
                  <div className="flex gap-1 mt-1">
                     {user.roles?.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                  </div>
                </div>
                 <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/user-management/${user.id}/edit`}>
                        <Eye className="mr-2 h-4 w-4" /> View
                    </Link>
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
             <Button variant="secondary" onClick={() => setShowDuplicateDialog(false)}>
                Go Back & Edit
            </Button>
            <Button onClick={() => form.handleSubmit(onSubmit)()} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Create New User Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AddUserForm() {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddUserFormContent />
        </Suspense>
    )
}
