
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
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot, FileUp, ZoomIn, ZoomOut, FileIcon, ScanSearch, UserSearch, UserRoundPlus } from "lucide-react";
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
import { getUserByPhone } from "@/services/user-service";
import { getRawTextFromImage } from '@/app/actions';
import Image from "next/image";


const donationTypes: Exclude<DonationType, 'Split' | 'Any'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Interest'];
const leadPriorities: LeadPriority[] = ['Urgent', 'High', 'Medium', 'Low'];


const formSchema = z.object({
  beneficiaryType: z.enum(['existing', 'new']).default('existing'),
  beneficiaryId: z.string().optional(),
  
  // New beneficiary fields
  newBeneficiaryFirstName: z.string().optional(),
  newBeneficiaryMiddleName: z.string().optional(),
  newBeneficiaryLastName: z.string().optional(),
  newBeneficiaryPhone: z.string().optional(),
  newBeneficiaryEmail: z.string().email().optional().or(z.literal('')),
  
  hasReferral: z.boolean().default(false),
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  referredByUserId: z.string().optional(),
  referredByUserName: z.string().optional(),
  headline: z.string().min(10, "Headline must be at least 10 characters.").max(100, "Headline cannot exceed 100 characters.").optional().or(z.literal('')),
  story: z.string().optional(),
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


type AddLeadFormValues = z.infer<typeof formSchema>;

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
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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


  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beneficiaryType: 'existing',
      beneficiaryId: '',
      newBeneficiaryFirstName: '',
      newBeneficiaryMiddleName: '',
      newBeneficiaryLastName: '',
      newBeneficiaryPhone: '',
      newBeneficiaryEmail: '',
      hasReferral: false,
      referredByUserId: '',
      referredByUserName: '',
      campaignId: 'none',
      campaignName: '',
      headline: '',
      story: '',
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
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  const { formState: { isValid }, setValue } = form;
  const selectedPurposeName = form.watch("purpose");
  const selectedCategory = form.watch("category");
  const beneficiaryType = form.watch("beneficiaryType");
  const hasReferral = form.watch("hasReferral");

  const availableCategories = useMemo(() => {
      if (!selectedPurposeName) return [];
      const purpose = leadPurposes.find(p => p.name === selectedPurposeName);
      return (purpose?.categories || []).filter(c => c.enabled);
  }, [selectedPurposeName, leadPurposes]);


  useEffect(() => {
    if (selectedPurposeName === 'Loan') {
        form.setValue('isLoan', true);
    } else {
        form.setValue('isLoan', false);
    }
  }, [selectedPurposeName, form]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };
    
    const handleGenerateAndFill = async () => {
        if (files.length === 0) {
            toast({ variant: 'destructive', title: 'No Files', description: 'Please upload at least one document to scan.' });
            return;
        }
        setIsProcessing(true);

        try {
            const textPromises = files.map(file => {
                const formData = new FormData();
                formData.append("imageFile", file);
                return getRawTextFromImage(formData);
            });

            const textResults = await Promise.all(textPromises);
            const combinedText = textResults.map(r => r.rawText || '').join('\n\n---\n\n');
            setRawText(combinedText);
            
            if (!combinedText.trim()) {
                 toast({ variant: 'destructive', title: 'Extraction Failed', description: 'Could not extract any text from the documents.' });
                 setIsProcessing(false);
                 return;
            }

            toast({ variant: 'success', title: 'Text Extracted', description: 'Now analyzing text to generate details...' });

            const analysisResult = await handleExtractLeadDetailsFromText(combinedText);
            
            if (analysisResult.success && analysisResult.details) {
                const details = analysisResult.details;
                 // Auto-fill all simple fields
                if (details.headline) setValue('headline', details.headline);
                if (details.story) setValue('story', details.story);
                if (details.purpose) {
                    const matchingPurpose = leadPurposes.find(p => p.name.toLowerCase() === details.purpose?.toLowerCase());
                    if (matchingPurpose) setValue('purpose', matchingPurpose.name);
                }
                if (details.category) setValue('category', details.category);
                if (details.amount) setValue('helpRequested', details.amount);
                if (details.dueDate) setValue('dueDate', new Date(details.dueDate));
                if (details.acceptableDonationTypes) setValue('acceptableDonationTypes', details.acceptableDonationTypes);
                if (details.caseDetails) setValue('caseDetails', details.caseDetails);

                if (details.beneficiaryPhone) {
                    const phone = details.beneficiaryPhone.replace(/\D/g, '').slice(-10);
                    setValue('newBeneficiaryPhone', phone);
                    const existingUser = await getUserByPhone(phone);
                    if (existingUser) {
                        setValue('beneficiaryType', 'existing');
                        setValue('beneficiaryId', existingUser.id);
                        toast({ title: "Existing Beneficiary Found", description: `${existingUser.name} has been selected. Their details will be used.`});
                    } else {
                        setValue('beneficiaryType', 'new');
                         if (details.beneficiaryName) {
                            const nameParts = details.beneficiaryName.split(' ');
                            setValue('newBeneficiaryFirstName', nameParts[0] || '');
                            setValue('newBeneficiaryLastName', nameParts.slice(1).join(' ') || '');
                        }
                        toast({ title: "New Beneficiary", description: "No existing user found with this phone number. A new profile will be created."});
                    }
                } else {
                     setValue('beneficiaryType', 'new');
                }
                
                toast({ variant: 'success', title: 'Auto-fill Complete', description: 'Please review the populated fields.' });
            } else {
                toast({ variant: 'destructive', title: 'Analysis Failed', description: analysisResult.error || "Could not extract structured details from text." });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred during processing." });
        } finally {
            setIsProcessing(false);
        }
    }


  async function onSubmit(values: AddLeadFormValues, forceCreate: boolean = false) {
    if (!adminUser?.id) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not identify the logged in administrator. Please log out and back in.",
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
    if(values.newBeneficiaryPhone) formData.append("newBeneficiaryPhone", values.newBeneficiaryPhone);
    if(values.newBeneficiaryEmail) formData.append("newBeneficiaryEmail", values.newBeneficiaryEmail);
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

        <Accordion type="single" collapsible className="w-full mb-6">
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
                            />
                            <FormDescription>Upload one or more supporting documents (ID, Bill, etc.). The first file will be saved as the primary verification document.</FormDescription>
                       </div>
                        
                        {files.length > 0 && (
                            <div className="space-y-4">
                                <Label>Document Previews</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {files.map((file, index) => {
                                        const isImage = file.type.startsWith('image/');
                                        const zoom = zoomLevels[index] || 1;
                                        return (
                                            <div key={index} className="relative p-2 border rounded-lg bg-background space-y-2">
                                                <div className="w-full h-40 overflow-hidden flex items-center justify-center">
                                                     {isImage ? (
                                                        <Image
                                                            src={URL.createObjectURL(file)}
                                                            alt={`Preview ${index + 1}`}
                                                            width={150}
                                                            height={150}
                                                            className="object-contain transition-transform duration-300"
                                                            style={{ transform: `scale(${zoom})` }}
                                                        />
                                                     ) : (
                                                         <FileIcon className="w-16 h-16 text-muted-foreground" />
                                                     )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                                                {isImage && (
                                                    <div className="absolute top-1 right-1 flex flex-col gap-1 bg-black/50 rounded-md p-0.5">
                                                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => setZoomLevels(z => ({...z, [index]: (z[index] || 1) * 1.2}))}><ZoomIn className="h-4 w-4"/></Button>
                                                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={() => setZoomLevels(z => ({...z, [index]: Math.max(1, (z[index] || 1) / 1.2)}))}><ZoomOut className="h-4 w-4"/></Button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button type="button" className="w-full" onClick={handleGenerateAndFill} disabled={files.length === 0 || isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                {isProcessing ? 'Processing...' : 'Generate & Fill from Documents'}
                            </Button>
                        </div>
                         {rawText && (
                            <div className="space-y-2 pt-4">
                                <Label>Extracted Text</Label>
                                <Textarea value={rawText} readOnly rows={5} className="text-xs font-mono bg-background" />
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>


        <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => onSubmit(values, false))} className="space-y-8 max-w-2xl">
            <fieldset disabled={isFormDisabled}>

                <h3 className="text-lg font-semibold border-b pb-2 mt-8">Beneficiary Details</h3>
                
                {beneficiaryType === 'existing' ? (
                     <div className="space-y-4">
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
                                        : "Select a beneficiary"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search beneficiary..." />
                                    <CommandList>
                                        <CommandEmpty>No beneficiaries found.</CommandEmpty>
                                        <CommandGroup>
                                        {potentialBeneficiaries.map((user) => (
                                            <CommandItem
                                            value={user.name}
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
                         <Button type="button" variant="outline" onClick={() => setValue('beneficiaryType', 'new')}>
                            <UserRoundPlus className="mr-2 h-4 w-4" />
                            Create New Beneficiary
                        </Button>
                    </div>
                ) : (
                     <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">New Beneficiary Details</h3>
                            <Button type="button" variant="outline" onClick={() => setValue('beneficiaryType', 'existing')}>
                                <UserSearch className="mr-2 h-4 w-4" />
                                Search Existing
                            </Button>
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
                        </div>
                    </div>
                )}
                
                <h3 className="text-lg font-semibold border-b pb-2 mt-8">Case Details</h3>
                <FormField
                    control={form.control}
                    name="hasReferral"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                                field.onChange(checked)
                                if (!checked) {
                                    form.setValue("referredByUserId", undefined)
                                    form.setValue("referredByUserName", undefined)
                                    setSelectedReferralDetails(null)
                                }
                            }}
                        />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel>
                            This lead was referred by someone
                        </FormLabel>
                        </div>
                    </FormItem>
                    )}
                />

                {hasReferral && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <FormField
                            control={form.control}
                            name="referredByUserId"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Select Referral</FormLabel>
                                <Popover open={referralPopoverOpen} onOpenChange={setReferralPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                        "w-full justify-between bg-background",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value
                                        ? potentialReferrals.find(
                                            (user) => user.id === field.value
                                            )?.name
                                        : "Select a referral"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                    <CommandInput placeholder="Search referral..." />
                                    <CommandList>
                                        <CommandEmpty>No referrals found.</CommandEmpty>
                                        <CommandGroup>
                                        {potentialReferrals.map((user) => (
                                            <CommandItem
                                            value={user.name}
                                            key={user.id}
                                            onSelect={() => {
                                                form.setValue("referredByUserId", user.id!);
                                                form.setValue("referredByUserName", user.name);
                                                setSelectedReferralDetails(user);
                                                setReferralPopoverOpen(false);
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                user.id === field.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                            />
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
                        {selectedReferralDetails && (
                            <div className="space-y-3 pt-2">
                                <div className="space-y-1">
                                    <Label>Referral&apos;s Bank Account</Label>
                                    <Input value={selectedReferralDetails.bankAccountNumber || 'Not Available'} readOnly disabled />
                                </div>
                                <div className="space-y-1">
                                    <Label>Referral&apos;s UPI IDs</Label>
                                    {selectedReferralDetails.upiIds && selectedReferralDetails.upiIds.length > 0 ? (
                                        selectedReferralDetails.upiIds.map((upi, i) => (
                                            <Input key={i} value={upi} readOnly disabled />
                                        ))
                                    ) : (
                                        <Input value="Not Available" readOnly disabled />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}


                <FormField
                control={form.control}
                name="campaignId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Link to Campaign (Optional)</FormLabel>
                    <Select
                        onValueChange={(value) => {
                        const selectedCampaign = campaigns.find(c => c.id === value);
                        field.onChange(value === 'none' ? undefined : value);
                        form.setValue('campaignName', selectedCampaign?.name || '');
                        }}
                        defaultValue={field.value}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a campaign" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {campaigns.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled').map((campaign) => (
                                <SelectItem key={campaign.id} value={campaign.id!}>
                                {campaign.name} ({campaign.status})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>Link this lead to a specific fundraising campaign.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Headline Summary</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Urgent help needed for final year student's fees" {...field} />
                        </FormControl>
                        <FormDescription>A short, compelling summary of the case for public display.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                
                <FormField
                control={form.control}
                name="acceptableDonationTypes"
                render={() => (
                    <FormItem className="space-y-3 p-4 border rounded-lg">
                    <div className="mb-4">
                        <FormLabel className="text-base font-semibold">Acceptable Donation Types</FormLabel>
                        <FormDescription>
                        Select which types of donations can be allocated to this lead.
                        </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {donationTypes.map((type) => (
                        <FormField
                            key={type}
                            control={form.control}
                            name="acceptableDonationTypes"
                            render={({ field }) => {
                            const allOtherTypes = donationTypes.filter(t => t !== 'Any');
                            
                            return (
                                <FormItem
                                key={type}
                                className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                <FormControl>
                                    <Checkbox
                                    checked={field.value?.includes(type)}
                                    onCheckedChange={(checked) => {
                                        const newValue = checked
                                        ? [...(field.value || []), type]
                                        : field.value?.filter((value) => value !== type);
                                        
                                        field.onChange(newValue);
                                    }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">
                                        {type}
                                    </FormLabel>
                                    </FormItem>
                                );
                                }}
                            />
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
        
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="helpRequested"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount Requested</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Enter amount" {...field} />
                        </FormControl>
                        <FormDescription>The total amount of funds needed.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Due Date (Optional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                    date < new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                The deadline for when funds are needed.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Set a priority level" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {leadPriorities.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Set the urgency of this case.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
        
        
                <FormField
                control={form.control}
                name="caseDetails"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Internal Case Summary</FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder="Provide a brief summary of the case, the reason for the need, and any other relevant information."
                            className="resize-y min-h-[100px]"
                            {...field}
                        />
                    </FormControl>
                    <FormDescription>Internal notes for administrators. Not visible to the public.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
        
                {selectedPurposeName === 'Loan' && (
                    <FormField
                        control={form.control}
                        name="isLoan"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={true}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Is this a repayable loan?
                                </FormLabel>
                                <FormDescription>
                                This is automatically selected if the purpose is &quot;Loan&quot;.
                                </FormDescription>
                            </div>
                            </FormItem>
                        )}
                    />
                )}
        
                <div className="flex gap-4">
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
                        Cancel
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

export function AddLeadForm(props: AddLeadFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddLeadFormContent {...props} />
        </Suspense>
    )
}
