
// src/app/admin/user-management/[id]/edit/edit-user-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider, useFormContext } from "react-hook-form";
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
import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, CheckCircle, Save, RefreshCw, AlertTriangle, Edit, X, PlusCircle, Trash2, Paperclip, FileIcon, User as UserIcon, MapPin, CreditCard, Banknote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { User, UserRole, AppSettings } from "@/services/types";
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
} from "@/components/ui/alert-dialog";
import { UserProfileAuditTrail } from "./user-profile-audit-trail";
import { DeleteUserButton } from "./delete-user-button";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getAppSettings } from "@/app/admin/settings/actions";
import { Separator } from "@/components/ui/separator";

const FileUploadField = ({ name, label, control, currentUrl, isEditing = true }: { name: "aadhaarCard" | "addressProof" | "otherDocument1" | "otherDocument2", label: string, control: any, currentUrl?: string, isEditing?: boolean }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
    const { setValue } = useFormContext(); // Use context from the main form

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setValue(name, file, { shouldValidate: true, shouldDirty: true });
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(currentUrl || null);
        }
    };
    
    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <Input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    disabled={!isEditing}
                />
            </FormControl>
            {previewUrl && (
                <div className="mt-2 p-2 border rounded-md">
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                         {previewUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                            <Image src={previewUrl} alt="Preview" width={100} height={100} className="object-contain" />
                         ) : (
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
                                <FileIcon className="h-4 w-4" />
                                <span>View Document</span>
                            </div>
                         )}
                    </a>
                </div>
            )}
            <FormMessage />
        </FormItem>
    )
}

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
                            This action will change the user&apos;s password immediately. They will lose access with their old password.
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

const createFormSchema = (settings?: AppSettings) => z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  fatherName: z.string().optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),
  roles: z.array(z.string()).refine((value) => (value || []).length > 0, {
    message: "You have to select at least one role.",
  }),
  isAnonymousAsBeneficiary: z.boolean().default(false),
  isAnonymousAsDonor: z.boolean().default(false),
  isActive: z.boolean().default(true),
  gender: z.enum(["Male", "Female", "Other"]),
  beneficiaryType: z.enum(["Adult", "Old Age", "Kid", "Family", "Widow"]).optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  occupation: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  familyMembers: z.coerce.number().optional(),
  earningMembers: z.coerce.number().optional(),
  totalFamilyIncome: z.coerce.number().optional(),
  isWidow: z.boolean().default(false),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  upiPhoneNumbers: z.array(z.object({ value: z.string() })).optional(),
  upiIds: z.array(z.object({ value: z.string() })).optional(),
  aadhaarCard: z.any().optional(),
  addressProof: z.any().optional(),
  otherDocument1: z.any().optional(),
  otherDocument2: z.any().optional(),
}).superRefine((data, ctx) => {
    // Dynamic mandatory fields based on roles and settings
    const isBeneficiary = data.roles.includes('Beneficiary');
    const beneficiarySettings = settings?.userConfiguration?.Beneficiary;

    if (isBeneficiary && beneficiarySettings) {
        if (beneficiarySettings.isAadhaarMandatory && !data.aadhaarNumber) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Aadhaar Number is required for Beneficiaries.", path: ["aadhaarNumber"] });
        }
        if (beneficiarySettings.isAddressMandatory && !data.addressLine1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Address is required for Beneficiaries.", path: ["addressLine1"] });
        }
        if (beneficiarySettings.isPanMandatory && !data.panNumber) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN Number is required for Beneficiaries.", path: ["panNumber"] });
        }
        if (beneficiarySettings.isBankAccountMandatory && !data.bankAccountNumber) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank Account Number is required for Beneficiaries.", path: ["bankAccountNumber"] });
        }
        if (!data.beneficiaryType) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Beneficiary Type is required when the Beneficiary role is selected.", path: ["beneficiaryType"] });
        }
    }
});


type EditUserFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface EditUserFormProps {
    user: User;
}

export function EditUserForm({ user }: EditUserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFileDirty, setIsFileDirty] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const formSchema = useMemo(() => createFormSchema(settings || undefined), [settings]);
  
  useEffect(() => {
    const adminId = localStorage.getItem('userId');
    if (adminId) {
      getUser(adminId).then(setCurrentAdmin);
    }
    getAppSettings().then(setSettings);
  }, []);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      fatherName: user.fatherName || '',
      phone: user.phone,
      roles: user.roles,
      isAnonymousAsBeneficiary: user.isAnonymousAsBeneficiary || false,
      isAnonymousAsDonor: user.isAnonymousAsDonor || false,
      isActive: user.isActive,
      gender: user.gender,
      beneficiaryType: user.beneficiaryType,
      addressLine1: user.address?.addressLine1 || '',
      city: user.address?.city || 'Solapur',
      state: user.address?.state || 'Maharashtra',
      country: user.address?.country || 'India',
      pincode: user.address?.pincode || '',
      occupation: user.occupation || '',
      fatherOccupation: user.fatherOccupation || '',
      motherOccupation: user.motherOccupation || '',
      familyMembers: user.familyMembers || 0,
      earningMembers: user.earningMembers || 0,
      totalFamilyIncome: user.totalFamilyIncome || 0,
      isWidow: user.isWidow || false,
      panNumber: user.panNumber || '',
      aadhaarNumber: user.aadhaarNumber || '',
      bankAccountName: user.bankAccountName || '',
      bankName: user.bankName || '',
      bankAccountNumber: user.bankAccountNumber || '',
      bankIfscCode: user.bankIfscCode || '',
      upiPhoneNumbers: user.upiPhoneNumbers?.map(id => ({ value: id })) || [{ value: "" }],
      upiIds: user.upiIds?.map(id => ({ value: id })) || [{ value: "" }],
    },
  });

  const { formState, control, reset, handleSubmit: originalHandleSubmit, watch, trigger } = form;
  const isFormDirty = formState.isDirty || isFileDirty;

  const handleSubmit = (onSubmitFunction: (values: EditUserFormValues) => void) => {
    return originalHandleSubmit(onSubmitFunction);
  };
  
  useEffect(() => {
      const subscription = watch((value, { name }) => {
          if (name?.includes('Card') || name?.startsWith('otherDocument') || name?.includes('Proof')) {
              setIsFileDirty(true);
          }
          if(name === 'roles'){
              trigger(); // Re-validate the form when roles change
          }
      });
      return () => subscription.unsubscribe();
  }, [watch, trigger]);


  const { fields: upiIdFields, append: appendUpiId, remove: removeUpiId } = useFieldArray({ control, name: "upiIds" });
  const { fields: upiPhoneFields, append: appendUpiPhone, remove: removeUpiPhone } = useFieldArray({ control, name: "upiPhoneNumbers" });
  const selectedRoles = form.watch("roles");
  
  const handleCancel = () => {
      reset(); // Reset to the original default values
      setIsEditing(false);
      setIsFileDirty(false);
  }

  async function onSubmit(values: EditUserFormValues) {
    if(!currentAdmin?.id) {
        toast({ variant: "destructive", title: "Error", description: "Admin user not found. Cannot perform update." });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (value instanceof File) {
            formData.append(key, value);
        } else if (Array.isArray(value)) {
            if (key === 'roles') {
            value.forEach(v => formData.append(key, v));
            } else {
            value.forEach(item => {
                if(item && typeof item === 'object' && 'value' in item && item.value) {
                    formData.append(key, item.value);
                }
            })
            }
        } else if (typeof value === 'boolean') {
            if (value) formData.append(key, 'on');
        } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    // Manually add file fields since react-hook-form doesn't track them in 'values'
    const aadhaarFile = form.getValues('aadhaarCard');
    if (aadhaarFile instanceof File) formData.append('aadhaarCard', aadhaarFile);
    
    const addressFile = form.getValues('addressProof');
    if (addressFile instanceof File) formData.append('addressProof', addressFile);
    
    const other1File = form.getValues('otherDocument1');
    if (other1File instanceof File) formData.append('otherDocument1', other1File);

    const other2File = form.getValues('otherDocument2');
    if (other2File instanceof File) formData.append('otherDocument2', other2File);
    
    const result = await handleUpdateUser(user.id!, formData, currentAdmin.id);

    if (result.success) {
      toast({
        variant: "success",
        title: "User Updated",
        description: `Successfully updated user ${user.name}.`,
        icon: <CheckCircle />,
      });
      reset(values);
      setIsFileDirty(false);
      setIsEditing(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error Updating User",
        description: result.error || "An unknown error occurred.",
      });
    }

    setIsSubmitting(false);
  }

  const availableRoles = currentAdmin?.roles.includes('Super Admin') ? allRoles : normalAdminRoles;
  
  const isBeneficiary = selectedRoles.includes('Beneficiary');

  return (
    <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Edit User</CardTitle>
                        <CardDescription>Update the details for {user.name}.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <Button type="button" onClick={() => setIsEditing(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                 <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || !isFormDirty}>
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
                <FormProvider {...form}>
                <form className="space-y-8 max-w-2xl">
                    <fieldset disabled={!isEditing} className="space-y-6">
                        <Accordion type="multiple" defaultValue={["basic", "payment", "beneficiary", "address"]} className="w-full space-y-4">
                            <AccordionItem value="basic" className="border rounded-lg">
                                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><UserIcon className="h-5 w-5"/>Basic Information</h4></AccordionTrigger>
                                <AccordionContent className="p-6 pt-2 space-y-6">
                                     <FormItem><FormLabel>User ID</FormLabel><FormControl><Input value={user.userId || ''} disabled /></FormControl><FormDescription>The user&apos;s custom ID cannot be changed.</FormDescription></FormItem>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="First Name" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="middleName" render={({ field }) => (<FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input placeholder="Middle Name" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Last Name" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                    <FormField control={form.control} name="fatherName" render={({ field }) => (<FormItem><FormLabel>Father&apos;s Name (Optional)</FormLabel><FormControl><Input placeholder="Enter father's name" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                       <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Primary Phone</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem className="space-y-3"><FormLabel>Gender</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4 pt-2" disabled={!isEditing}><FormItem className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><FormLabel htmlFor="male" className="font-normal">Male</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><FormLabel htmlFor="female" className="font-normal">Female</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><RadioGroupItem value="Other" id="other" /><FormLabel htmlFor="other" className="font-normal">Other</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                     <div className="space-y-2"><FormLabel>Email Address</FormLabel><Input type="email" value={user.email || ''} disabled /><FormDescription>Email address cannot be changed.</FormDescription></div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="account" className="border rounded-lg">
                                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2">Account Settings & Roles</h4></AccordionTrigger>
                                <AccordionContent className="p-6 pt-2 space-y-6">
                                     <FormField control={form.control} name="roles" render={() => ( <FormItem><div className="mb-4"><FormLabel className="text-base">User Roles</FormLabel><FormDescription>Select all roles that apply to this user.</FormDescription></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{availableRoles.map((role) => (<FormField key={role} control={form.control} name="roles" render={({ field }) => { return (<FormItem key={role} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(role)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value || [], role]) : field.onChange( field.value?.filter( (value) => value !== role))}} disabled={!isEditing}/></FormControl><FormLabel className="font-normal">{role}</FormLabel></FormItem> )}}/>))}</div><FormMessage /></FormItem>)}/>
                                     {selectedRoles.includes("Beneficiary") && <FormField control={form.control} name="isAnonymousAsBeneficiary" render={({ field }) => ( <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isEditing}/></FormControl><div className="space-y-1 leading-none"><FormLabel>Mark as Anonymous Beneficiary</FormLabel><FormDescription>If checked, their name will be hidden from public view and their Anonymous ID will be used instead.</FormDescription></div></FormItem>)} />}
                                     {selectedRoles.includes("Donor") && <FormField control={form.control} name="isAnonymousAsDonor" render={({ field }) => ( <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isEditing}/></FormControl><div className="space-y-1 leading-none"><FormLabel>Mark as Anonymous Donor</FormLabel><FormDescription>If checked, their name will be hidden from public view for all their donations.</FormDescription></div></FormItem>)} />}
                                     <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">User Status</FormLabel><FormDescription>Set the user account to active or inactive. Inactive users cannot log in.</FormDescription></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={!isEditing}/></FormControl></FormItem>)}/>
                                </AccordionContent>
                            </AccordionItem>

                            {isBeneficiary && (
                                <AccordionItem value="beneficiary" className="border rounded-lg">
                                    <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><UserIcon className="h-5 w-5"/>Family &amp; Occupation Details</h4></AccordionTrigger>
                                    <AccordionContent className="p-6 pt-2 space-y-6">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={form.control} name="occupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="fatherOccupation" render={({ field }) => (<FormItem><FormLabel>Father&apos;s Occupation</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="motherOccupation" render={({ field }) => (<FormItem><FormLabel>Mother&apos;s Occupation</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="familyMembers" render={({ field }) => (<FormItem><FormLabel>Number of Family Members</FormLabel><FormControl><Input type="number" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="earningMembers" render={({ field }) => (<FormItem><FormLabel>Earning Members</FormLabel><FormControl><Input type="number" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="totalFamilyIncome" render={({ field }) => (<FormItem><FormLabel>Total Family Income (Monthly)</FormLabel><FormControl><Input type="number" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        </div>
                                         <FormField control={form.control} name="beneficiaryType" render={({ field }) => (
                                             <FormItem>
                                                 <FormLabel>Beneficiary Type</FormLabel>
                                                 <FormControl>
                                                     <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-row space-x-4 pt-2" disabled={!isEditing}>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><RadioGroupItem value="Adult" id="type-adult"/><FormLabel className="font-normal" htmlFor="type-adult">Adult</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><RadioGroupItem value="Old Age" id="type-old"/><FormLabel className="font-normal" htmlFor="type-old">Old Age</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><RadioGroupItem value="Kid" id="type-kid"/><FormLabel className="font-normal" htmlFor="type-kid">Kid</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><RadioGroupItem value="Family" id="type-family"/><FormLabel className="font-normal" htmlFor="type-family">Family</FormLabel></FormItem>
                                                     </RadioGroup>
                                                 </FormControl>
                                                 <FormMessage />
                                             </FormItem>
                                         )}/>
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            <AccordionItem value="address" className="border rounded-lg">
                                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><MapPin className="h-5 w-5"/>Address Details</h4></AccordionTrigger>
                                <AccordionContent className="p-6 pt-2 space-y-6">
                                    <FormField control={form.control} name="addressLine1" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Enter user's full address" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Solapur" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="pincode" render={({ field }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="e.g., 413001" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g., Maharashtra" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., India" {...field} disabled /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="payment" className="border rounded-lg">
                                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><CreditCard className="h-5 w-5"/>Verification &amp; Payment Details</h4></AccordionTrigger>
                                <AccordionContent className="p-6 pt-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="panNumber" render={({ field }) => (<FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="aadhaarNumber" render={({ field }) => (<FormItem><FormLabel>Aadhaar Number</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                    <h3 className="text-lg font-semibold border-b pb-2">Documents</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FileUploadField name="aadhaarCard" label="Aadhaar Card" control={control} currentUrl={user.aadhaarCardUrl} isEditing={isEditing} />
                                        <FileUploadField name="addressProof" label="Address Proof" control={control} currentUrl={user.addressProofUrl} isEditing={isEditing} />
                                        <FileUploadField name="otherDocument1" label="Other Document 1" control={control} currentUrl={user.otherDocument1Url} isEditing={isEditing} />
                                        <FileUploadField name="otherDocument2" label="Other Document 2" control={control} currentUrl={user.otherDocument2Url} isEditing={isEditing} />
                                    </div>
                                     <h3 className="text-lg font-semibold border-b pb-2 pt-4">Bank Details</h3>
                                    <FormField control={form.control} name="bankAccountName" render={({ field }) => (<FormItem><FormLabel>Full Name as per Bank Account</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (<FormItem><FormLabel>Bank Account Number</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="bankIfscCode" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                    <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    <Separator />
                                    <div className="space-y-4">
                                        <FormLabel>UPI Phone Numbers</FormLabel>
                                        {upiPhoneFields.map((field, index) => (<FormField control={form.control} key={field.id} name={`upiPhoneNumbers.${index}.value`} render={({ field }) => (<FormItem><div className="flex items-center gap-2"><FormControl><Input {...field} disabled={!isEditing} type="tel" maxLength={10} /></FormControl>{isEditing && (<Button type="button" variant="ghost" size="icon" onClick={() => removeUpiPhone(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>)}</div><FormMessage /></FormItem>)}/>))}
                                        {isEditing && (<Button type="button" variant="outline" size="sm" onClick={() => appendUpiPhone({ value: "" })}><PlusCircle className="mr-2" />Add Phone</Button>)}
                                    </div>
                                    <div className="space-y-4">
                                        <FormLabel>UPI IDs</FormLabel>
                                        {upiIdFields.map((field, index) => (<FormField control={form.control} key={field.id} name={`upiIds.${index}.value`} render={({ field }) => (<FormItem><div className="flex items-center gap-2"><FormControl><Input {...field} disabled={!isEditing} /></FormControl>{isEditing && (<Button type="button" variant="ghost" size="icon" onClick={() => removeUpiId(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>)}</div><FormMessage /></FormItem>)}/>))}
                                        {isEditing && (<Button type="button" variant="outline" size="sm" onClick={() => appendUpiId({ value: "" })}><PlusCircle className="mr-2" />Add UPI ID</Button>)}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </fieldset>
                </form>
                </FormProvider>
            </CardContent>
        </Card>
        
        {currentAdmin?.roles.includes("Super Admin") && (
            <div className="mt-6">
                <UserProfileAuditTrail userId={user.id!} />
            </div>
        )}
    </>
  );
}
