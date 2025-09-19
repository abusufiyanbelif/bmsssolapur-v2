
// src/app/admin/user-management/add/add-user-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
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
import { handleAddUser, handleExtractUserDetailsFromText } from "./actions";
import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot, FileUp, ZoomIn, ZoomOut, FileIcon, ScanSearch, UserSearch, UserRoundPlus, XCircle, PlusCircle, Paperclip, RotateCw, RefreshCw as RefreshIcon, BookOpen, Sparkles, CreditCard, Fingerprint, MapPin, Trash2 } from "lucide-react";
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
  fullName: z.string().optional(),
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
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Please select a gender."}),
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
  upiPhoneNumbers: z.array(z.object({ value: z.string() })).optional(),
  upiIds: z.array(z.object({ value: z.string() })).optional(),
  aadhaarCard: z.any().optional(),
  addressProof: z.any().optional(),
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
    settings: AppSettings;
    isSubForm?: boolean;
    prefilledData?: ExtractBeneficiaryDetailsOutput;
    onUserCreate?: (user: User) => void;
}


function AddUserFormContent({ settings, isSubForm = false, prefilledData, onUserCreate }: AddUserFormProps) {
  const { toast } = useToast();
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
  
  // AI related state
  const [isTextExtracting, setIsTextExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [extractedDetails, setExtractedDetails] = useState<ExtractBeneficiaryDetailsOutput | null>(null);
  const [isRefreshingDetails, setIsRefreshingDetails] = useState(false);

  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const addressProofInputRef = useRef<HTMLInputElement>(null);

  
  const isAadhaarMandatory = settings?.userConfiguration?.Beneficiary?.isAadhaarMandatory || false;
  const formSchema = createFormSchema(isAadhaarMandatory);

  useEffect(() => {
    const adminId = localStorage.getItem('userId');
    if (adminId) {
      getUser(adminId).then(setCurrentAdmin);
    }
    
    if(prefilledData) {
        setExtractedDetails(prefilledData);
    }
  }, [prefilledData]);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      userId: "",
      fullName: "",
      firstName: "",
      middleName: "",
      lastName: "",
      fatherName: "",
      email: "",
      phone: "",
      password: "",
      roles: ["Donor"],
      createProfile: false,
      isAnonymousAsBeneficiary: false,
      isAnonymousAsDonor: false,
      gender: undefined,
      beneficiaryType: undefined,
      addressLine1: "",
      city: "Solapur",
      state: "Maharashtra",
      country: "India",
      pincode: "",
      occupation: "",
      familyMembers: 0,
      isWidow: false,
      panNumber: "",
      aadhaarNumber: "",
      bankAccountName: "",
      bankName: "",
      bankAccountNumber: "",
      bankIfscCode: "",
      upiPhoneNumbers: [{ value: "" }],
      upiIds: [{ value: "" }],
      aadhaarCard: null,
      addressProof: null,
    },
  });
  
  const handleCancel = () => {
    form.reset();
    setUserIdState(initialAvailabilityState);
    setEmailState(initialAvailabilityState);
    setPhoneState(initialAvailabilityState);
    setPanState(initialAvailabilityState);
    setAadhaarState(initialAvailabilityState);
    setBankAccountState(initialAvailabilityState);
    setUpiIdStates({});
    setRawText(null);
  };

  const { fields: upiIdFields, append: appendUpiId, remove: removeUpiId } = useFieldArray({
    control: form.control,
    name: "upiIds"
  });

   const { fields: upiPhoneFields, append: appendUpiPhone, remove: removeUpiPhone } = useFieldArray({
    control: form.control,
    name: "upiPhoneNumbers"
  });
  
  const { watch, trigger, setValue, reset } = form;
  const selectedState = watch("state");
  const selectedRoles = watch("roles");
  const selectedGender = watch("gender");
  const firstName = watch("firstName");
  const middleName = watch("middleName");
  const lastName = watch("lastName");
  const fullName = watch("fullName");

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFullName = e.target.value;
    setValue('fullName', newFullName, { shouldDirty: true });
    const nameParts = newFullName.split(' ').filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middleName = nameParts.slice(1, -1).join(' ');
    setValue('firstName', firstName, { shouldDirty: true });
    setValue('middleName', middleName, { shouldDirty: true });
    setValue('lastName', lastName, { shouldDirty: true });
  }

  useEffect(() => {
    const fullNameFromParts = `${firstName || ''} ${middleName || ''} ${lastName || ''}`.replace(/\s+/g, ' ').trim();
    if (fullNameFromParts !== fullName) {
        setValue('fullName', fullNameFromParts, { shouldDirty: true });
    }
  }, [firstName, middleName, lastName, fullName, setValue]);


  useEffect(() => {
    if (firstName && lastName) {
        const generatedUserId = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '');
        if (!form.formState.dirtyFields.userId) {
            form.setValue('userId', generatedUserId);
        }
    }
  }, [firstName, lastName, form]);

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


  const handleGetTextFromDocuments = async () => {
    const filesToScan: File[] = [];
    const aadhaarFile = form.getValues("aadhaarCard");
    const addressFile = form.getValues("addressProof");
    if(aadhaarFile) filesToScan.push(aadhaarFile);
    if(addressFile) filesToScan.push(addressFile);

    if (filesToScan.length === 0) {
      toast({ variant: 'destructive', title: 'No Files', description: 'Please upload at least one document to scan.' });
      return;
    }

    setIsTextExtracting(true);
    const formData = new FormData();
    filesToScan.forEach(file => formData.append("imageFiles", file));

    try {
      const result = await getRawTextFromImage(formData);
      if (result.success && result.rawText) {
        setRawText(result.rawText);
        toast({ variant: 'success', title: 'Text Extracted', description: 'Raw text is available. Click "Fetch User Data" to analyze.' });
      } else {
        toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract any text.' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred during text extraction." });
    } finally {
      setIsTextExtracting(false);
    }
  };
  
    const handleFetchUserData = async (isRefresh = false) => {
        if (!rawText) return;
        
        const loadingSetter = isRefresh ? setIsRefreshingDetails : setIsAnalyzing;
        loadingSetter(true);
        
        let missingFields: (keyof ExtractBeneficiaryDetailsOutput)[] = [];
        if (isRefresh && extractedDetails) {
            missingFields = Object.keys(extractedDetails).filter(key => !extractedDetails[key as keyof ExtractBeneficiaryDetailsOutput]) as (keyof ExtractBeneficiaryDetailsOutput)[];
        }

        const result = await handleExtractUserDetailsFromText(rawText, missingFields.length > 0 ? missingFields : undefined);

        if (result.success && result.details) {
             if (isRefresh && extractedDetails) {
                // Merge new results with existing ones
                const mergedDetails = { ...extractedDetails, ...result.details };
                setExtractedDetails(mergedDetails);
                toast({ variant: 'success', title: 'Refresh Complete', description: 'AI tried to find the missing details.' });
            } else {
                setExtractedDetails(result.details);
            }
        } else {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
        }
        loadingSetter(false);
    };

    const applyExtractedDetails = () => {
        if (!extractedDetails) return;
        const details = extractedDetails;
        Object.entries(details).forEach(([key, value]) => {
            if (value) {
                switch(key) {
                    case 'beneficiaryFullName': setValue('fullName', value, { shouldDirty: true }); break;
                    case 'beneficiaryFirstName': setValue('firstName', value, { shouldDirty: true }); break;
                    case 'beneficiaryMiddleName': setValue('middleName', value, { shouldDirty: true }); break;
                    case 'beneficiaryLastName': setValue('lastName', value, { shouldDirty: true }); break;
                    case 'fatherName': setValue('fatherName', value, { shouldDirty: true }); break;
                    case 'beneficiaryPhone': setValue('phone', value.replace(/\D/g, '').slice(-10), { shouldDirty: true, shouldValidate: true }); break;
                    case 'aadhaarNumber': setValue('aadhaarNumber', value.replace(/\D/g,''), { shouldDirty: true, shouldValidate: true }); break;
                    case 'address': setValue('addressLine1', value, { shouldDirty: true }); break;
                    case 'city': setValue('city', value, { shouldDirty: true }); break;
                    case 'pincode': setValue('pincode', value, { shouldDirty: true }); break;
                    case 'country': setValue('country', value, { shouldDirty: true }); break;
                    case 'gender':
                        const genderValue = value as 'Male' | 'Female' | 'Other';
                        if (['Male', 'Female', 'Other'].includes(genderValue)) {
                            setValue('gender', genderValue, { shouldDirty: true });
                        }
                        break;
                }
            }
        });
        toast({ variant: 'success', title: 'Auto-fill Complete', description: 'User details have been populated. Please review.' });
        setExtractedDetails(null);
    }
    
    const dialogFields: { key: keyof ExtractBeneficiaryDetailsOutput; label: string }[] = [
        { key: 'beneficiaryFullName', label: 'Full Name' },
        { key: 'fatherName', label: "Father's Name" },
        { key: 'dateOfBirth', label: 'Date of Birth' },
        { key: 'gender', label: 'Gender' },
        { key: 'beneficiaryPhone', label: 'Phone' },
        { key: 'aadhaarNumber', label: 'Aadhaar Number' },
        { key: 'address', label: 'Address' },
        { key: 'city', label: 'City' },
        { key: 'pincode', label: 'Pincode' },
        { key: 'country', label: 'Country' },
    ];


  async function onSubmit(values: AddUserFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'roles' && Array.isArray(value)) {
        value.forEach(role => formData.append('roles', role));
      } else if (key === 'upiIds' && Array.isArray(value)) {
        value.forEach(item => item.value && formData.append('upiIds', item.value));
      } else if (key === 'upiPhoneNumbers' && Array.isArray(value)) {
        value.forEach(item => item.value && formData.append('upiPhoneNumbers', item.value));
      } else if (typeof value === 'boolean') {
        if(value) formData.append(key, 'on');
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (value) {
        formData.append(key, String(value));
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
      
      if (onUserCreate) {
          onUserCreate(result.user);
      } else {
        const redirectUrlParam = new URLSearchParams(window.location.search).get('redirect_url');
        if (redirectUrlParam) {
            const newParams = new URLSearchParams(window.location.search);
            newParams.set('donorId', result.user.id!);
            newParams.delete('redirect_url');
            router.push(`${redirectUrlParam}?${newParams.toString()}`);
        } else {
            handleCancel();
        }
      }

    } else {
      toast({
        variant: "destructive",
        title: "Error Creating User",
        description: result.error || "An unknown error occurred. Please check the form and try again.",
      });
    }
     setIsSubmitting(false);
  }
  
  const availableRoles = currentAdmin?.roles.includes('Super Admin') ? allRoles : normalAdminRoles;
  
  const isAnyFieldChecking = userIdState.isChecking || emailState.isChecking || phoneState.isChecking || panState.isChecking || aadhaarState.isChecking || bankAccountState.isChecking || Object.values(upiIdStates).some(s => s.isChecking);
  const isAnyFieldInvalid = userIdState.isAvailable === false || emailState.isAvailable === false || phoneState.isAvailable === false || panState.isAvailable === false || aadhaarState.isAvailable === false || bankAccountState.isAvailable === false || Object.values(upiIdStates).some(s => s.isAvailable === false);


  return (
    <>
      <Form {...form}>
        <form className="space-y-6 pt-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="scan-docs">
                    <AccordionTrigger>
                        <div className="flex items-center gap-2 text-primary">
                            <ScanSearch className="h-5 w-5" />
                            Scan ID Card (Optional)
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Upload an Aadhaar card or other ID to auto-fill the user&apos;s details.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="aadhaarCard" render={({ field }) => ( <FormItem><FormLabel>Aadhaar Card</FormLabel><FormControl><Input type="file" ref={aadhaarInputRef} onChange={(e) => field.onChange(e.target.files?.[0])} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="addressProof" render={({ field }) => ( <FormItem><FormLabel>Address Proof</FormLabel><FormControl><Input type="file" ref={addressProofInputRef} onChange={(e) => field.onChange(e.target.files?.[0])} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="button" variant="outline" className="w-full" onClick={handleGetTextFromDocuments} disabled={isTextExtracting}>
                                    {isTextExtracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Text className="mr-2 h-4 w-4" />}
                                    Get Text from Documents
                                </Button>
                                <Button type="button" className="w-full" onClick={() => handleFetchUserData()} disabled={!rawText || isAnalyzing}>
                                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                                    Fetch User Data
                                </Button>
                            </div>
                            {rawText && (
                                <div className="space-y-2 pt-4">
                                    <Label>Extracted Text</Label>
                                    <Textarea value={rawText} readOnly rows={8} className="text-xs font-mono bg-background" />
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter user's full name" {...field} onChange={handleFullNameChange}/>
                    </FormControl>
                    <FormDescription>The fields below will be auto-populated from this.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
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
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4 pt-2">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem>
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
                        <Input placeholder="Enter 12-digit Aadhaar number" {...field} />
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
            <div className="space-y-4">
                <FormLabel>UPI Phone Numbers (Optional)</FormLabel>
                <FormDescription>Add one or more UPI-linked phone numbers.</FormDescription>
                {upiPhoneFields.map((field, index) => (
                <FormField
                control={form.control}
                key={field.id}
                name={`upiPhoneNumbers.${index}.value`}
                render={({ field }) => (
                    <FormItem>
                    <div className="flex items-center gap-2">
                        <FormControl>
                        <Input {...field} type="tel" maxLength={10} placeholder="10-digit UPI linked phone" />
                        </FormControl>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeUpiPhone(index)}>
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
                    onClick={() => appendUpiPhone({ value: "" })}
                >
                    <PlusCircle className="mr-2" />
                    Add Phone Number
                </Button>
            </div>
            <div className="space-y-4">
                <FormLabel>UPI IDs (Optional)</FormLabel>
                <FormDescription>Add one or more UPI IDs for this user to help with automatic donor detection.</FormDescription>
                {upiIdFields.map((field, index) => (
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeUpiId(index)}>
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
                    onClick={() => appendUpiId({ value: "" })}
                >
                    <PlusCircle className="mr-2" />
                    Add UPI ID
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
                {!isSubForm && (
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Clear Form
                    </Button>
                )}
            </div>
        </form>
    </Form>
    <AlertDialog open={!!extractedDetails} onOpenChange={() => setExtractedDetails(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                       <Bot className="h-6 w-6 text-primary" />
                        Confirm Auto-fill Details
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        The AI has extracted the following details from the document. Please review them before applying to the form.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-80 overflow-y-auto p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                    {dialogFields.map(({ key, label }) => {
                        const value = extractedDetails?.[key as keyof ExtractBeneficiaryDetailsOutput] as string | undefined;
                        return (
                            <div key={key} className="flex justify-between border-b pb-1">
                                <span className="text-muted-foreground capitalize">{label}</span>
                                {value ? (
                                     <span className="font-semibold text-right">{value}</span>
                                ) : (
                                    <span className="text-destructive font-normal text-right">Not Found</span>
                                )}
                            </div>
                        )
                    })}
                </div>
                <AlertDialogFooter>
                     <Button variant="outline" onClick={() => handleFetchUserData(true)} disabled={isRefreshingDetails}>
                        {isRefreshingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshIcon className="mr-2 h-4 w-4" />}
                        Refresh
                    </Button>
                    <div className='flex gap-2'>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={applyExtractedDetails}>Apply & Fill Form</AlertDialogAction>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

export function AddUserForm(props: AddUserFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddUserFormContent {...props} />
        </Suspense>
    )
}
