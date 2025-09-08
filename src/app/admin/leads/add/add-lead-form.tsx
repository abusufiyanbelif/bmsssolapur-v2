
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
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot, FileUp, ZoomIn, ZoomOut, FileIcon, ScanSearch, UserSearch, UserRoundPlus, XCircle, PlusCircle } from "lucide-react";
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


const donationTypes: Exclude<DonationType, 'Split' | 'Any'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Interest'];
const leadPriorities: LeadPriority[] = ['Urgent', 'High', 'Medium', 'Low'];


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
  priority: z.enum(leadPriorities),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  dueDate: z.date().optional(),
  isLoan: z.boolean().default(false),
  caseDetails: z.string().optional(),
  verificationDocument: z.any().optional(),
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
  
  // AI related state
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawText, setRawText] = useState("");

  // State for multi-file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [zoomLevels, setZoomLevels] = useState<Record<number, number>>({});
  
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
      verificationDocument: undefined,
    },
  });
  
  const handleCancel = () => {
    form.reset();
      setSelectedReferralDetails(null);
      setRawText("");
      setFiles([]);
      setZoomLevels({});
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  const { formState: { isValid }, setValue, watch, getValues, control, trigger } = form;
  const selectedPurposeName = watch("purpose");
  const selectedCategory = watch("category");
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
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
             setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
             setRawText(''); // Clear old text when new files are selected
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        setZoomLevels(prev => {
            const newLevels = {...prev};
            delete newLevels[index];
            return newLevels;
        })
    }
    
    const handleGetTextFromImage = async () => {
        if (files.length === 0) {
            toast({ variant: 'destructive', title: 'No Files', description: 'Please upload at least one document to scan.' });
            return;
        }
        setIsExtractingText(true);
        const formData = new FormData();
        files.forEach(file => formData.append("imageFiles", file));

        try {
            const result = await getRawTextFromImage(formData);

            if (result.success && result.rawText) {
                setRawText(result.rawText);
                 toast({ variant: 'success', title: 'Text Extracted', description: 'Raw text is available for auto-fill.' });
            } else {
                 toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract any text from the documents.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred during text extraction." });
        } finally {
            setIsExtractingText(false);
        }
    };
    
    const handleAutoFillFromText = async () => {
        if (!rawText) {
             toast({ variant: 'destructive', title: 'No Text', description: 'Please extract text from documents first.' });
            return;
        }
        setIsAnalyzing(true);
         const analysisResult = await handleExtractLeadDetailsFromText(rawText);
            
        if (analysisResult.success && analysisResult.details) {
            const details = analysisResult.details;
            
            // Auto-fill all simple fields
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

            if (details.beneficiaryFirstName) setValue('newBeneficiaryFirstName', details.beneficiaryFirstName, { shouldDirty: true });
            if (details.beneficiaryMiddleName) setValue('newBeneficiaryMiddleName', details.beneficiaryMiddleName, { shouldDirty: true });
            if (details.beneficiaryLastName) setValue('newBeneficiaryLastName', details.beneficiaryLastName, { shouldDirty: true });
            if (details.fatherName) setValue('newBeneficiaryFatherName', details.fatherName, { shouldDirty: true });
            if (details.beneficiaryPhone) {
                const phone = details.beneficiaryPhone.replace(/\D/g, '').slice(-10);
                setValue('newBeneficiaryPhone', phone, { shouldDirty: true });
            }
             if (details.aadhaarNumber) setValue('newBeneficiaryAadhaar', details.aadhaarNumber.replace(/\D/g,''), { shouldDirty: true });

            setValue('beneficiaryType', 'new', { shouldDirty: true });
            
            toast({ variant: 'success', title: 'Auto-fill Complete', description: 'Please review the populated fields.' });
        } else {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: analysisResult.error || "Could not extract structured details from text." });
        }
        setIsAnalyzing(false);
    }


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
    formData.append("beneficiaryType", values.beneficiaryType);
    if(values.beneficiaryId) formData.append("beneficiaryId", values.beneficiaryId);
    if(values.newBeneficiaryFirstName) formData.append("newBeneficiaryFirstName", values.newBeneficiaryFirstName);
    if(values.newBeneficiaryMiddleName) formData.append("newBeneficiaryMiddleName", values.newBeneficiaryMiddleName);
    if(values.newBeneficiaryLastName) formData.append("newBeneficiaryLastName", values.newBeneficiaryLastName);
    if(values.newBeneficiaryFatherName) formData.append("newBeneficiaryFatherName", values.newBeneficiaryFatherName);
    if(values.newBeneficiaryPhone) formData.append("newBeneficiaryPhone", values.newBeneficiaryPhone);
    if(values.newBeneficiaryEmail) formData.append("newBeneficiaryEmail", values.newBeneficiaryEmail);
    if(values.newBeneficiaryAadhaar) formData.append("newBeneficiaryAadhaar", values.newBeneficiaryAadhaar);
    if(values.campaignId && values.campaignId !== 'none') formData.append("campaignId", values.campaignId);
    if(values.campaignName) formData.append("campaignName", values.campaignName);
    if(values.hasReferral && values.referredByUserId) {
        formData.append("referredByUserId", values.referredByUserId);
        formData.append("referredByUserName", values.referredByUserName || '');
    } else {
        formData.append("referredByUserId", "");
        formData.append("referredByUserName", "");
    }
    if(values.headline) formData.append("headline", values.headline);
    if(values.story) formData.append("story", values.story);
    formData.append("purpose", values.purpose);
    if (values.otherPurposeDetail) formData.append("otherPurposeDetail", values.otherPurposeDetail);
    formData.append("category", values.category);
    if (values.otherCategoryDetail) formData.append("otherCategoryDetail", values.otherCategoryDetail);
    formData.append("priority", values.priority);
    values.acceptableDonationTypes.forEach(type => formData.append("acceptableDonationTypes", type));
    formData.append("helpRequested", String(values.helpRequested));
    if (values.dueDate) formData.append("dueDate", values.dueDate.toISOString());
    if(values.isLoan) formData.append("isLoan", "on");
    if (values.caseDetails) formData.append("caseDetails", values.caseDetails);
    
    // Append first file if it exists for verificationDocument
    if (files.length > 0) {
        formData.append("verificationDocument", files[0]);
    }

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

                <h3 className="text-lg font-semibold border-b pb-2">Lead Purpose</h3>
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
                </div>
                {selectedPurposeName === 'Other' && (
                    <FormField
                        control={form.control}
                        name="otherPurposeDetail"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Please specify &quot;Other&quot; purpose</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., House Repair" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                {selectedCategory === 'Other' && (
                    <FormField
                        control={form.control}
                        name="otherCategoryDetail"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Please specify &quot;Other&quot; category details</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Specific textbook name" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2 text-primary">
                                <FileUp className="h-5 w-5" />
                                Upload & Scan Documents (Optional)
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                            <div className="space-y-2">
                                <Label htmlFor="verificationDocument">Attach Documents</Label>
                                    <Input 
                                        id="verificationDocument"
                                        type="file" 
                                        ref={fileInputRef}
                                        accept="image/*,application/pdf"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <FormDescription>Upload one or more supporting documents (ID, Bill, etc.). The first file will be saved as the primary verification document.</FormDescription>
                            </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {files.map((file, index) => {
                                        const isImage = file.type.startsWith('image/');
                                        const zoom = zoomLevels[index] || 1;
                                        return (
                                            <div key={index} className="relative group p-2 border rounded-lg bg-background space-y-2">
                                                <div className="w-full h-40 overflow-auto flex items-center justify-center">
                                                        {isImage ? (
                                                        <Image
                                                            src={URL.createObjectURL(file)}
                                                            alt={`Preview ${index + 1}`}
                                                            width={150 * zoom}
                                                            height={150 * zoom}
                                                            className="object-contain transition-transform duration-300"
                                                        />
                                                        ) : (
                                                            <FileIcon className="w-16 h-16 text-muted-foreground" />
                                                        )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                                                <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-md">
                                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [index]: (z[index] || 1) * 1.2}))}><ZoomIn className="h-4 w-4"/></Button>
                                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [index]: Math.max(1, (z[index] || 1) / 1.2)}))}><ZoomOut className="h-4 w-4"/></Button>
                                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveFile(index)}>
                                                        <XCircle className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-48 flex-col gap-2 border-dashed"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <PlusCircle className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-muted-foreground">Add More Files</span>
                                    </Button>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={handleGetTextFromImage} disabled={files.length === 0 || isExtractingText}>
                                        {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin"/> : <Text className="mr-2 h-4 w-4" />}
                                        Get Text from Documents
                                    </Button>
                                    <Button type="button" className="w-full" onClick={handleAutoFillFromText} disabled={!rawText || isAnalyzing}>
                                        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                                        Auto-fill from Text
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
                        </div>
                    </div>
                )}
                 
                 <h3 className="text-lg font-semibold border-b pb-2 pt-4">Case Details</h3>
                 <FormField
                    control={form.control}
                    name="story"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Story</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Tell the full story of the beneficiary and their situation. This will be shown on the public case page."
                                className="resize-y min-h-[150px]"
                                {...field}
                            />
                        </FormControl>
                        <FormDescription>A detailed narrative for public display.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 {form.watch("purpose") === "Medical" && (
                    <FormField
                        control={form.control}
                        name="diseaseIdentified"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Disease Identified (if any)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter the specific disease or diagnosis from the medical report."
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>This helps in categorizing medical cases accurately.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 )}
        
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
