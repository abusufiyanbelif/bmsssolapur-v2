

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
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot } from "lucide-react";
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
import { getRawTextFromImage } from "@/app/actions";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [referralPopoverOpen, setReferralPopoverOpen] = useState(false);
  const [selectedReferralDetails, setSelectedReferralDetails] = useState<User | null>(null);
  const [rawText, setRawText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [fileForScan, setFileForScan] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
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
      isLoan: false,
      helpRequested: 0,
      campaignId: 'none',
      acceptableDonationTypes: [],
      priority: 'Medium',
      hasReferral: false,
    },
  });
  
  const handleCancel = () => {
    form.reset({
        beneficiaryType: 'existing',
        isLoan: false,
        helpRequested: 0,
        acceptableDonationTypes: [],
        newBeneficiaryFirstName: '',
        newBeneficiaryMiddleName: '',
        newBeneficiaryLastName: '',
        newBeneficiaryPhone: '',
        newBeneficiaryEmail: '',
        beneficiaryId: '',
        headline: '',
        story: '',
        caseDetails: '',
        category: '',
        otherCategoryDetail: '',
        otherPurposeDetail: '',
        purpose: undefined,
        priority: 'Medium',
        campaignId: 'none',
        campaignName: '',
        hasReferral: false,
        referredByUserId: '',
        referredByUserName: '',
        dueDate: undefined,
        verificationDocument: undefined,
      });
      setSelectedReferralDetails(null);
      setRawText("");
      setFileForScan(null);
      setFilePreview(null);
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
  
  const handleGenerateTemplate = () => {
        const template = `
--- LEAD DETAILS ---
Headline: 
Purpose: (Education, Medical, Relief Fund, Deen, Loan, Other)
Category: (e.g., School Fees, Hospital Bill, Ration Kit)
Amount Requested: 
Due Date: (DD-MM-YYYY)
Acceptable Donation Types: (Zakat, Sadaqah, Fitr, Lillah, Kaffarah, Interest)
Case Details: (The detailed story or reason for the request)

--- BENEFICIARY DETAILS ---
Full Name: 
Father's Name:
Beneficiary Type: (e.g., Adult, Family, Kid, Widow)
Phone: 
Email:
Address:
Occupation:
Aadhaar Number:
PAN Number:
Bank Account Name:
Bank Account Number:
Bank IFSC Code:
UPI IDs: (Comma-separated, e.g., user@upi, 9876543210@ybl)

--- REFERRAL DETAILS (IF ANY) ---
Referral Name: 
Referral Phone: 
`.trim();
        navigator.clipboard.writeText(template);
        toast({
            title: "Template Copied!",
            description: "The lead details template has been copied to your clipboard.",
        });
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setValue('verificationDocument', file, { shouldValidate: true });
        setFileForScan(file);
        if (file) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
        setRawText("");
    };

    const handleGetText = async () => {
        if (!fileForScan) return;
        setIsScanning(true);
        const formData = new FormData();
        formData.append("imageFile", fileForScan);
        const result = await getRawTextFromImage(formData);
        if (result.success && result.rawText) {
            setRawText(result.rawText);
            toast({ variant: "success", title: "Text Extracted" });
        } else {
            toast({ variant: "destructive", title: "Scan Failed", description: result.error });
        }
        setIsScanning(false);
    };

    const handleAutoFill = async () => {
        if (!rawText) {
            toast({ variant: 'destructive', title: "No text provided." });
            return;
        }
        setIsExtracting(true);
        const result = await handleExtractLeadDetailsFromText(rawText);
        
        if (result.success && result.details) {
            const details = result.details;
            
            // Auto-fill all simple fields
            if (details.headline) setValue('headline', details.headline);
            if (details.purpose) {
                const matchingPurpose = leadPurposes.find(p => p.name.toLowerCase() === details.purpose?.toLowerCase());
                if (matchingPurpose) setValue('purpose', matchingPurpose.name);
            }
            if (details.category) setValue('category', details.category);
            if (details.amount) setValue('helpRequested', details.amount);
            if (details.dueDate) setValue('dueDate', new Date(details.dueDate));
            if (details.acceptableDonationTypes) setValue('acceptableDonationTypes', details.acceptableDonationTypes);
            if (details.caseDetails) setValue('caseDetails', details.caseDetails);

            // Beneficiary details
            if (details.beneficiaryName) {
                const nameParts = details.beneficiaryName.split(' ');
                setValue('newBeneficiaryFirstName', nameParts[0] || '');
                setValue('newBeneficiaryLastName', nameParts.slice(1).join(' ') || '');
            }
            if (details.fatherName) setValue('newBeneficiaryMiddleName', details.fatherName); // Assuming middleName for father
            if (details.beneficiaryEmail) setValue('newBeneficiaryEmail', details.beneficiaryEmail);
            if (details.beneficiaryType) {
                 const type = details.beneficiaryType as any;
                 if (['Adult', 'Old Age', 'Kid', 'Family', 'Widow'].includes(type)) {
                     setValue('beneficiaryType', type);
                 }
            }
            
            // Check for existing user by phone
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
                    toast({ title: "New Beneficiary", description: "No existing user found with this phone number. A new profile will be created."});
                }
            } else {
                 setValue('beneficiaryType', 'new');
            }

            toast({ variant: 'success', title: "Auto-fill Complete", description: "Please review the populated fields." });
        } else {
            toast({ variant: 'destructive', title: "Extraction Failed", description: result.error });
        }
        
        setIsExtracting(false);
    };


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
    if(values.caseDetails) formData.append("caseDetails", values.caseDetails);
    if(values.verificationDocument) formData.append("verificationDocument", values.verificationDocument);
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
                        <Bot className="h-5 w-5" />
                        Import from Text (Optional)
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-2">
                             <Label htmlFor="rawText">Paste Details Here</Label>
                            <Textarea
                                id="rawText"
                                placeholder="Paste the text from the beneficiary or referral here..."
                                className="min-h-[150px] font-mono text-sm"
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button type="button" variant="outline" className="w-full" onClick={handleGenerateTemplate}>
                                <Clipboard className="mr-2 h-4 w-4" />
                                Copy Template
                            </Button>
                            <Button type="button" className="w-full" onClick={handleAutoFill} disabled={!rawText || isExtracting}>
                                {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                                Auto-fill Form
                            </Button>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>


        <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => onSubmit(values, false))} className="space-y-8 max-w-2xl">
            <fieldset disabled={isFormDisabled}>
                <h3 className="text-lg font-semibold border-b pb-2">Verification Document</h3>
                 <FormField
                    control={form.control}
                    name="verificationDocument"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Attach Document</FormLabel>
                        <FormControl>
                            <Input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            />
                        </FormControl>
                        <FormDescription>
                            Upload a supporting document (ID, Bill, etc.). You can scan it to extract text.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                {fileForScan && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={handleGetText} disabled={isScanning} className="w-full">
                            {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                            {isScanning ? 'Scanning...' : 'Get Text from Image'}
                        </Button>
                    </div>
                )}
                {rawText && (
                  <div className="space-y-2 mt-4">
                      <Label>Extracted Text</Label>
                      <Textarea value={rawText} readOnly rows={5} className="text-xs font-mono bg-muted" />
                  </div>
                )}


                <h3 className="text-lg font-semibold border-b pb-2 mt-8">Beneficiary Details</h3>
                <FormField
                    control={form.control}
                    name="beneficiaryType"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Beneficiary</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('beneficiaryId', undefined);
                                form.setValue('newBeneficiaryFirstName', '');
                                form.setValue('newBeneficiaryMiddleName', '');
                                form.setValue('newBeneficiaryLastName', '');
                                form.setValue('newBeneficiaryPhone', '');
                                form.setValue('newBeneficiaryEmail', '');
                            }}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                            >
                                <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                    <FormControl>
                                        <RadioGroupItem value="existing" className="sr-only" />
                                    </FormControl>
                                    <Users className="mb-3 h-6 w-6" />
                                    Existing Beneficiary
                                </Label>
                                <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                    <FormControl>
                                        <RadioGroupItem value="new" className="sr-only" />
                                    </FormControl>
                                    <UserPlus className="mb-3 h-6 w-6" />
                                    New Beneficiary
                                </Label>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                {beneficiaryType === 'existing' && (
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
                )}
                
                {beneficiaryType === 'new' && (
                    <div className="space-y-4 p-4 border rounded-lg">
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
                
                <h3 className="text-lg font-semibold border-b pb-2">Case Details</h3>
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
                            const handleAnyChange = (checked: boolean) => {
                                field.onChange(checked ? allOtherTypes : []);
                            }
                            const isAnyChecked = field.value?.includes('Any') || (field.value?.length === allOtherTypes.length);

                            if (type === 'Any') {
                                return (
                                    <FormItem
                                    key={type}
                                    className="flex flex-row items-start space-x-3 space-y-0 font-bold"
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={isAnyChecked}
                                        onCheckedChange={(checked) => handleAnyChange(!!checked)}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                    {type}
                                    </FormLabel>
                                </FormItem>
                                )
                            }
                            
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
                                        
                                        // If all others are checked, check 'Any' as well
                                        if (newValue && newValue.length === allOtherTypes.length) {
                                        field.onChange(donationTypes);
                                        } else {
                                        // Remove 'Any' if not all are checked
                                        field.onChange(newValue?.filter(v => v !== 'Any'));
                                        }
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
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        onSubmit(form.getValues(), true);
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
