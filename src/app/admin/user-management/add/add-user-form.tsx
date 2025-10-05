
// src/app/admin/user-management/add/add-user-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider, useFormContext } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useMemo, Suspense, useCallback } from "react";
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot, FileUp, ZoomIn, ZoomOut, FileIcon, ScanSearch, UserSearch, UserRoundPlus, XCircle, PlusCircle, Paperclip, RotateCw, RefreshCw as RefreshIcon, BookOpen, Sparkles, CreditCard, Fingerprint, MapPin, Trash2, CheckCircle } from "lucide-react";
import type { User, UserRole, AppSettings, ExtractBeneficiaryDetailsOutput, GenerateSummariesOutput } from "@/services/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getRawTextFromImage } from '@/app/actions';
import Image from "next/image";
import { getUser, checkAvailability } from "@/services/user-service";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchParams, useRouter } from 'next/navigation';
import { Separator } from "@/components/ui/separator";
import { handleAddUser, handleExtractUserDetailsFromText } from "./actions";
import { Textarea } from "@/components/ui/textarea";

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

const states = [
    { name: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur"] },
    { name: "Karnataka", cities: ["Bengaluru", "Mysuru", "Hubli"] },
    { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Solapur"] },
    { name: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai"] },
    { name: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad"] },
];

const createFormSchema = (settings?: AppSettings) => z.object({
  userId: z.string().min(3, "User ID must be at least 3 characters."),
  fullName: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  fatherName: z.string().optional(),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),
  password: z.string().optional(),
  roles: z.array(z.string()).refine((value) => (value || []).length > 0, {
    message: "You have to select at least one role.",
  }),
  createProfile: z.boolean().default(false),
  isAnonymousAsBeneficiary: z.boolean().default(false),
  isAnonymousAsDonor: z.boolean().default(false),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Please select a gender."}),
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


type AddUserFormValues = z.infer<ReturnType<typeof createFormSchema>>;

type AvailabilityState = {
    isChecking: boolean;
    isAvailable: boolean | null;
    suggestions?: string[];
    existingUserName?: string;
};

const initialAvailabilityState: AvailabilityState = {
    isChecking: false,
    isAvailable: null,
};

function AvailabilityFeedback({ state, fieldName, onSuggestionClick }: { state: AvailabilityState, fieldName: string, onSuggestionClick?: (suggestion: string) => void }) {
    if (state.isChecking) {
        return <p className="text-sm text-muted-foreground flex items-center mt-2"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</p>;
    }
    if (state.isAvailable === true) {
        return <p className="text-sm text-green-600 flex items-center mt-2"><CheckCircle className="mr-2 h-4 w-4" /> Available</p>;
    }
    if (state.isAvailable === false) {
        return (
            <div className="mt-2">
                <p className="text-sm text-destructive flex items-center">
                    <XCircle className="mr-2 h-4 w-4" /> 
                    This {fieldName} is already in use
                    {state.existingUserName && ` by ${state.existingUserName}`}.
                </p>
                {state.suggestions && state.suggestions.length > 0 && onSuggestionClick && (
                    <div className="flex gap-2 items-center mt-1">
                        <p className="text-xs text-muted-foreground">Suggestions:</p>
                        {state.suggestions.map(suggestion => (
                            <Button 
                                key={suggestion}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => onSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return null;
}

interface AddUserFormProps {
    settings?: AppSettings;
    isSubForm?: boolean;
    prefilledData?: ExtractBeneficiaryDetailsOutput;
    onUserCreate?: (user: User) => void;
}

function AddUserFormContent({ settings, isSubForm = false, prefilledData, onUserCreate }: AddUserFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adminUser, setAdminUser] = useState<User | null>(null);

    const formSchema = useMemo(() => createFormSchema(settings), [settings]);

    const form = useForm<AddUserFormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        defaultValues: {
            userId: "",
            fullName: prefilledData?.beneficiaryFullName || "",
            firstName: prefilledData?.beneficiaryFirstName || "",
            middleName: prefilledData?.beneficiaryMiddleName || "",
            lastName: prefilledData?.beneficiaryLastName || "",
            fatherName: prefilledData?.fatherName || "",
            email: prefilledData?.beneficiaryEmail || "",
            phone: prefilledData?.beneficiaryPhone || "",
            password: "",
            roles: ["Donor"],
            createProfile: false,
            isAnonymousAsBeneficiary: false,
            isAnonymousAsDonor: false,
            gender: prefilledData?.gender,
            beneficiaryType: undefined,
            addressLine1: prefilledData?.address || "",
            city: prefilledData?.city || "Solapur",
            state: prefilledData?.state || "Maharashtra",
            country: prefilledData?.country || "India",
            pincode: prefilledData?.pincode || "",
            occupation: "",
            fatherOccupation: "",
            motherOccupation: "",
            familyMembers: 0,
            earningMembers: 0,
            totalFamilyIncome: 0,
            isWidow: false,
            panNumber: "",
            aadhaarNumber: prefilledData?.aadhaarNumber || "",
            bankAccountName: "",
            bankName: "",
            bankAccountNumber: "",
            bankIfscCode: "",
            upiPhoneNumbers: [{ value: "" }],
            upiIds: [{ value: "" }],
            aadhaarCard: null,
        },
    });

    const { control, formState, watch, setValue, trigger, reset, handleSubmit: originalHandleSubmit, getValues } = form;

    const { fields: upiIdFields, append: appendUpiId, remove: removeUpiId } = useFieldArray({ control, name: "upiIds" });
    const { fields: upiPhoneFields, append: appendUpiPhone, remove: removeUpiPhone } = useFieldArray({ control, name: "upiPhoneNumbers" });

    const selectedRoles = watch("roles");
    const selectedGender = watch("gender");
    const isBeneficiary = selectedRoles.includes('Beneficiary');

    const [userIdState, setUserIdState] = useState<AvailabilityState>(initialAvailabilityState);
    const [emailState, setEmailState] = useState<AvailabilityState>(initialAvailabilityState);
    const [phoneState, setPhoneState] = useState<AvailabilityState>(initialAvailabilityState);
    const [panState, setPanState] = useState<AvailabilityState>(initialAvailabilityState);
    const [aadhaarState, setAadhaarState] = useState<AvailabilityState>(initialAvailabilityState);
    const [bankAccountState, setBankAccountState] = useState<AvailabilityState>(initialAvailabilityState);
    const [upiIdStates, setUpiIdStates] = useState<Record<number, AvailabilityState>>({});
    
    const handleAvailabilityCheck = useCallback(async (field: string, value: string, setState: React.Dispatch<React.SetStateAction<AvailabilityState>>) => {
        if (!value) {
            setState(initialAvailabilityState);
            return;
        }
        setState({ isChecking: true, isAvailable: null });
        const result = await checkAvailability(field, value);
        setState({ isChecking: false, ...result });
    }, []);

    const debouncedUserId = useDebounce(watch('userId'), 500);
    const debouncedEmail = useDebounce(watch('email'), 500);
    const debouncedPhone = useDebounce(watch('phone'), 500);
    const debouncedPan = useDebounce(watch('panNumber'), 500);
    const debouncedAadhaar = useDebounce(watch('aadhaarNumber'), 500);
    const debouncedBankAccount = useDebounce(watch('bankAccountNumber'), 500);
    const debouncedUpiIds = useDebounce(watch('upiIds'), 500);

    const isInitialMount = useRef(true);

    useEffect(() => { 
        if (isInitialMount.current && !debouncedUserId) return;
        if (debouncedUserId) handleAvailabilityCheck('userId', debouncedUserId, setUserIdState); 
    }, [debouncedUserId, handleAvailabilityCheck]);
    useEffect(() => { 
        if (isInitialMount.current && !debouncedEmail) return;
        if (debouncedEmail) handleAvailabilityCheck('email', debouncedEmail, setEmailState); 
    }, [debouncedEmail, handleAvailabilityCheck]);
    useEffect(() => { 
        if (isInitialMount.current && !debouncedPhone) return;
        if (debouncedPhone) handleAvailabilityCheck('phone', debouncedPhone, setPhoneState); 
    }, [debouncedPhone, handleAvailabilityCheck]);
    useEffect(() => { 
        if (isInitialMount.current && !debouncedPan) return;
        if (debouncedPan) handleAvailabilityCheck('panNumber', debouncedPan, setPanState); 
    }, [debouncedPan, handleAvailabilityCheck]);
    useEffect(() => { 
        if (isInitialMount.current && !debouncedAadhaar) return;
        if (debouncedAadhaar) handleAvailabilityCheck('aadhaarNumber', debouncedAadhaar, setAadhaarState); 
    }, [debouncedAadhaar, handleAvailabilityCheck]);
    useEffect(() => { 
        if (isInitialMount.current && !debouncedBankAccount) return;
        if (debouncedBankAccount) handleAvailabilityCheck('bankAccountNumber', debouncedBankAccount, setBankAccountState); 
    }, [debouncedBankAccount, handleAvailabilityCheck]);
    
    useEffect(() => {
        isInitialMount.current = false;
    }, []);

    const fullName = watch("fullName");
    const firstName = watch("firstName");
    const middleName = watch("middleName");
    const lastName = watch("lastName");

    const handleFullNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newFullName = e.target.value;
        setValue('fullName', newFullName, { shouldDirty: true });
        const nameParts = newFullName.split(' ').filter(Boolean);
        setValue('firstName', nameParts[0] || '', { shouldDirty: true });
        setValue('lastName', nameParts.length > 1 ? nameParts[nameParts.length - 1] : '', { shouldDirty: true });
        setValue('middleName', nameParts.slice(1, -1).join(' '), { shouldDirty: true });
        if (nameParts.length > 0) trigger(['firstName', 'lastName']);
    }, [setValue, trigger]);

    useEffect(() => {
        const fullNameFromParts = `${firstName || ''} ${middleName || ''} ${lastName || ''}`.replace(/\s+/g, ' ').trim();
        if (fullNameFromParts !== fullName) {
            setValue('fullName', fullNameFromParts, { shouldDirty: true });
        }
    }, [firstName, middleName, lastName, fullName, setValue]);

    const handleSubmit = (onSubmitFunction: (values: AddUserFormValues) => void) => {
        return async (e: React.BaseSyntheticEvent) => {
            e.preventDefault();
            await trigger(); 
        
            if (Object.keys(formState.errors).length > 0) {
                const errorMessages = Object.values(formState.errors).map(err => err.message).filter(Boolean).join('\n');
                toast({
                    variant: "destructive",
                    title: "Please correct the errors below",
                    description: <pre className="mt-2 w-full rounded-md bg-slate-950 p-4"><code className="text-white whitespace-pre-wrap">{errorMessages}</code></pre>
                });
                return;
            }
            originalHandleSubmit(onSubmitFunction)(e);
        };
    };

    async function onSubmit(values: AddUserFormValues) {
        setIsSubmitting(true);
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (key === 'roles' && Array.isArray(value)) {
                value.forEach(role => formData.append('roles', role));
            } else if ((key === 'upiIds' || key === 'upiPhoneNumbers') && Array.isArray(value)) {
                value.forEach(item => item.value && formData.append(key, item.value));
            } else if (value instanceof File) {
                formData.append(key, value);
            } else if (value) {
                formData.append(key, String(value));
            }
        });

        const result = await handleAddUser(formData);

        if (result.success && result.user) {
            toast({ variant: "success", title: "User Created", description: `Successfully created user ${result.user.name}.` });
            if (onUserCreate) {
                onUserCreate(result.user);
            } else {
                router.push('/admin/user-management');
            }
        } else {
            toast({ variant: "destructive", title: "Error Creating User", description: result.error });
        }
        setIsSubmitting(false);
    }
    
    const beneficiaryUserConfig = settings?.userConfiguration?.Beneficiary || {};
    const isAadhaarMandatory = beneficiaryUserConfig.isAadhaarMandatory || false;
    const selectedState = watch("state");

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6 pt-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                    <FormField control={control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Enter user's full name" {...field} onChange={handleFullNameChange}/></FormControl><FormDescription>The fields below will be auto-populated from this.</FormDescription><FormMessage /></FormItem> )}/>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input type="text" placeholder="Enter your first name" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={control} name="middleName" render={({ field }) => ( <FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input type="text" placeholder="Enter your middle name" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input type="text" placeholder="Enter your last name" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                    <FormField control={control} name="fatherName" render={({ field }) => ( <FormItem><FormLabel>Father&apos;s Name (Optional)</FormLabel><FormControl><Input placeholder="Enter father's name" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={control} name="userId" render={({ field }) => ( <FormItem><FormLabel>User ID</FormLabel><FormControl><Input type="text" placeholder="Create a custom user ID" {...field} /></FormControl><AvailabilityFeedback state={userIdState} fieldName="User ID" onSuggestionClick={(s) => setValue('userId', s, { shouldValidate: true })} /><FormMessage /></FormItem> )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email Address (Optional)</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><AvailabilityFeedback state={emailState} fieldName="email" /><FormMessage /></FormItem> )}/>
                        <FormField control={control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="10-digit number" maxLength={10} {...field} /></FormControl><AvailabilityFeedback state={phoneState} fieldName="phone number" /><FormMessage /></FormItem> )}/>
                    </div>
                    <FormField control={control} name="gender" render={({ field }) => ( <FormItem className="space-y-3"><FormLabel>Gender</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem> )}/>
                </div>
                 {isSubForm ? null : (
                     <div className="flex items-center gap-4 mt-8">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Create User
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Clear Form
                        </Button>
                    </div>
                 )}
            </form>
        </FormProvider>
    )
}

export function AddUserForm(props: AddUserFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddUserFormContent {...props} />
        </Suspense>
    )
}
