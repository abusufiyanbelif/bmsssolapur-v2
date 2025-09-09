
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
import { handleAddUser } from "./actions";
import { useState, useEffect, Suspense, useCallback } from "react";
import { Loader2, CheckCircle, Trash2, PlusCircle, UserPlus, XCircle, X, Text, Bot } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { User, UserRole, AppSettings } from "@/services/types";
import { getUser, checkAvailability } from "@/services/user-service";
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from "@/hooks/use-debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getUserByPhone } from "@/services/user-service";


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

const createFormSchema = (isAadhaarMandatory: boolean) => z.object({
  userId: z.string().min(3, "User ID must be at least 3 characters."),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  fatherName: z.string().optional(),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),
  password: z.string().optional(),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
  createProfile: z.boolean().default(false),
  isAnonymousAsBeneficiary: z.boolean().default(false),
  isAnonymousAsDonor: z.boolean().default(false),
  gender: z.enum(["Male", "Female", "Other"]),
  beneficiaryType: z.enum(["Adult", "Old Age", "Kid", "Family", "Widow"]).optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  occupation: z.string().optional(),
  familyMembers: z.coerce.number().optional(),
  isWidow: z.boolean().default(false),
  panNumber: z.string().optional(),
  aadhaarNumber: isAadhaarMandatory
    ? z.string().regex(/^[0-9]{12}$/, "Aadhaar must be 12 digits.")
    : z.string().optional(),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  upiPhone: z.string().optional(),
  upiIds: z.array(z.object({ value: z.string() })).optional(),
});


type AddUserFormValues = z.infer<returnType<typeof createFormSchema>>;

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
    settings: AppSettings;
}


function AddUserFormContent({ settings }: AddUserFormProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);

  // Availability states
  const [userIdState, setUserIdState] = useState<AvailabilityState>(initialAvailabilityState);
  const [emailState, setEmailState] = useState<AvailabilityState>(initialAvailabilityState);
  const [phoneState, setPhoneState] = useState<AvailabilityState>(initialAvailabilityState);
  const [panState, setPanState] = useState<AvailabilityState>(initialAvailabilityState);
  const [aadhaarState, setAadhaarState] = useState<AvailabilityState>(initialAvailabilityState);
  const [bankAccountState, setBankAccountState] = useState<AvailabilityState>(initialAvailabilityState);
  const [upiIdStates, setUpiIdStates] = useState<Record<number, AvailabilityState>>({});
  const [scannedRawText, setScannedRawText] = useState<string | null>(null);
  
  const isAadhaarMandatory = settings.userConfiguration?.isAadhaarMandatory || false;
  const formSchema = createFormSchema(isAadhaarMandatory);

  useEffect(() => {
    const adminId = localStorage.getItem('userId');
    if (adminId) {
      getUser(adminId).then(setCurrentAdmin);
    }
    const rawTextParam = searchParams.get('rawText');
    if (rawTextParam) {
        setScannedRawText(decodeURIComponent(rawTextParam));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: "",
      lastName: "",
      fatherName: "",
      email: "",
      phone: "",
      userId: "",
      roles: ["Donor"],
      state: 'Maharashtra',
      city: 'Solapur',
      country: 'India',
      upiIds: [{ value: "" }],
      occupation: '',
      addressLine1: '',
      pincode: '',
      panNumber: '',
      aadhaarNumber: '',
      bankAccountName: '',
      bankName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      upiPhone: ''
    },
  });

   const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "upiIds"
  });
  
  const { watch, trigger, setValue, reset } = form;
  const selectedState = watch("state");

  const handleAvailabilityCheck = useCallback(async (field: string, value: string, setState: React.Dispatch<React.SetStateAction<AvailabilityState>>) => {
    if (!value) {
        setState(initialAvailabilityState);
        return;
    }
    setState({ isChecking: true, isAvailable: null });
    const result = await checkAvailability(field, value);
    setState({ isChecking: false, ...result });
  }, []);

  // Debounced values
  const debouncedUserId = useDebounce(watch('userId'), 500);
  const debouncedEmail = useDebounce(watch('email'), 500);
  const debouncedPhone = useDebounce(watch('phone'), 500);
  const debouncedPan = useDebounce(watch('panNumber'), 500);
  const debouncedAadhaar = useDebounce(watch('aadhaarNumber'), 500);
  const debouncedBankAccount = useDebounce(watch('bankAccountNumber'), 500);
  const debouncedUpiIds = useDebounce(watch('upiIds'), 500);

  // Effects for debounced checks
  useEffect(() => { if(debouncedUserId) handleAvailabilityCheck('userId', debouncedUserId, setUserIdState); }, [debouncedUserId, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedEmail) handleAvailabilityCheck('email', debouncedEmail || '', setEmailState); }, [debouncedEmail, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedPhone) handleAvailabilityCheck('phone', debouncedPhone, setPhoneState); }, [debouncedPhone, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedPan) handleAvailabilityCheck('panNumber', debouncedPan || '', setPanState); }, [debouncedPan, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedAadhaar) handleAvailabilityCheck('aadhaarNumber', debouncedAadhaar || '', setAadhaarState); }, [debouncedAadhaar, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedBankAccount) handleAvailabilityCheck('bankAccountNumber', debouncedBankAccount || '', setBankAccountState); }, [debouncedBankAccount, handleAvailabilityCheck]);

  useEffect(() => {
    debouncedUpiIds?.forEach((upi, index) => {
        if(upi.value) handleAvailabilityCheck('upiId', upi.value, (state) => setUpiIdStates(prev => ({...prev, [index]: state})));
    });
  }, [debouncedUpiIds, handleAvailabilityCheck]);


  useEffect(() => {
    const prefillFromScan = () => {
        const nameParam = searchParams.get('name');
        const phoneParam = searchParams.get('phone');
        const upiIdParam = searchParams.get('upiId');

        if (nameParam) {
            const nameParts = nameParam.split(' ');
            setValue('firstName', nameParts[0] || '');
            setValue('lastName', nameParts.slice(1).join(' ') || '');
        }
        if(phoneParam) setValue('phone', phoneParam);
        if(upiIdParam) setValue('upiIds', [{value: upiIdParam}]);
    }
    prefillFromScan();
  }, [searchParams, setValue]);

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
    
    // Final pre-submission check
    const checks = [
        checkAvailability('userId', values.userId),
        checkAvailability('email', values.email || ''),
        checkAvailability('phone', values.phone),
    ];
    const results = await Promise.all(checks);
    const isInvalid = results.some(r => !r.isAvailable);

    if (isInvalid) {
        toast({ variant: "destructive", title: "Duplicate Information", description: "Please correct the highlighted fields before submitting." });
        setIsSubmitting(false);
        return;
    }
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        if (key === 'upiIds' && Array.isArray(value)) {
          value.forEach(item => item.value && formData.append(key, item.value));
        } else if (typeof value !== 'object') {
          formData.append(key, String(value));
        }
      }
    });


    const result = await handleAddUser(formData);

    if (result.success && result.user) {
      toast({
        variant: "success",
        title: "User Created",
        description: `Successfully created user ${result.user.name}.`,
        icon: <CheckCircle />,
      });
      // If we came from a donation scan, redirect back with the new donorId
      const searchParamString = searchParams.toString();
      const redirectUrlParam = searchParams.get('redirect_url');
      
      if (redirectUrlParam) {
          const newParams = new URLSearchParams(searchParamString);
          newParams.set('donorId', result.user.id!);
          newParams.delete('redirect_url'); // Clean up the redirect param itself
          router.push(`${redirectUrlParam}?${newParams.toString()}`);
      } else {
        form.reset();
        setUserIdState(initialAvailabilityState);
        setEmailState(initialAvailabilityState);
        setPhoneState(initialAvailabilityState);
        setPanState(initialAvailabilityState);
        setAadhaarState(initialAvailabilityState);
        setBankAccountState(initialAvailabilityState);
        setUpiIdStates({});
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    reset();
    setUserIdState(initialAvailabilityState);
    setEmailState(initialAvailabilityState);
    setPhoneState(initialAvailabilityState);
    setPanState(initialAvailabilityState);
    setAadhaarState(initialAvailabilityState);
    setBankAccountState(initialAvailabilityState);
    setUpiIdStates({});
  };


  const availableRoles = currentAdmin?.roles.includes('Super Admin') ? allRoles : normalAdminRoles;
  
  const isAnyFieldChecking = userIdState.isChecking || emailState.isChecking || phoneState.isChecking || panState.isChecking || aadhaarState.isChecking || bankAccountState.isChecking || Object.values(upiIdStates).some(s => s.isChecking);
  const isAnyFieldInvalid = userIdState.isAvailable === false || emailState.isAvailable === false || phoneState.isAvailable === false || panState.isAvailable === false || aadhaarState.isAvailable === false || bankAccountState.isAvailable === false || Object.values(upiIdStates).some(s => s.isAvailable === false);


  return (
    <>
    {scannedRawText && (
        <div className="mb-6 space-y-2">
            <Label htmlFor="rawTextOutput" className="flex items-center gap-2 font-semibold text-base">
                <Text className="h-5 w-5 text-primary"/>
                Extracted Text from Screenshot
            </Label>
            <Textarea id="rawTextOutput" readOnly value={scannedRawText} rows={8} className="text-xs font-mono bg-muted" />
            <FormDescription>Review the text extracted from the screenshot to help fill out the form accurately.</FormDescription>
        </div>
    )}
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
                    <FormLabel>Middle Name</FormLabel>
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
            name="fatherName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Father&apos;s Name (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="Enter father's name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Create a custom user ID" {...field} />
              </FormControl>
              <AvailabilityFeedback state={userIdState} fieldName="User ID" onSuggestionClick={(s) => setValue('userId', s, { shouldValidate: true })} />
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
               <AvailabilityFeedback state={emailState} fieldName="email" />
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
              <AvailabilityFeedback state={phoneState} fieldName="phone number" />
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
                name="state"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); setValue('city', undefined); }} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {states.map(state => <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>City</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!selectedState}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a city" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {states.find(s => s.name === selectedState)?.cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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


        <h3 className="text-lg font-semibold border-b pb-2">Family &amp; Occupation</h3>
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


        <h3 className="text-lg font-semibold border-b pb-2">Account Settings &amp; Roles</h3>
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
                        If checked, their name will be hidden from public view and a system-generated ID will be used instead.
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
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Adult" /></FormControl><FormLabel className="font-normal">Adult</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Old Age" /></FormControl><FormLabel className="font-normal">Old Age</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Kid" /></FormControl><FormLabel className="font-normal">Kid</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Family" /></FormControl><FormLabel className="font-normal">Family</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}

        <h3 className="text-lg font-semibold border-b pb-2">Verification &amp; Payment Details</h3>
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
                 <AvailabilityFeedback state={panState} fieldName="PAN Number" />
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="aadhaarNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Aadhaar Number {isAadhaarMandatory && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                    <Input placeholder="Enter Aadhaar number" {...field} />
                </FormControl>
                <AvailabilityFeedback state={aadhaarState} fieldName="Aadhaar Number" />
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
                    <AvailabilityFeedback state={bankAccountState} fieldName="Bank Account" />
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
        <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bank Name (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="Enter bank name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
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
                   <AvailabilityFeedback state={upiIdStates[index] || initialAvailabilityState} fieldName="UPI ID" />
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
                Add another UPI ID
            </Button>
         </div>
        
        <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting || isAnyFieldChecking || isAnyFieldInvalid}>
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Creating User...' : 'Create User'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                <X className="mr-2 h-4 w-4" />
                Cancel
            </Button>
        </div>

      </form>
    </Form>
    </>
  );
}

export function AddUserForm(props: { settings: AppSettings }) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddUserFormContent {...props} />
        </Suspense>
    )
}
