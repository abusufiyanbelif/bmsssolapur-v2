// src/app/admin/leads/add/add-lead-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { handleAddLead, handleExtractLeadDetailsFromText } from "./actions";
import { useState, useEffect, useRef, useMemo, Suspense, useCallback } from "react";
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot, FileUp, ZoomIn, ZoomOut, FileIcon, ScanSearch, UserSearch, UserRoundPlus, XCircle, PlusCircle, Paperclip } from "lucide-react";
import type { User, LeadPurpose, Campaign, Lead, DonationType, LeadPriority, AppSettings, PurposeCategory } from "@/services/types";
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


const leadPriorities: LeadPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
const donationTypes: Exclude<DonationType, 'Split' | 'Any'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Interest'];


const createFormSchema = (isAadhaarMandatory: boolean) => z.object({
  beneficiaryType: z.enum(['existing', 'new']).default('existing'),
  beneficiaryId: z.string().optional(),
  
  // New beneficiary fields
  newBeneficiaryFirstName: z.string().optional(),
  newBeneficiaryMiddleName: z.string().optional(),
  newBeneficiaryLastName: z.string().optional(),
  newBeneficiaryFullName: z.string().optional(),
  newBeneficiaryFatherName: z.string().optional(),
  newBeneficiaryPhone: z.string().optional(),
  newBeneficiaryEmail: z.string().email().optional().or(z.literal('')),
  newBeneficiaryAadhaar: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  aadhaarCard: z.any().optional(),
  addressProof: z.any().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  
  hasReferral: z.boolean().default(false),
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  referredByUserId: z.string().optional(),
  referredByUserName: z.string().optional(),
  headline: z.string().min(10, "Headline must be at least 10 characters.").max(100, "Headline cannot exceed 100 characters.").optional().or(z.literal('')),
  story: z.string().optional(),
  diseaseIdentified: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required."),
  otherPurposeDetail: z.string().optional(),
  category: z.string().min(1, "Category is required."),
  otherCategoryDetail: z.string().optional(),
  degree: z.string().optional(),
  year: z.string().optional(),
  priority: z.enum(leadPriorities),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  dueDate: z.date().optional(),
  isLoan: z.boolean().default(false),
  caseDetails: z.string().optional(),
  otherDocuments: z.array(z.instanceof(File)).optional(),
})
.refine(data => {
    if (data.purpose === 'Other') {
        return !!data.otherPurposeDetail && data.otherPurposeDetail.length > 0;
    }
    return true;
}, {
    message: "Please specify details for the 'Other' purpose.",
    path: ["otherPurposeDetail"],
})
.refine(data => {
    // This logic might need refinement depending on how categories are structured per purpose
    if (data.category === 'Other') {
        return !!data.otherCategoryDetail && data.otherCategoryDetail.length > 0;
    }
    return true;
}, {
    message: "Please specify details for the 'Other' category.",
    path: ["otherCategoryDetail"],
})
.refine(data => {
    if (data.beneficiaryType === 'existing') {
        return !!data.beneficiaryId && data.beneficiaryId.trim() !== '';
    }
    if (data.beneficiaryType === 'new') {
        return !!data.newBeneficiaryFirstName && !!data.newBeneficiaryLastName && !!data.newBeneficiaryPhone;
    }
    return false; // Should be either 'existing' or 'new'
}, {
    message: "Please either select an existing beneficiary or fill out the details for a new one.",
    path: ["beneficiaryId"], // Report error on the most likely field
});


type AddLeadFormValues = z.infer<returnType<typeof createFormSchema>>;

interface AddLeadFormProps {
  users: User[];
  campaigns: Campaign[];
  settings: AppSettings;
}

function AddLeadFormContent({ users, campaigns, settings }: AddLeadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Lead[] | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [referralPopoverOpen, setReferralPopoverOpen] = useState(false);
  const [selectedReferralDetails, setSelectedReferralDetails] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // AI related state for Case Documents
  const [isCaseTextExtracting, setIsCaseTextExtracting] = useState(false);
  const [isCaseAnalyzing, setIsCaseAnalyzing] = useState(false);
  const [caseRawText, setCaseRawText] = useState<string | null>(null);
  
  // AI related state for Beneficiary Documents
  const [isBeneficiaryTextExtracting, setIsBeneficiaryTextExtracting] = useState(false);
  const [isBeneficiaryAnalyzing, setIsBeneficiaryAnalyzing] = useState(false);
  const [beneficiaryRawText, setBeneficiaryRawText] = useState<string | null>(null);

  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [addressProofPreview, setAddressProofPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);


  const potentialBeneficiaries = users.filter(u => u.roles.includes("Beneficiary"));
  const potentialReferrals = users.filter(u => u.roles.includes("Referral"));
  
  const leadConfiguration = settings.leadConfiguration || {};
  const approvalProcessDisabled = leadConfiguration.approvalProcessDisabled || false;
  
  const leadPurposes = useMemo(() => 
    (leadConfiguration.purposes || []).filter(p => p.enabled)
  , [leadConfiguration.purposes]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
        const admin = users.find(u => u.id === storedUserId);
        setAdminUser(admin || null);
    }
  }, [users]);
  
  const userHasOverridePermission = adminUser?.roles.includes('Super Admin');
  const isFormDisabled = approvalProcessDisabled && !userHasOverridePermission;


  const isAadhaarMandatory = settings.userConfiguration?.isAadhaarMandatory || false;
  const formSchema = createFormSchema(isAadhaarMandatory);

  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      beneficiaryType: 'existing',
      beneficiaryId: '',
      newBeneficiaryFirstName: '',
      newBeneficiaryMiddleName: '',
      newBeneficiaryLastName: '',
      newBeneficiaryFullName: '',
      newBeneficiaryFatherName: '',
      newBeneficiaryPhone: '',
      newBeneficiaryEmail: '',
      newBeneficiaryAadhaar: '',
      addressLine1: '',
      city: 'Solapur',
      state: 'Maharashtra',
      pincode: '',
      hasReferral: false,
      referredByUserId: '',
      referredByUserName: '',
      campaignId: 'none',
      campaignName: '',
      headline: '',
      story: '',
      diseaseIdentified: '',
      purpose: '',
      otherPurposeDetail: '',
      category: '',
      otherCategoryDetail: '',
      priority: 'Medium',
      acceptableDonationTypes: [],
      helpRequested: 0,
      dueDate: undefined,
      isLoan: false,
      caseDetails: '',
      otherDocuments: [],
    },
  });
  
  const handleCancel = () => {
    form.reset();
      setSelectedReferralDetails(null);
      setCaseRawText("");
      setBeneficiaryRawText("");
      setAadhaarPreview(null);
      setAddressProofPreview(null);
  };

  const { formState: { isValid }, setValue, watch, getValues, control, trigger } = form;
  const selectedPurposeName = watch("purpose");
  const selectedCategory = watch("category");
  const selectedDegree = watch("degree");
  const beneficiaryType = watch("beneficiaryType");
  const hasReferral = watch("hasReferral");
  const newBeneficiaryFirstName = watch("newBeneficiaryFirstName");
  const newBeneficiaryMiddleName = watch("newBeneficiaryMiddleName");
  const newBeneficiaryLastName = watch("newBeneficiaryLastName");
  
  useEffect(() => {
    const fullName = `${newBeneficiaryFirstName || ''} ${newBeneficiaryMiddleName || ''} ${newBeneficiaryLastName || ''}`.replace(/\s+/g, ' ').trim();
    setValue('newBeneficiaryFullName', fullName, { shouldDirty: true });
  }, [newBeneficiaryFirstName, newBeneficiaryMiddleName, newBeneficiaryLastName, setValue]);

  const availableCategories = useMemo(() => {
      if (!selectedPurposeName) return [];
      const purpose = leadPurposes.find(p => p.name === selectedPurposeName);
      return (purpose?.categories || []).filter(c => c.enabled);
  }, [selectedPurposeName, leadPurposes]);


  useEffect(() => {
    if (selectedPurposeName === 'Loan') {
        form.setValue('isLoan', true, { shouldDirty: true });
    } else {
        form.setValue('isLoan', false, { shouldDirty: true });
    }
  }, [selectedPurposeName, form]);
    
    
    const handleGetTextFromImage = async (filesToScan: File[], textSetter: React.Dispatch<React.SetStateAction<string | null>>, loadingSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
        if (filesToScan.length === 0) {
            toast({ variant: 'destructive', title: 'No Files', description: 'Please upload at least one document to scan.' });
            return;
        }
        loadingSetter(true);
        const formData = new FormData();
        filesToScan.forEach(file => {
          if (file) {
            formData.append("imageFiles", file as Blob)
          }
        });

        try {
            const result = await getRawTextFromImage(formData);
            if (result.success && result.rawText) {
                textSetter(result.rawText);
                toast({ variant: 'success', title: 'Text Extracted', description: 'Raw text is available for auto-fill.' });
            } else {
                 toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract any text from the documents.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred during text extraction." });
        } finally {
            loadingSetter(false);
        }
    };
    
    const handleAutoFillFromText = async (textToAnalyze: string | null, section: 'case' | 'beneficiary') => {
        if (!textToAnalyze) {
             toast({ variant: 'destructive', title: 'No Text', description: 'Please extract text from documents first.' });
            return;
        }
        const loadingSetter = section === 'case' ? setIsCaseAnalyzing : setIsBeneficiaryAnalyzing;
        loadingSetter(true);

         const analysisResult = await handleExtractLeadDetailsFromText(textToAnalyze);
            
        if (analysisResult.success && analysisResult.details) {
            const details = analysisResult.details;
            
            if (section === 'case') {
                if (details.headline) setValue('headline', details.headline, { shouldDirty: true });
                if (details.story) setValue('story', details.story, { shouldDirty: true });
                if (details.diseaseIdentified) setValue('diseaseIdentified', details.diseaseIdentified, { shouldDirty: true });
                if (details.purpose) {
                    const matchingPurpose = leadPurposes.find(p => p.name.toLowerCase() === details.purpose?.toLowerCase());
                    if (matchingPurpose) setValue('purpose', matchingPurpose.name, { shouldDirty: true });
                }
                if (details.category) setValue('category', details.category, { shouldDirty: true });
                if (details.amount) setValue('helpRequested', details.amount, { shouldDirty: true });
                if (details.dueDate) setValue('dueDate', new Date(details.dueDate), { shouldDirty: true });
                if (details.acceptableDonationTypes) setValue('acceptableDonationTypes', details.acceptableDonationTypes, { shouldDirty: true });
                if (details.caseDetails) setValue('caseDetails', details.caseDetails, { shouldDirty: true });
            } else { // beneficiary section
                if (details.beneficiaryFirstName) setValue('newBeneficiaryFirstName', details.beneficiaryFirstName, { shouldDirty: true });
                if (details.beneficiaryMiddleName) setValue('newBeneficiaryMiddleName', details.beneficiaryMiddleName, { shouldDirty: true });
                if (details.beneficiaryLastName) setValue('newBeneficiaryLastName', details.beneficiaryLastName, { shouldDirty: true });
                if (details.fatherName) setValue('newBeneficiaryFatherName', details.fatherName, { shouldDirty: true });
                if (details.beneficiaryPhone) {
                    const phone = details.beneficiaryPhone.replace(/\D/g, '').slice(-10);
                    setValue('newBeneficiaryPhone', phone, { shouldDirty: true, shouldValidate: true });
                }
                if (details.aadhaarNumber) setValue('newBeneficiaryAadhaar', details.aadhaarNumber.replace(/\D/g,''), { shouldDirty: true, shouldValidate: true });
                if (details.address) setValue('addressLine1', details.address, { shouldDirty: true });
                
                 if (details.dateOfBirth) {
                    // AI might return DD/MM/YYYY or YYYY-MM-DD, try to parse both
                    const parts = details.dateOfBirth.split(/[\/\-]/);
                    let date: Date | null = null;
                    if(parts.length === 3) {
                        if (parts[2].length === 4) { // DD/MM/YYYY
                            date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                        } else if (parts[0].length === 4) { // YYYY-MM-DD
                            date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                        }
                    }
                     if (date && !isNaN(date.getTime())) {
                        setValue('dateOfBirth', date, { shouldDirty: true });
                    }
                }
                 if (details.gender) {
                    const gender = details.gender as 'Male' | 'Female' | 'Other';
                    if (['Male', 'Female', 'Other'].includes(gender)) {
                         setValue('gender', gender, { shouldDirty: true });
                    }
                }
            }
            
            toast({ variant: 'success', title: 'Auto-fill Complete', description: `The ${section} fields have been populated. Please review.` });
        } else {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: analysisResult.error || "Could not extract structured details from text." });
        }
        loadingSetter(false);
    }

   const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom(prevZoom => Math.max(0.5, Math.min(prevZoom - e.deltaY * 0.001, 5)));
  };


  async function onSubmit(values: AddLeadFormValues, forceCreate: boolean = false) {
    if (!adminUser?.id) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not identify the admin performing the update. Please log out and back in.",
        });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("adminUserId", adminUser.id);
    // Append all form values
    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (key === 'otherDocuments') {
          value.forEach(file => formData.append('otherDocuments', file));
        } else {
          value.forEach(v => formData.append(key, v));
        }
      } else if (value instanceof File) {
         formData.append(key, value);
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value) {
        formData.append(key, String(value));
      }
    });


    if (forceCreate) {
        formData.append("forceCreate", "true");
    }
    
    const result = await handleAddLead(formData);

    setIsSubmitting(false);
    
    if (result.duplicateLeadWarning) {
        setDuplicateWarning(result.duplicateLeadWarning);
        return;
    }

    if (result.success && result.lead) {
      toast({
        title: "Lead Created",
        description: `Successfully created lead for ${result.lead.name}.`,
      });
      handleCancel();
    } else {
      toast({
        variant: "destructive",
        title: "Error Creating Lead",
        description: result.error || "An unknown error occurred. Please check the form and try again.",
      });
    }
  }
  
    const showEducationFields = selectedPurposeName === 'Education' && (selectedCategory === 'College Fees' || selectedCategory === 'School Fees');
    const showYearField = showEducationFields && selectedDegree && !['SSC'].includes(selectedDegree);
    const yearOptions = useMemo(() => {
        if (selectedCategory === 'School Fees') return leadConfiguration.schoolYearOptions || [];
        if (selectedCategory === 'College Fees') return leadConfiguration.collegeYearOptions || [];
        return [];
    }, [selectedCategory, leadConfiguration]);


  return (
    <>
        {isFormDisabled && (
            <Alert variant="destructive" className="mb-6">
                <Lock className="h-4 w-4" />
                <AlertTitle>Lead Creation Disabled</AlertTitle>
                <AlertDescription>
                    The lead approval process is currently disabled. Only users with override permissions can create new leads.
                </AlertDescription>
            </Alert>
        )}

        <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => onSubmit(values, false))} className="space-y-6 max-w-2xl">
            <fieldset disabled={isFormDisabled} className="space-y-6">
                 <h3 className="text-lg font-semibold border-b pb-2">Beneficiary Details</h3>
                <FormField
                    control={form.control}
                    name="beneficiaryType"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 gap-4"
                        >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Button type="button" variant={field.value === 'existing' ? 'default' : 'outline'} className="w-full h-20 flex-col gap-2" onClick={() => field.onChange('existing')}>
                                        <UserSearch className="h-6 w-6"/>
                                        <span>Search Existing</span>
                                    </Button>
                                </FormControl>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                     <Button type="button" variant={field.value === 'new' ? 'default' : 'outline'} className="w-full h-20 flex-col gap-2" onClick={() => field.onChange('new')}>
                                        <UserRoundPlus className="h-6 w-6"/>
                                        <span>Create New</span>
                                    </Button>
                                </FormControl>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                {beneficiaryType === 'existing' ? (
                     <FormField
                        control={form.control}
                        name="beneficiaryId"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Select Beneficiary</FormLabel>
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground" )}
                                >
                                {field.value
                                    ? potentialBeneficiaries.find(
                                        (user) => user.id === field.value
                                    )?.name
                                    : "Search by name, phone, Aadhaar..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search by name, phone, Aadhaar, PAN, UPI..." />
                                <CommandList>
                                    <CommandEmpty>No beneficiaries found.</CommandEmpty>
                                    <CommandGroup>
                                    {potentialBeneficiaries.map((user) => (
                                        <CommandItem
                                        value={`${user.name} ${user.phone} ${user.aadhaarNumber} ${user.panNumber} ${user.upiIds?.join(' ')}`}
                                        key={user.id}
                                        onSelect={() => {
                                            form.setValue("beneficiaryId", user.id!);
                                            setPopoverOpen(false);
                                        }}
                                        >
                                        <Check className={cn("mr-2 h-4 w-4", user.id === field.value ? "opacity-100" : "opacity-0")} />
                                        {user.name} ({user.phone})
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                     <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-medium">New Beneficiary Details</h3>
                         <div className="space-y-4">
                             <Label>Identity Documents (Aadhaar, Address Proof)</Label>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="aadhaarCard" render={({ field }) => ( <FormItem><FormLabel>Aadhaar Card</FormLabel><FormControl><Input type="file" onChange={e => { field.onChange(e.target.files?.[0]); setAadhaarPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null); }} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="addressProof" render={({ field }) => ( <FormItem><FormLabel>Address Proof</FormLabel><FormControl><Input type="file" onChange={e => { field.onChange(e.target.files?.[0]); setAddressProofPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null); }} /></FormControl><FormMessage /></FormItem> )} />
                             </div>
                             {(aadhaarPreview || addressProofPreview) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {aadhaarPreview && (
                                        <div className="relative group flex-1">
                                            <div onWheel={handleWheel} className="relative w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto cursor-zoom-in">
                                                <Image src={aadhaarPreview} alt="Aadhaar Preview" width={200*zoom} height={120*zoom} className="object-contain transition-transform" style={{transform: `scale(${zoom})`}}/>
                                            </div>
                                            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-0.5 rounded-md">
                                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => z * 1.2)}><ZoomIn className="h-3 w-3"/></Button>
                                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => Math.max(0.5, z / 1.2))}><ZoomOut className="h-3 w-3"/></Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAadhaarPreview(null)}><XCircle className="h-3 w-3 text-destructive"/></Button>
                                            </div>
                                        </div>
                                    )}
                                    {addressProofPreview && (
                                        <div className="relative group flex-1">
                                            <div onWheel={handleWheel} className="relative w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto cursor-zoom-in">
                                                <Image src={addressProofPreview} alt="Address Proof Preview" width={200*zoom} height={120*zoom} className="object-contain transition-transform" style={{transform: `scale(${zoom})`}}/>
                                            </div>
                                            <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-0.5 rounded-md">
                                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => z * 1.2)}><ZoomIn className="h-3 w-3"/></Button>
                                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => Math.max(0.5, z / 1.2))}><ZoomOut className="h-3 w-3"/></Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddressProofPreview(null)}><XCircle className="h-3 w-3 text-destructive"/></Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                             <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={isBeneficiaryTextExtracting || isBeneficiaryAnalyzing}
                                onClick={() => handleGetTextFromImage([getValues('aadhaarCard'), getValues('addressProof')].filter(f => f) as File[], setBeneficiaryRawText, setIsBeneficiaryTextExtracting)}
                            >
                                {isBeneficiaryTextExtracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Text className="mr-2 h-4 w-4" />}
                                Get beneficiary details from Adhaar
                            </Button>
                            {beneficiaryRawText && (
                                <>
                                    <Textarea value={beneficiaryRawText} readOnly rows={5} className="text-xs font-mono bg-background" />
                                    <Button type="button" className="w-full" onClick={() => handleAutoFillFromText(beneficiaryRawText, 'beneficiary')} disabled={isBeneficiaryAnalyzing}>
                                        {isBeneficiaryAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                                        Auto-fill Beneficiary Details
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="newBeneficiaryFirstName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl><Input placeholder="First Name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="newBeneficiaryMiddleName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Middle Name</FormLabel>
                                    <FormControl><Input placeholder="Middle Name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="newBeneficiaryLastName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl><Input placeholder="Last Name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="space-y-2">
                             <Label>Full Name</Label>
                             <FormField control={form.control} name="newBeneficiaryFullName" render={({ field }) => (<FormControl><Input readOnly {...field} className="bg-muted" /></FormControl>)} />
                        </div>
                        <FormField control={form.control} name="newBeneficiaryFatherName" render={({ field }) => (<FormItem><FormLabel>Father&apos;s Name</FormLabel><FormControl><Input placeholder="Father's Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="newBeneficiaryPhone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input type="tel" maxLength={10} placeholder="Enter 10-digit phone number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newBeneficiaryEmail"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="beneficiary@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="newBeneficiaryAadhaar"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Aadhaar Number {isAadhaarMandatory && <span className="text-destructive">*</span>}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter 12-digit Aadhaar number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full text-left font-normal",!field.value&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value?format(field.value,"PPP"):"Pick a date"}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear()} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><RadioGroup onValueChange={(v) => setValue('gender', v as 'Male' | 'Female' | 'Other')} value={field.value} className="flex space-x-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Male"/></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Female"/></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem></RadioGroup><FormMessage /></FormItem>)} />
                        <h4 className="font-medium pt-2">Address</h4>
                        <FormField control={form.control} name="addressLine1" render={({field}) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="city" render={({field}) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="state" render={({field}) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="pincode" render={({field}) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>
                )}
                 
                 <h3 className="text-lg font-semibold border-b pb-2">Case Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Lead Purpose</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('category', '');
                                form.setValue('otherCategoryDetail', '');
                                form.setValue('otherPurposeDetail', '');
                            }} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a purpose" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {leadPurposes.map(purpose => (
                                    <SelectItem key={purpose.id} value={purpose.name}>{purpose.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>The main reason for the help request.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    {selectedPurposeName && selectedPurposeName !== 'Other' && (
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {(availableCategories || []).map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                     <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {leadPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2 text-primary">
                                <ScanSearch className="h-5 w-5" />
                                Scan Case Documents (Medical Bills, etc.)
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                             <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Upload case-specific documents like medical reports or fee receipts. The AI will scan them to help you fill out the case details, headline, and story.</p>
                                <FormField
                                    control={form.control}
                                    name="otherDocuments"
                                    render={({ field: { onChange } }) => (
                                        <FormItem>
                                            <FormLabel>Case Documents</FormLabel>
                                            <FormControl>
                                                <Input type="file" multiple onChange={(e) => onChange(Array.from(e.target.files || []))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => handleGetTextFromImage(getValues('otherDocuments') || [], setCaseRawText, setIsCaseTextExtracting)} disabled={isCaseTextExtracting}>
                                        {isCaseTextExtracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Text className="mr-2 h-4 w-4" />}
                                        Get Text from Documents
                                    </Button>
                                    <Button type="button" className="w-full" onClick={() => handleAutoFillFromText(caseRawText, 'case')} disabled={!caseRawText || isCaseAnalyzing}>
                                        {isCaseAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                                        Auto-fill from Text
                                    </Button>
                                </div>
                                {caseRawText && (
                                    <div className="space-y-2 pt-4">
                                        <Label>Extracted Text</Label>
                                        <Textarea value={caseRawText} readOnly rows={8} className="text-xs font-mono bg-background" />
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <FormField control={form.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input placeholder="Short, public summary of the case" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="story" render={({ field }) => (<FormItem><FormLabel>Story</FormLabel><FormControl><Textarea placeholder="Detailed narrative for public display" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="caseDetails" render={({ field }) => (<FormItem><FormLabel>Internal Case Notes</FormLabel><FormControl><Textarea placeholder="Admin-only notes and summary" {...field} /></FormControl><FormMessage /></FormItem>)} />

                <h3 className="text-lg font-semibold border-b pb-2">Financials</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="helpRequested" render={({ field }) => (<FormItem><FormLabel>Amount Requested</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem><FormLabel>Due Date (Optional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full text-left font-normal",!field.value&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value?format(field.value,"PPP"):"Pick a date"}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                </div>
                 <FormField
                    control={form.control}
                    name="isLoan"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                This is a repayable loan
                            </FormLabel>
                        </div>
                        </FormItem>
                    )}
                    />
                <FormField
                  control={form.control}
                  name="acceptableDonationTypes"
                  render={() => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">Acceptable Donation Types</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {donationTypes.map((type) => (
                          <FormField
                            key={type}
                            control={form.control}
                            name="acceptableDonationTypes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={type}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), type])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== type
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {type}
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
                
                <div className="flex gap-4 pt-6 border-t">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        Create Lead
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                        <X className="mr-2 h-4 w-4" />
                        Clear Form
                    </Button>
                </div>
            </fieldset>
        </form>
        </Form>
        <AlertDialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        Duplicate Lead Warning
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This beneficiary already has {duplicateWarning?.length} open lead(s). Are you sure you want to create another one?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-60 overflow-y-auto space-y-2 p-2 rounded-md bg-muted">
                    {duplicateWarning?.map(lead => (
                        <div key={lead.id} className="text-sm p-2 border bg-background rounded-md">
                            <p><strong>Purpose:</strong> {lead.purpose}</p>
                            <p><strong>Amount Requested:</strong> ₹{lead.helpRequested.toLocaleString()}</p>
                            <p><strong>Status:</strong> {lead.caseStatus}</p>
                        </div>
                    ))}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDuplicateWarning(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        setDuplicateWarning(null);
                        form.handleSubmit((values) => onSubmit(values, true))();
                    }}>
                        Yes, Create Anyway
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

export function AddLeadForm(props: { users: User[], campaigns: Campaign[], settings: AppSettings }) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddLeadFormContent {...props} />
        </Suspense>
    )
}
