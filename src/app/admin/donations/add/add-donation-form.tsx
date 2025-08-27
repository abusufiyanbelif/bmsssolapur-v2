

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useState, useEffect, Suspense, useRef, useCallback, useMemo } from "react";
import { Loader2, Info, ImageIcon, CalendarIcon, FileText, Trash2, ChevronsUpDown, Check, X, ScanEye, User as UserIcon, TextSelect, XCircle, Users, AlertTriangle, Megaphone, FileHeart, Building, CheckCircle } from "lucide-react";
import type { User, DonationType, DonationPurpose, PaymentMethod, UserRole, Lead, Campaign, LeadPurpose } from "@/services/types";
import { getUser, getUserByPhone, getUserByUpiId, getUserByBankAccountNumber } from "@/services/user-service";
import { useSearchParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { handleAddDonation, checkTransactionId, scanProof, getRawTextFromImage } from "./actions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDebounce } from "@/hooks/use-debounce";
import { Switch } from "@/components/ui/switch";


const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'] as const;
const donationPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'To Organization Use', 'Loan Repayment', 'Other'] as const;
const paymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];
const paymentApps = ['Google Pay', 'PhonePe', 'Paytm'] as const;
const recipientRoles = ['Beneficiary', 'Referral', 'To Organization', 'Organization Member'] as const;

const categoryOptions: Record<string, string[]> = {
    'Education': ['School Fees', 'College Fees', 'Tuition Fees', 'Exam Fees', 'Hostel Fees', 'Books & Uniforms', 'Educational Materials', 'Other'],
    'Medical': ['Hospital Bill', 'Medication', 'Doctor Consultation', 'Surgical Procedure', 'Medical Tests', 'Medical Equipment', 'Other'],
    'Relief Fund': ['Ration Kit', 'Financial Aid', 'Disaster Relief', 'Shelter Assistance', 'Utility Bill Payment', 'Other'],
    'Deen': ['Masjid Maintenance', 'Madrasa Support', 'Da\'wah Activities', 'Other'],
    'Loan': ['Business Loan', 'Emergency Loan', 'Education Loan', 'Personal Loan', 'Other'],
};


const formSchema = z.object({
  donorId: z.string().min(1, "Please select a donor."),
  paymentMethod: z.enum(paymentMethods, { required_error: "Please select a payment method." }),
  recipientId: z.string().optional(),
  recipientRole: z.enum(recipientRoles).optional(),
  
  linkToCampaign: z.boolean().default(false),
  linkToLead: z.boolean().default(false),
  campaignId: z.string().optional(),
  leadId: z.string().optional(),

  isAnonymous: z.boolean().default(false),
  totalTransactionAmount: z.coerce.number().min(1, "Total amount must be greater than 0."),
  amount: z.coerce.number(), // This will hold the calculated primary donation amount
  donationDate: z.date(),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes, { required_error: "Please select a purpose." }),
  category: z.string().optional(),
  status: z.enum(["Pending", "Verified"]).default("Pending"),
  transactionId: z.string().optional(),
  utrNumber: z.string().optional(),
  googlePayTransactionId: z.string().optional(),
  phonePeTransactionId: z.string().optional(),
  paytmUpiReferenceNo: z.string().optional(),
  paymentApp: z.enum(paymentApps).optional(),
  senderPaymentApp: z.string().optional(),
  recipientPaymentApp: z.string().optional(),
  donorUpiId: z.string().optional(),
  donorPhone: z.string().optional(),
  donorBankAccount: z.string().optional(),
  senderName: z.string().optional(),
  phonePeSenderName: z.string().optional(),
  googlePaySenderName: z.string().optional(),
  paytmSenderName: z.string().optional(),
  recipientName: z.string().optional(),
  phonePeRecipientName: z.string().optional(),
  googlePayRecipientName: z.string().optional(),
  paytmRecipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientUpiId: z.string().optional(),
  recipientAccountNumber: z.string().optional(),
  paymentScreenshots: z.any().optional(),
  paymentScreenshotDataUrl: z.string().optional(),
  includeTip: z.boolean().default(false),
  tipAmount: z.coerce.number().optional(),
  includePledge: z.boolean().default(false),
  notes: z.string().optional(),
}).refine(data => {
    if (data.includeTip) {
        return !!data.tipAmount && data.tipAmount > 0;
    }
    return true;
}, {
    message: "Amount must be greater than 0.",
    path: ["tipAmount"],
}).refine(data => {
    if (data.includeTip && data.tipAmount) {
        return data.tipAmount < data.totalTransactionAmount;
    }
    return true;
}, {
    message: "Support amount cannot be greater than or equal to the total amount.",
    path: ["tipAmount"],
});

type AddDonationFormValues = z.infer<typeof formSchema>;

interface AddDonationFormProps {
  users: User[];
  leads: Lead[];
  campaigns: Campaign[];
  currentUser?: User | null;
}

interface FilePreview {
    file: File;
    previewUrl: string;
}

type AvailabilityState = {
    isChecking: boolean;
    isAvailable: boolean | null;
    existingDonationId?: string;
};

const initialAvailabilityState: AvailabilityState = {
    isChecking: false,
    isAvailable: null,
};

function AvailabilityFeedback({ state, fieldName }: { state: AvailabilityState, fieldName: string }) {
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
                    {state.existingDonationId && (
                        <Link href={`/admin/donations/${state.existingDonationId}/edit`} className="ml-1 underline hover:no-underline">
                            (View existing)
                        </Link>
                    )}.
                </p>
            </div>
        );
    }
    return null;
}

const initialFormValues: Partial<AddDonationFormValues> = {
    isAnonymous: false,
    totalTransactionAmount: 0,
    amount: 0,
    donationDate: new Date(),
    includeTip: false,
    tipAmount: 0,
    notes: "",
    paymentScreenshots: [],
    paymentScreenshotDataUrl: undefined,
    donorId: '',
    paymentMethod: 'Online (UPI/Card)',
    purpose: 'To Organization Use',
    category: undefined,
    status: 'Pending',
    transactionId: '',
    utrNumber: '',
    googlePayTransactionId: '',
    phonePeTransactionId: '',
    paytmUpiReferenceNo: '',
    paymentApp: undefined,
    senderPaymentApp: '',
    recipientPaymentApp: '',
    donorUpiId: '',
    donorPhone: '',
    donorBankAccount: '',
    senderName: '',
    phonePeSenderName: '',
    googlePaySenderName: '',
    paytmSenderName: '',
    recipientName: '',
    phonePeRecipientName: '',
    googlePayRecipientName: '',
    paytmRecipientName: '',
    recipientId: '',
    recipientRole: undefined,
    recipientPhone: '',
    recipientUpiId: '',
    recipientAccountNumber: '',
    leadId: '',
    campaignId: '',
    type: 'Sadaqah',
    includePledge: false,
    linkToCampaign: false,
    linkToLead: false,
};

const presetTipAmounts = [50, 100, 200];

function AddDonationFormContent({ users, leads, campaigns }: AddDonationFormProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<User | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [localFiles, setLocalFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [donorPopoverOpen, setDonorPopoverOpen] = useState(false);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);
  const [recipientPopoverOpen, setRecipientPopoverOpen] = useState(false);
  const scanAbortController = useRef<AbortController | null>(null);
  const [transactionIdState, setTransactionIdState] = useState<AvailabilityState>(initialAvailabilityState);

  const form = useForm<AddDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormValues,
  });
  
  const { watch, setValue, reset, getValues } = form;
  const includeTip = watch("includeTip");
  const totalTransactionAmount = watch("totalTransactionAmount");
  const tipAmount = watch("tipAmount");
  const isAnonymous = watch("isAnonymous");
  const recipientRole = watch("recipientRole");
  const transactionId = watch('transactionId');
  const debouncedTransactionId = useDebounce(transactionId, 500);

  const linkToLead = watch("linkToLead");
  const linkToCampaign = watch("linkToCampaign");
  const linkedLeadId = watch("leadId");
  const linkedCampaignId = watch("campaignId");
  const paymentMethod = watch("paymentMethod");
  const paymentApp = watch("paymentApp");
  const selectedPurpose = watch("purpose");
  const includePledge = watch("includePledge");
  
  // Fields for scanned details
  const scannedRecipientName = watch('recipientName');
  const scannedRecipientUpiId = watch('recipientUpiId');
  
  const selectedLead = useMemo(() => {
    if (!linkedLeadId) return null;
    return leads.find(l => l.id === linkedLeadId);
  }, [linkedLeadId, leads]);
  
  const availableDonationTypes = useMemo(() => {
    if (selectedLead && selectedLead.acceptableDonationTypes && selectedLead.acceptableDonationTypes.length > 0) {
        if(selectedLead.acceptableDonationTypes.includes('Any')) return donationTypes;
        return selectedLead.acceptableDonationTypes.filter(t => donationTypes.includes(t as any));
    }
    return donationTypes;
  }, [selectedLead]);
  
  useEffect(() => {
    const currentType = getValues('type');
    if (selectedLead && !availableDonationTypes.includes(currentType)) {
        setValue('type', availableDonationTypes[0] as (typeof donationTypes)[number], { shouldDirty: true });
    }
  }, [selectedLead, availableDonationTypes, setValue, getValues]);


  useEffect(() => {
    const total = totalTransactionAmount || 0;
    const pledge = (includePledge && selectedDonor?.monthlyPledgeEnabled && selectedDonor.monthlyPledgeAmount) ? selectedDonor.monthlyPledgeAmount : 0;
    const tip = includeTip ? (tipAmount || 0) : 0;
    const primaryAmount = Math.max(0, total - tip - pledge);
    setValue('amount', primaryAmount, { shouldDirty: true, shouldValidate: true });
  }, [totalTransactionAmount, tipAmount, includeTip, setValue, includePledge, selectedDonor]);


  useEffect(() => {
    const initializeUser = async () => {
      const storedUserId = localStorage.getItem('userId');
      setAdminUserId(storedUserId); // This is the user performing the action
      if (storedUserId) {
        const user = await getUser(storedUserId);
        setCurrentUser(user);
      }
    };
    initializeUser();
  }, []);
  
  const donorUsers = users.filter(u => u.roles.includes('Donor'));
  const isAdminView = currentUser?.roles.some(role => ['Admin', 'Super Admin', 'Finance Admin'].includes(role)) ?? false;


  const handleTxnIdCheck = useCallback(async (txnId: string) => {
    if (!txnId) {
        setTransactionIdState(initialAvailabilityState);
        return;
    }
    setTransactionIdState({ isChecking: true, isAvailable: null });
    const result = await checkTransactionId(txnId);
    setTransactionIdState({ 
        isChecking: false, 
        isAvailable: result.isAvailable,
        existingDonationId: result.existingDonationId
    });
  }, []);

  useEffect(() => {
    if (paymentApp !== 'PhonePe') {
        handleTxnIdCheck(debouncedTransactionId || '');
    }
  }, [debouncedTransactionId, handleTxnIdCheck, paymentApp]);


  const stopScan = () => {
    if (scanAbortController.current) {
        scanAbortController.current.abort();
        toast({ title: 'Scan Cancelled', description: 'The scanning process has been stopped.' });
    }
     setIsScanning(false);
  };


  const clearForm = () => {
    stopScan();
    reset(initialFormValues);
    setLocalFiles([]);
    setRawText(null);
    setSelectedDonor(null);
    setSelectedRecipient(null);
    setTransactionIdState(initialAvailabilityState);
    if(fileInputRef.current) fileInputRef.current.value = "";
    router.push('/admin/donations/add', { scroll: false });
  };
  
  const handleCancel = () => {
    // Context-aware redirect
    router.push(isAdminView ? '/admin/donations' : '/donate');
  }
  
    const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
    };

  useEffect(() => {
    const prefillData = async () => {
        const amountParam = searchParams.get('amount');
        const transactionIdParam = searchParams.get('transactionId');
        const donorIdParam = searchParams.get('donorId');
        const notesParam = searchParams.get('notes');
        const dateParam = searchParams.get('date');
        const donorUpiIdParam = searchParams.get('senderUpiId');
        const donorPhoneParam = searchParams.get('donorPhone');
        const donorBankAccountParam = searchParams.get('senderAccountNumber');
        const rawTextParam = searchParams.get('rawText');

        if (amountParam) setValue('totalTransactionAmount', parseFloat(amountParam));
        if (transactionIdParam) setValue('transactionId', transactionIdParam);
        if (notesParam) setValue('notes', notesParam);
        if (dateParam) setValue('donationDate', new Date(dateParam));
        if (donorUpiIdParam) setValue('donorUpiId', donorUpiIdParam);
        if (donorPhoneParam) setValue('donorPhone', donorPhoneParam);
        if (donorBankAccountParam) setValue('donorBankAccount', donorBankAccountParam);
        if (rawTextParam) setRawText(decodeURIComponent(rawTextParam));
        
        // If an admin is viewing, allow the donorId from URL.
        // If a donor is viewing, override with their own ID.
        let finalDonorId = donorIdParam;
        if (currentUser && !isAdminView) {
            finalDonorId = currentUser.id!;
            setValue('donorId', currentUser.id!);
            setSelectedDonor(currentUser);
        } else if(finalDonorId) {
            const foundUser = await getUser(finalDonorId);
            if (foundUser && foundUser.roles.includes('Donor')) {
                setValue('donorId', foundUser.id!);
                setSelectedDonor(foundUser);
            }
        }
        
        const screenshotData = sessionStorage.getItem('manualDonationScreenshot');
        if (screenshotData) {
            try {
                const { dataUrl } = JSON.parse(screenshotData);
                // Set the local file state to show the preview
                const file = await dataUrlToFile(dataUrl, 'scanned-screenshot.png');
                setLocalFiles([{ file, previewUrl: dataUrl }]);
                setValue('paymentScreenshotDataUrl', dataUrl);
            } catch (error) {
                console.error("Error processing session screenshot", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not load the screenshot for manual entry." });
            } finally {
                sessionStorage.removeItem('manualDonationScreenshot');
            }
        }
    }
    prefillData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue, toast, currentUser, isAdminView]);

  useEffect(() => {
    // This effect runs when a user is MANUALLY selected from the dropdown.
    if (selectedDonor && form.formState.touchedFields.donorId) {
        setValue('isAnonymous', !!selectedDonor.isAnonymousAsDonor);
        setValue('donorPhone', selectedDonor.phone);

        // Clear previous details
        setValue('donorUpiId', '');
        setValue('donorBankAccount', '');

        // Prioritize UPI ID if it exists and wasn't populated by a scan.
        const upiIdFromScan = getValues('donorUpiId');
        if (!upiIdFromScan && selectedDonor.upiIds && selectedDonor.upiIds.length > 0) {
            setValue('donorUpiId', selectedDonor.upiIds[0]);
        } 
        // Fallback to bank account only if no UPI was found from scan or profile.
        else if (!upiIdFromScan && selectedDonor.bankAccountNumber) {
             setValue('donorBankAccount', selectedDonor.bankAccountNumber);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDonor]);

  const handleExtractText = async () => {
    if (localFiles.length === 0) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please select a file first.' });
      return;
    }
    const file = localFiles[0].file;
    setIsExtractingText(true);
    const formData = new FormData();
    formData.append('imageFile', file);
    const result = await getRawTextFromImage(formData);
    if(result.success && result.text) {
        setRawText(result.text);
    } else {
         toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract text from the image.' });
    }
    setIsExtractingText(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
        if (paymentMethod === 'Other') { // Multi-file for "Other"
            const newPreviews = files.map(file => ({
                file,
                previewUrl: URL.createObjectURL(file)
            }));
            setLocalFiles(prev => [...prev, ...newPreviews]);
            setValue('paymentScreenshots', [...(getValues('paymentScreenshots') || []), ...files]);
        } else { // Single file for online methods
            const file = files[0];
            setRawText(null);
            setLocalFiles([{ file, previewUrl: URL.createObjectURL(file) }]);
            setValue('paymentScreenshots', [file]);
            setValue('paymentScreenshotDataUrl', ''); // Clear session storage data if a new file is uploaded
        }
    }
  };

  const handleScan = async () => {
    if (localFiles.length === 0) {
        toast({ variant: 'destructive', title: 'No File', description: 'Please select a screenshot to scan.' });
        return;
    }

    setIsScanning(true);
    scanAbortController.current = new AbortController();
    const formData = new FormData();
    formData.append('proofFile', localFiles[0].file);

    try {
        const scanResult = await scanProof(formData);
        
        if (scanAbortController.current?.signal.aborted) return;
        
        if (!scanResult || !scanResult.success || !scanResult.details) {
            throw new Error(scanResult?.error || "AI scan did not return any data. The image might be unreadable.");
        }
        
        toast({ variant: 'success', title: 'Scan Complete', description: 'Searching for matching donor...' });
        const details = scanResult.details;

        // Try to find a donor with the extracted details
        let foundDonor: User | null = null;
        if (details.senderUpiId) foundDonor = await getUserByUpiId(details.senderUpiId);
        if (!foundDonor && details.donorPhone) foundDonor = await getUserByPhone(details.donorPhone);
        if (!foundDonor && details.senderAccountNumber) foundDonor = await getUserByBankAccountNumber(details.senderAccountNumber);
        
        const queryParams = new URLSearchParams();
         for (const [key, value] of Object.entries(details)) {
            if (value !== undefined && value !== null) {
                 queryParams.set(key, String(value));
            }
        }
        
        const dataUrl = localFiles[0].previewUrl;
        sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({ dataUrl }));

        if (foundDonor) {
            toast({ variant: 'success', title: 'Donor Found!', description: `Redirecting to donation form for ${foundDonor.name}.` });
            queryParams.set('donorId', foundDonor.id!);
            router.push(`/admin/donations/add?${queryParams.toString()}`);
        } else {
            toast({ variant: 'destructive', title: 'Donor Not Found', description: 'Redirecting to create a new user profile.' });
            const newUserName = details.googlePaySenderName || details.phonePeSenderName || details.paytmSenderName || details.senderName;
            if(newUserName) queryParams.set('name', newUserName);
            if(details.senderUpiId) queryParams.set('upiId', details.senderUpiId);
            if(details.donorPhone) queryParams.set('phone', details.donorPhone);
            router.push(`/admin/user-management/add?${queryParams.toString()}`);
        }

    } catch (err) {
        if ((err as Error).name !== 'AbortError') {
            const error = err instanceof Error ? err.message : "An unknown error occurred during scanning.";
            toast({ variant: 'destructive', title: 'Scan Failed', description: error });
        }
    } finally {
        setIsScanning(false);
        scanAbortController.current = null;
    }
};


  const removeFile = (index: number) => {
    const updatedFiles = localFiles.filter((_, i) => i !== index);
    setLocalFiles(updatedFiles);
    setValue('paymentScreenshots', updatedFiles.map(f => f.file));
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: AddDonationFormValues) {
    if (!adminUserId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not identify the logged in user. Please log out and back in.",
        });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("adminUserId", adminUserId);
    Object.keys(values).forEach(key => {
        const valueKey = key as keyof AddDonationFormValues;
        const value = values[valueKey];
        if (value !== undefined && value !== null) {
            if (value instanceof Date) {
                formData.append(key, value.toISOString());
            } else if (Array.isArray(value)) {
                // For paymentScreenshots, handle array of files
                if (key === 'paymentScreenshots') {
                    value.forEach(file => {
                        if (file instanceof File) {
                            formData.append("paymentScreenshots", file);
                        }
                    });
                }
            } else {
                formData.append(key, String(value));
            }
        }
    });

    if (values.paymentScreenshotDataUrl) {
        formData.append("paymentScreenshotDataUrl", values.paymentScreenshotDataUrl);
    }
    
    const result = await handleAddDonation(formData);

    setIsSubmitting(false);

    if (result.success && result.donation) {
      toast({
        title: "Donation Added",
        description: `Successfully added donation from ${result.donation.donorName}.`,
      });
      handleCancel();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  const isFormInvalid = transactionIdState.isAvailable === false;
  const showOnlineFields = paymentMethod === 'Online (UPI/Card)' || paymentMethod === 'Bank Transfer';


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
           
             <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {paymentMethods.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {paymentMethod === 'Online (UPI/Card)' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5"/>
                        Payment Proof & Scanning
                    </h3>
                    <FormField
                    control={form.control}
                    name="paymentScreenshots"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload Screenshot</FormLabel>
                            <FormControl>
                                <Input 
                                    type="file" 
                                    accept="image/*,application/pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </FormControl>
                            <FormDescription>
                                Upload a screenshot to scan with AI or enter details manually.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    {localFiles.length > 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {localFiles.map((fp, index) => (
                                    <div key={index} className="p-2 border rounded-md bg-background space-y-2 group relative">
                                        {fp.file.type.startsWith('image/') ? (
                                            <Image src={fp.previewUrl} alt={`Preview ${index + 1}`} width={200} height={200} className="w-full h-auto object-contain rounded-md aspect-square" data-ai-hint="payment screenshot" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full bg-background rounded-md p-2">
                                                <FileText className="h-8 w-8 text-primary" />
                                                <p className="text-xs text-center break-all mt-2">{fp.file.name}</p>
                                            </div>
                                        )}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="h-7 w-7 rounded-full absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeFile(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        {isScanning ? (
                            <Button type="button" variant="destructive" className="w-full" onClick={stopScan}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Stop Scan
                            </Button>
                        ) : (
                            <Button type="button" variant="outline" className="w-full" onClick={handleScan} disabled={localFiles.length === 0}>
                                <ScanEye className="mr-2 h-4 w-4" />
                                Scan & Auto-Fill
                            </Button>
                        )}
                        <Button type="button" variant="secondary" className="w-full" onClick={handleExtractText} disabled={localFiles.length === 0 || isExtractingText}>
                            {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <TextSelect className="h-4 w-4" />}
                            Get Raw Text
                        </Button>
                    </div>
                </div>
            )}
            
            {(paymentMethod === 'Cash' || paymentMethod === 'Other') && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Manual Entry</AlertTitle>
                    <AlertDescription>
                        You are recording a {paymentMethod.toLowerCase()} donation. Please ensure all details are accurate.
                    </AlertDescription>
                </Alert>
            )}


           {rawText && (
                <div className="space-y-2">
                    <FormLabel htmlFor="rawTextOutput">Extracted Text</FormLabel>
                    <Textarea id="rawTextOutput" readOnly value={rawText} rows={10} className="text-xs font-mono" />
                    <FormDescription>Review the extracted text. You can copy-paste from here to correct any fields above.</FormDescription>
                </div>
            )}
            
            <h3 className="text-lg font-semibold border-b pb-2">Donation Details</h3>
            
            {isAdminView ? (
                <FormField
                    control={form.control}
                    name="donorId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Donor</FormLabel>
                        <Popover open={donorPopoverOpen} onOpenChange={setDonorPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value
                                    ? donorUsers.find(
                                        (user) => user.id === field.value
                                    )?.name
                                    : "Select a donor"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search donor..." />
                                <CommandList>
                                    <CommandEmpty>No donors found.</CommandEmpty>
                                    <CommandGroup>
                                    {donorUsers.map((user) => (
                                        <CommandItem
                                        value={user.name}
                                        key={user.id}
                                        onSelect={async () => {
                                            field.onChange(user.id!);
                                            const donor = await getUser(user.id!);
                                            setSelectedDonor(donor);
                                            setDonorPopoverOpen(false);
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
            ) : (
                currentUser && (
                    <div className="space-y-2">
                        <FormLabel>Donor</FormLabel>
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{currentUser.name}</span>
                        </div>
                        <FormDescription>You are submitting this donation for your own profile.</FormDescription>
                    </div>
                )
            )}
            
            <FormField
                control={form.control}
                name="includePledge"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!selectedDonor?.monthlyPledgeEnabled}
                        />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel>
                           Fulfill Monthly Pledge
                           {selectedDonor?.monthlyPledgeAmount && ` of ₹${selectedDonor.monthlyPledgeAmount.toLocaleString()}`}
                        </FormLabel>
                        <FormDescription>
                           This will record a separate donation fulfilling the monthly pledge. The total amount will be adjusted.
                        </FormDescription>
                        </div>
                    </FormItem>
                )}
            />
            
            <FormField
                control={form.control}
                name="includeTip"
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
                        Support for the Organization
                    </FormLabel>
                    <FormDescription>
                        Check this to include a small amount from the total transaction for organizational expenses.
                    </FormDescription>
                    </div>
                </FormItem>
                )}
            />
            
            {includeTip && (
                <div className="space-y-4 pl-4 border-l-2 ml-4">
                     <FormField
                        control={form.control}
                        name="tipAmount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contribution Amount for Organization</FormLabel>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {presetTipAmounts.map(amount => (
                                    <Button key={amount} type="button" variant={tipAmount === amount ? "default" : "outline"} onClick={() => field.onChange(amount)}>
                                        ₹{amount}
                                    </Button>
                                ))}
                            </div>
                            <FormControl>
                                <Input type="number" placeholder="Or enter custom amount" {...field} />
                            </FormControl>
                            <FormDescription>This amount will be recorded as a separate 'Sadaqah' donation for 'To Organization Use'.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            )}
            
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-base font-semibold">Linkage (Optional)</h3>
                <FormField
                    control={form.control}
                    name="linkToCampaign"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                            <FormLabel className="flex items-center gap-2 font-normal"><Megaphone className="h-4 w-4"/> Link to Campaign</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={(checked) => { field.onChange(checked); if(checked) setValue('linkToLead', false); }} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                {linkToCampaign && (
                    <FormField
                        control={form.control}
                        name="campaignId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant="outline"
                                        role="combobox"
                                        disabled={!!linkedLeadId}
                                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                        >
                                        {field.value
                                            ? campaigns.find(c => c.id === field.value)?.name
                                            : "Select a campaign"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search campaign..." />
                                    <CommandList>
                                        <CommandEmpty>No active campaigns found.</CommandEmpty>
                                        <CommandGroup>
                                        {(campaigns || []).filter(c => c.status !== 'Completed' && c.status !== 'Cancelled').map((campaign) => (
                                            <CommandItem
                                                value={campaign.name}
                                                key={campaign.id}
                                                onSelect={() => {
                                                    field.onChange(campaign.id!);
                                                    setCampaignPopoverOpen(false);
                                                    setValue('leadId', undefined); // Clear linked lead if campaign is selected
                                                }}
                                            >
                                            <Check className={cn("mr-2 h-4 w-4", campaign.id === field.value ? "opacity-100" : "opacity-0")} />
                                            {campaign.name} ({campaign.status})
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
                 <FormField
                    control={form.control}
                    name="linkToLead"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                            <FormLabel className="flex items-center gap-2 font-normal"><FileHeart className="h-4 w-4"/> Link to Lead</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={(checked) => { field.onChange(checked); if(checked) setValue('linkToCampaign', false); }} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 {linkToLead && (
                    <FormField
                    control={form.control}
                    name="leadId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                disabled={!!linkedCampaignId && linkedCampaignId !== 'none'}
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                >
                                {field.value
                                    ? leads.find(
                                        (lead) => lead.id === field.value
                                    )?.name
                                    : "Select a lead"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search lead by name or ID..." />
                                <CommandList>
                                    <CommandEmpty>No open leads found.</CommandEmpty>
                                    <CommandGroup>
                                    {(leads || []).map((lead) => (
                                        <CommandItem
                                        value={`${lead.name} ${lead.id}`}
                                        key={lead.id}
                                        onSelect={() => {
                                            field.onChange(lead.id!);
                                            setLeadPopoverOpen(false);
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            lead.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
                                        {lead.name} (Req: ₹{lead.helpRequested})
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
            </div>

            <FormField
            control={form.control}
            name="totalTransactionAmount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Total Transaction Amount</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Enter full amount from receipt" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Primary Donation Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {availableDonationTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        {selectedLead && (
                            <FormDescription>Only showing donation types acceptable for the selected lead.</FormDescription>
                        )}
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a purpose" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {donationPurposes.map(purpose => (
                                <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="donationDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Donation Date</FormLabel>
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
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormDescription>The date the transaction was made.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        
            {showOnlineFields && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">Online Transaction Details</h4>
                     
                     <FormField
                        control={form.control}
                        name="senderName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sender/Payer Name (if different from Donor)</FormLabel>
                                <FormControl><Input placeholder="Full name of the person who paid" {...field} /></FormControl><FormMessage />
                            </FormItem>
                        )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="paymentApp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment App</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment app" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {paymentApps.map(app => (
                                        <SelectItem key={app} value={app}>{app}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {paymentMethod === 'Bank Transfer' ? (
                             <FormField
                                control={form.control}
                                name="utrNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>UTR Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter UTR number" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        ) : (
                             <FormField
                                control={form.control}
                                name="transactionId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Primary Transaction ID</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter primary Transaction ID" {...field} />
                                    </FormControl>
                                        <AvailabilityFeedback state={transactionIdState} fieldName="Transaction ID" />
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>
             )}

          
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                      <Textarea placeholder="Add any internal notes, or comments from the screenshot." {...field} />
                  </FormControl>
                      <FormDescription>These notes are for internal use only and not visible to the donor.</FormDescription>
                  <FormMessage />
                  </FormItem>
              )}
          />

           <FormField
            control={form.control}
            name="isAnonymous"
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
                    Mark this Donation as Anonymous
                  </FormLabel>
                  <FormDescription>
                    If checked, the donor's name will be hidden from public view for this specific donation. This is automatically checked if the user's profile is set to anonymous.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {isAnonymous && selectedDonor && (
              <div className="space-y-2">
                  <FormLabel>Anonymous Donor ID</FormLabel>
                  <Input value={selectedDonor.anonymousDonorId || "Will be generated on save"} disabled />
                  <FormDescription>This ID will be used for public display to protect the donor's privacy.</FormDescription>
              </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || isFormInvalid}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Donation
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                <X className="mr-2 h-4 w-4" />
                Cancel
            </Button>
             <Button type="button" variant="secondary" onClick={clearForm} disabled={isSubmitting}>
                <XCircle className="mr-2 h-4 w-4" />
                Clear Form
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

export function AddDonationForm(props: AddDonationFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddDonationFormContent {...props} />
        </Suspense>
    )
}

```
- src/app/admin/donations/add/actions.ts
- `src/app/admin/transfers/add/add-transfer-form.tsx`
- `src/app/admin/transfers/add/actions.ts` (This file doesn't exist, I should check the related `leads` action file)
- `src/app/admin/leads/[id]/actions.ts` (This contains `handleFundTransfer`)
- `src/app/profile/settings/page.tsx`
- `src/app/profile/actions.ts`
- `src/app/register/register-form.tsx`
- `src/app/register/actions.ts`
- `src/services/types.ts`
- `src/app/admin/user-management/[id]/edit/edit-user-form.tsx`
- `src/app/admin/user-management/[id]/edit/actions.ts`
- `src/app/admin/user-management/add/add-user-form.tsx`
- `src/app/admin/user-management/add/actions.ts`

I will go through these files and add the necessary fields.

**Plan breakdown:**

1.  **`src/services/types.ts`**:
    *   `User`: Add `bankName?: string`. `bankIfscCode` is already present.
    *   `Donation`: Add `senderBankName?: string`, `senderIfscCode?: string`, `recipientBankName?: string`, `recipientIfscCode?: string`.
    *   `FundTransfer`: Add `senderBankName?: string`, `senderIfscCode?: string`, `recipientBankName?: string`, `recipientIfscCode?: string`.

2.  **User Profile (`/profile/settings/page.tsx`)**:
    *   Add `bankName` and `bankIfscCode` input fields to the form.
    *   Update `handleUpdateProfile` in `src/app/profile/actions.ts` to save these fields.

3.  **User Management (`/admin/user-management/...`)**:
    *   Add `bankName` and `bankIfscCode` to the "Add User" form and "Edit User" form.
    *   Update `handleAddUser` and `handleUpdateUser` actions accordingly.

4.  **Registration (`/register`)**:
    *   Add `bankName` and `bankIfscCode` to the registration form.
    *   Update `handleRegister` action to save these fields.

5.  **Add Donation (`/admin/donations/add/add-donation-form.tsx`)**:
    *   This form is complex. When "Bank Transfer" is selected, I need to add fields for sender bank details. The recipient details are already handled by selecting a recipient user.
    *   The form already has `donorBankAccount`. I will add `donorBankName` and `donorIfscCode`. I'll also check if recipient details are needed here. The logic seems to be about the *source* of the donation, so sender details are key. I will add `senderBankName` and `senderIfscCode`.
    *   Update `handleAddDonation` action in `src/app/admin/donations/add/actions.ts` to handle these new fields.

6.  **Add Transfer (`/admin/transfers/add/add-transfer-form.tsx`)**:
    *   This form is used to record a transfer *from* the admin/organization *to* a beneficiary/referral.
    *   It needs fields for sender bank details (org's) and recipient bank details.
    *   I'll add `senderBankName`, `senderIfscCode`, `recipientBankName`, `recipientIfscCode`.
    *   The action that handles this is `handleFundTransfer` in `src/app/admin/leads/[id]/actions.ts`. I will update it to save these new fields to the `fundTransfers` array within the `Lead` document.

I will proceed with these changes. It's a significant update touching many parts of the application to ensure data consistency.

I'll start with `src/services/types.ts`.
Then user forms.
Then donation/transfer forms.
Then the actions.

**File `src/services/types.ts`:**
- `User` has `bankAccountName`, `bankAccountNumber`, `bankIfscCode`. I will add `bankName`.
- `Donation` has `donorBankAccount`. I will add `senderBankName` and `senderIfscCode`. `recipientAccountNumber` is there, so I'll add `recipientBankName` and `recipientIfscCode`.
- `FundTransfer` has `senderAccountNumber`, `recipientAccountNumber`. I'll add `senderBankName`, `senderIfscCode`, `recipientBankName`, `recipientIfscCode`.

Okay, I have a clear plan. Let's start coding.

I will modify the following files:
- `src/services/types.ts`
- `src/app/admin/donations/add/add-donation-form.tsx`
- `src/app/admin/donations/add/actions.ts`
- `src/app/admin/leads/[id]/actions.ts` (for handleFundTransfer)
- `src/app/admin/transfers/add/add-transfer-form.tsx`
- `src/app/admin/user-management/add/add-user-form.tsx`
- `src/app/admin/user-management/add/actions.ts`
- `src/app/admin/user-management/[id]/edit/edit-user-form.tsx`
- `src/app/admin/user-management/[id]/edit/actions.ts`
- `src/app/profile/settings/page.tsx`
- `src/app/profile/actions.ts`
- `src/app/register/register-form.tsx`
- `src/app/register/actions.ts`

This is a large set of changes. I will be careful to provide the full content for each file. I will also check the `add-donation-form` to make sure the bank details section is correctly placed and conditionally rendered.

Let's review the forms.
`add-donation-form`: It has a section for "Online Transaction Details". I'll add the bank fields there, and make them appear only for 'Bank Transfer'.
`add-transfer-form`: It has a "Sender & Recipient Details" section. I will add the bank fields there.
`edit-user-form`: It has a "Verification & Payment Details" section. I will add the bank fields there.
`add-user-form`: Same as edit user form.
`register-form`: It has a "Payment Details" section. I will add the bank fields there.
`profile/settings`: I will add a new "Bank Details" section.

This seems correct and covers all user requests. I will now generate the XML.Of course. Capturing the full bank details for transfers is a critical requirement for proper accounting and tracking. I will add the "Bank Name" and "IFSC Code" fields to all relevant forms and update the backend to handle them.

Here is my plan to implement this across the application:

1.  **Update Data Models**: I will add `bankName` and `bankIfscCode` fields to the `User`, `Donation`, and `FundTransfer` types in `src/services/types.ts`. This ensures data consistency throughout the app.

2.  **Enhance User Profile & Registration**:
    *   **Registration Form**: New users will now have optional fields to enter their bank name and IFSC code when they sign up.
    *   **User Management**: Admins will be able to view and edit these new bank details in the "Add User" and "Edit User" forms.
    *   **Profile Page**: Logged-in users can update their own bank information on their profile settings page.

3.  **Refine Donation & Transfer Forms**:
    *   **Add Donation Form**: When an admin records a "Bank Transfer" donation, they will now have specific fields for the sender's Bank Name and IFSC Code.
    *   **Add Transfer Form**: When recording a fund transfer, the form will now include fields for both the sender's and the recipient's bank name and IFSC code, providing a complete record of the transaction.

I will now apply these changes to all the necessary files.

<changes>
  <description>Added "Bank Name" and "IFSC Code" fields to User, Donation, and Transfer models and their corresponding forms to improve bank transfer tracking.</description>
  <change>
    <file>/src/app/admin/donations/add/add-donation-form.tsx</file>
    <content><![CDATA[

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useState, useEffect, Suspense, useRef, useCallback, useMemo } from "react";
import { Loader2, Info, ImageIcon, CalendarIcon, FileText, Trash2, ChevronsUpDown, Check, X, ScanEye, User as UserIcon, TextSelect, XCircle, Users, AlertTriangle, Megaphone, FileHeart, Building, CheckCircle } from "lucide-react";
import type { User, DonationType, DonationPurpose, PaymentMethod, UserRole, Lead, Campaign, LeadPurpose } from "@/services/types";
import { getUser, getUserByPhone, getUserByUpiId, getUserByBankAccountNumber } from "@/services/user-service";
import { useSearchParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { handleAddDonation, checkTransactionId, scanProof, getRawTextFromImage } from "./actions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDebounce } from "@/hooks/use-debounce";
import { Switch } from "@/components/ui/switch";


const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'] as const;
const donationPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'To Organization Use', 'Loan Repayment', 'Other'] as const;
const paymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];
const paymentApps = ['Google Pay', 'PhonePe', 'Paytm'] as const;
const recipientRoles = ['Beneficiary', 'Referral', 'To Organization', 'Organization Member'] as const;

const categoryOptions: Record<string, string[]> = {
    'Education': ['School Fees', 'College Fees', 'Tuition Fees', 'Exam Fees', 'Hostel Fees', 'Books & Uniforms', 'Educational Materials', 'Other'],
    'Medical': ['Hospital Bill', 'Medication', 'Doctor Consultation', 'Surgical Procedure', 'Medical Tests', 'Medical Equipment', 'Other'],
    'Relief Fund': ['Ration Kit', 'Financial Aid', 'Disaster Relief', 'Shelter Assistance', 'Utility Bill Payment', 'Other'],
    'Deen': ['Masjid Maintenance', 'Madrasa Support', 'Da\'wah Activities', 'Other'],
    'Loan': ['Business Loan', 'Emergency Loan', 'Education Loan', 'Personal Loan', 'Other'],
};


const formSchema = z.object({
  donorId: z.string().min(1, "Please select a donor."),
  paymentMethod: z.enum(paymentMethods, { required_error: "Please select a payment method." }),
  recipientId: z.string().optional(),
  recipientRole: z.enum(recipientRoles).optional(),
  
  linkToCampaign: z.boolean().default(false),
  linkToLead: z.boolean().default(false),
  campaignId: z.string().optional(),
  leadId: z.string().optional(),

  isAnonymous: z.boolean().default(false),
  totalTransactionAmount: z.coerce.number().min(1, "Total amount must be greater than 0."),
  amount: z.coerce.number(), // This will hold the calculated primary donation amount
  donationDate: z.date(),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes, { required_error: "Please select a purpose." }),
  category: z.string().optional(),
  status: z.enum(["Pending", "Verified"]).default("Pending"),
  transactionId: z.string().optional(),
  utrNumber: z.string().optional(),
  googlePayTransactionId: z.string().optional(),
  phonePeTransactionId: z.string().optional(),
  paytmUpiReferenceNo: z.string().optional(),
  paymentApp: z.enum(paymentApps).optional(),
  senderPaymentApp: z.string().optional(),
  recipientPaymentApp: z.string().optional(),
  donorUpiId: z.string().optional(),
  donorPhone: z.string().optional(),
  donorBankAccount: z.string().optional(),
  senderName: z.string().optional(),
  phonePeSenderName: z.string().optional(),
  googlePaySenderName: z.string().optional(),
  paytmSenderName: z.string().optional(),
  recipientName: z.string().optional(),
  phonePeRecipientName: z.string().optional(),
  googlePayRecipientName: z.string().optional(),
  paytmRecipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientUpiId: z.string().optional(),
  recipientAccountNumber: z.string().optional(),
  paymentScreenshots: z.any().optional(),
  paymentScreenshotDataUrl: z.string().optional(),
  includeTip: z.boolean().default(false),
  tipAmount: z.coerce.number().optional(),
  includePledge: z.boolean().default(false),
  notes: z.string().optional(),
}).refine(data => {
    if (data.includeTip) {
        return !!data.tipAmount && data.tipAmount > 0;
    }
    return true;
}, {
    message: "Amount must be greater than 0.",
    path: ["tipAmount"],
}).refine(data => {
    if (data.includeTip && data.tipAmount) {
        return data.tipAmount < data.totalTransactionAmount;
    }
    return true;
}, {
    message: "Support amount cannot be greater than or equal to the total amount.",
    path: ["tipAmount"],
});

type AddDonationFormValues = z.infer<typeof formSchema>;

interface AddDonationFormProps {
  users: User[];
  leads: Lead[];
  campaigns: Campaign[];
  currentUser?: User | null;
}

interface FilePreview {
    file: File;
    previewUrl: string;
}

type AvailabilityState = {
    isChecking: boolean;
    isAvailable: boolean | null;
    existingDonationId?: string;
};

const initialAvailabilityState: AvailabilityState = {
    isChecking: false,
    isAvailable: null,
};

function AvailabilityFeedback({ state, fieldName }: { state: AvailabilityState, fieldName: string }) {
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
                    {state.existingDonationId && (
                        <Link href={`/admin/donations/${state.existingDonationId}/edit`} className="ml-1 underline hover:no-underline">
                            (View existing)
                        </Link>
                    )}.
                </p>
            </div>
        );
    }
    return null;
}

const initialFormValues: Partial<AddDonationFormValues> = {
    isAnonymous: false,
    totalTransactionAmount: 0,
    amount: 0,
    donationDate: new Date(),
    includeTip: false,
    tipAmount: 0,
    notes: "",
    paymentScreenshots: [],
    paymentScreenshotDataUrl: undefined,
    donorId: '',
    paymentMethod: 'Online (UPI/Card)',
    purpose: 'To Organization Use',
    category: undefined,
    status: 'Pending',
    transactionId: '',
    utrNumber: '',
    googlePayTransactionId: '',
    phonePeTransactionId: '',
    paytmUpiReferenceNo: '',
    paymentApp: undefined,
    senderPaymentApp: '',
    recipientPaymentApp: '',
    donorUpiId: '',
    donorPhone: '',
    donorBankAccount: '',
    senderName: '',
    phonePeSenderName: '',
    googlePaySenderName: '',
    paytmSenderName: '',
    recipientName: '',
    phonePeRecipientName: '',
    googlePayRecipientName: '',
    paytmRecipientName: '',
    recipientId: '',
    recipientRole: undefined,
    recipientPhone: '',
    recipientUpiId: '',
    recipientAccountNumber: '',
    leadId: '',
    campaignId: '',
    type: 'Sadaqah',
    includePledge: false,
    linkToCampaign: false,
    linkToLead: false,
};

const presetTipAmounts = [50, 100, 200];

function AddDonationFormContent({ users, leads, campaigns }: AddDonationFormProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<User | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [localFiles, setLocalFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [donorPopoverOpen, setDonorPopoverOpen] = useState(false);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);
  const [recipientPopoverOpen, setRecipientPopoverOpen] = useState(false);
  const scanAbortController = useRef<AbortController | null>(null);
  const [transactionIdState, setTransactionIdState] = useState<AvailabilityState>(initialAvailabilityState);

  const form = useForm<AddDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormValues,
  });
  
  const { watch, setValue, reset, getValues } = form;
  const includeTip = watch("includeTip");
  const totalTransactionAmount = watch("totalTransactionAmount");
  const tipAmount = watch("tipAmount");
  const isAnonymous = watch("isAnonymous");
  const recipientRole = watch("recipientRole");
  const transactionId = watch('transactionId');
  const debouncedTransactionId = useDebounce(transactionId, 500);

  const linkToLead = watch("linkToLead");
  const linkToCampaign = watch("linkToCampaign");
  const linkedLeadId = watch("leadId");
  const linkedCampaignId = watch("campaignId");
  const paymentMethod = watch("paymentMethod");
  const paymentApp = watch("paymentApp");
  const selectedPurpose = watch("purpose");
  const includePledge = watch("includePledge");
  
  // Fields for scanned details
  const scannedRecipientName = watch('recipientName');
  const scannedRecipientUpiId = watch('recipientUpiId');
  
  const selectedLead = useMemo(() => {
    if (!linkedLeadId) return null;
    return leads.find(l => l.id === linkedLeadId);
  }, [linkedLeadId, leads]);
  
  const availableDonationTypes = useMemo(() => {
    if (selectedLead && selectedLead.acceptableDonationTypes && selectedLead.acceptableDonationTypes.length > 0) {
        if(selectedLead.acceptableDonationTypes.includes('Any')) return donationTypes;
        return selectedLead.acceptableDonationTypes.filter(t => donationTypes.includes(t as any));
    }
    return donationTypes;
  }, [selectedLead]);
  
  useEffect(() => {
    const currentType = getValues('type');
    if (selectedLead && !availableDonationTypes.includes(currentType)) {
        setValue('type', availableDonationTypes[0] as (typeof donationTypes)[number], { shouldDirty: true });
    }
  }, [selectedLead, availableDonationTypes, setValue, getValues]);


  useEffect(() => {
    const total = totalTransactionAmount || 0;
    const pledge = (includePledge && selectedDonor?.monthlyPledgeEnabled && selectedDonor.monthlyPledgeAmount) ? selectedDonor.monthlyPledgeAmount : 0;
    const tip = includeTip ? (tipAmount || 0) : 0;
    const primaryAmount = Math.max(0, total - tip - pledge);
    setValue('amount', primaryAmount, { shouldDirty: true, shouldValidate: true });
  }, [totalTransactionAmount, tipAmount, includeTip, setValue, includePledge, selectedDonor]);


  useEffect(() => {
    const initializeUser = async () => {
      const storedUserId = localStorage.getItem('userId');
      setAdminUserId(storedUserId); // This is the user performing the action
      if (storedUserId) {
        const user = await getUser(storedUserId);
        setCurrentUser(user);
      }
    };
    initializeUser();
  }, []);
  
  const donorUsers = users.filter(u => u.roles.includes('Donor'));
  const isAdminView = currentUser?.roles.some(role => ['Admin', 'Super Admin', 'Finance Admin'].includes(role)) ?? false;


  const handleTxnIdCheck = useCallback(async (txnId: string) => {
    if (!txnId) {
        setTransactionIdState(initialAvailabilityState);
        return;
    }
    setTransactionIdState({ isChecking: true, isAvailable: null });
    const result = await checkTransactionId(txnId);
    setTransactionIdState({ 
        isChecking: false, 
        isAvailable: result.isAvailable,
        existingDonationId: result.existingDonationId
    });
  }, []);

  useEffect(() => {
    if (paymentApp !== 'PhonePe') {
        handleTxnIdCheck(debouncedTransactionId || '');
    }
  }, [debouncedTransactionId, handleTxnIdCheck, paymentApp]);


  const stopScan = () => {
    if (scanAbortController.current) {
        scanAbortController.current.abort();
        toast({ title: 'Scan Cancelled', description: 'The scanning process has been stopped.' });
    }
     setIsScanning(false);
  };


  const clearForm = () => {
    stopScan();
    reset(initialFormValues);
    setLocalFiles([]);
    setRawText(null);
    setSelectedDonor(null);
    setSelectedRecipient(null);
    setTransactionIdState(initialAvailabilityState);
    if(fileInputRef.current) fileInputRef.current.value = "";
    router.push('/admin/donations/add', { scroll: false });
  };
  
  const handleCancel = () => {
    // Context-aware redirect
    router.push(isAdminView ? '/admin/donations' : '/donate');
  }
  
    const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
    };

  useEffect(() => {
    const prefillData = async () => {
        const amountParam = searchParams.get('amount');
        const transactionIdParam = searchParams.get('transactionId');
        const donorIdParam = searchParams.get('donorId');
        const notesParam = searchParams.get('notes');
        const dateParam = searchParams.get('date');
        const donorUpiIdParam = searchParams.get('senderUpiId');
        const donorPhoneParam = searchParams.get('donorPhone');
        const donorBankAccountParam = searchParams.get('senderAccountNumber');
        const rawTextParam = searchParams.get('rawText');

        if (amountParam) setValue('totalTransactionAmount', parseFloat(amountParam));
        if (transactionIdParam) setValue('transactionId', transactionIdParam);
        if (notesParam) setValue('notes', notesParam);
        if (dateParam) setValue('donationDate', new Date(dateParam));
        if (donorUpiIdParam) setValue('donorUpiId', donorUpiIdParam);
        if (donorPhoneParam) setValue('donorPhone', donorPhoneParam);
        if (donorBankAccountParam) setValue('donorBankAccount', donorBankAccountParam);
        if (rawTextParam) setRawText(decodeURIComponent(rawTextParam));
        
        // If an admin is viewing, allow the donorId from URL.
        // If a donor is viewing, override with their own ID.
        let finalDonorId = donorIdParam;
        if (currentUser && !isAdminView) {
            finalDonorId = currentUser.id!;
            setValue('donorId', currentUser.id!);
            setSelectedDonor(currentUser);
        } else if(finalDonorId) {
            const foundUser = await getUser(finalDonorId);
            if (foundUser && foundUser.roles.includes('Donor')) {
                setValue('donorId', foundUser.id!);
                setSelectedDonor(foundUser);
            }
        }
        
        const screenshotData = sessionStorage.getItem('manualDonationScreenshot');
        if (screenshotData) {
            try {
                const { dataUrl } = JSON.parse(screenshotData);
                // Set the local file state to show the preview
                const file = await dataUrlToFile(dataUrl, 'scanned-screenshot.png');
                setLocalFiles([{ file, previewUrl: dataUrl }]);
                setValue('paymentScreenshotDataUrl', dataUrl);
            } catch (error) {
                console.error("Error processing session screenshot", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not load the screenshot for manual entry." });
            } finally {
                sessionStorage.removeItem('manualDonationScreenshot');
            }
        }
    }
    prefillData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue, toast, currentUser, isAdminView]);

  useEffect(() => {
    // This effect runs when a user is MANUALLY selected from the dropdown.
    if (selectedDonor && form.formState.touchedFields.donorId) {
        setValue('isAnonymous', !!selectedDonor.isAnonymousAsDonor);
        setValue('donorPhone', selectedDonor.phone);

        // Clear previous details
        setValue('donorUpiId', '');
        setValue('donorBankAccount', '');

        // Prioritize UPI ID if it exists and wasn't populated by a scan.
        const upiIdFromScan = getValues('donorUpiId');
        if (!upiIdFromScan && selectedDonor.upiIds && selectedDonor.upiIds.length > 0) {
            setValue('donorUpiId', selectedDonor.upiIds[0]);
        } 
        // Fallback to bank account only if no UPI was found from scan or profile.
        else if (!upiIdFromScan && selectedDonor.bankAccountNumber) {
             setValue('donorBankAccount', selectedDonor.bankAccountNumber);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDonor]);

  const handleExtractText = async () => {
    if (localFiles.length === 0) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please select a file first.' });
      return;
    }
    const file = localFiles[0].file;
    setIsExtractingText(true);
    const formData = new FormData();
    formData.append('imageFile', file);
    const result = await getRawTextFromImage(formData);
    if(result.success && result.text) {
        setRawText(result.text);
    } else {
         toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract text from the image.' });
    }
    setIsExtractingText(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
        if (paymentMethod === 'Other') { // Multi-file for "Other"
            const newPreviews = files.map(file => ({
                file,
                previewUrl: URL.createObjectURL(file)
            }));
            setLocalFiles(prev => [...prev, ...newPreviews]);
            setValue('paymentScreenshots', [...(getValues('paymentScreenshots') || []), ...files]);
        } else { // Single file for online methods
            const file = files[0];
            setRawText(null);
            setLocalFiles([{ file, previewUrl: URL.createObjectURL(file) }]);
            setValue('paymentScreenshots', [file]);
            setValue('paymentScreenshotDataUrl', ''); // Clear session storage data if a new file is uploaded
        }
    }
  };

  const handleScan = async () => {
    if (localFiles.length === 0) {
        toast({ variant: 'destructive', title: 'No File', description: 'Please select a screenshot to scan.' });
        return;
    }

    setIsScanning(true);
    scanAbortController.current = new AbortController();
    const formData = new FormData();
    formData.append('proofFile', localFiles[0].file);

    try {
        const scanResult = await scanProof(formData);
        
        if (scanAbortController.current?.signal.aborted) return;
        
        if (!scanResult || !scanResult.success || !scanResult.details) {
            throw new Error(scanResult?.error || "AI scan did not return any data. The image might be unreadable.");
        }
        
        toast({ variant: 'success', title: 'Scan Complete', description: 'Searching for matching donor...' });
        const details = scanResult.details;

        // Try to find a donor with the extracted details
        let foundDonor: User | null = null;
        if (details.senderUpiId) foundDonor = await getUserByUpiId(details.senderUpiId);
        if (!foundDonor && details.donorPhone) foundDonor = await getUserByPhone(details.donorPhone);
        if (!foundDonor && details.senderAccountNumber) foundDonor = await getUserByBankAccountNumber(details.senderAccountNumber);
        
        const queryParams = new URLSearchParams();
         for (const [key, value] of Object.entries(details)) {
            if (value !== undefined && value !== null) {
                 queryParams.set(key, String(value));
            }
        }
        
        const dataUrl = localFiles[0].previewUrl;
        sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({ dataUrl }));

        if (foundDonor) {
            toast({ variant: 'success', title: 'Donor Found!', description: `Redirecting to donation form for ${foundDonor.name}.` });
            queryParams.set('donorId', foundDonor.id!);
            router.push(`/admin/donations/add?${queryParams.toString()}`);
        } else {
            toast({ variant: 'destructive', title: 'Donor Not Found', description: 'Redirecting to create a new user profile.' });
            const newUserName = details.googlePaySenderName || details.phonePeSenderName || details.paytmSenderName || details.senderName;
            if(newUserName) queryParams.set('name', newUserName);
            if(details.senderUpiId) queryParams.set('upiId', details.senderUpiId);
            if(details.donorPhone) queryParams.set('phone', details.donorPhone);
            router.push(`/admin/user-management/add?${queryParams.toString()}`);
        }

    } catch (err) {
        if ((err as Error).name !== 'AbortError') {
            const error = err instanceof Error ? err.message : "An unknown error occurred during scanning.";
            toast({ variant: 'destructive', title: 'Scan Failed', description: error });
        }
    } finally {
        setIsScanning(false);
        scanAbortController.current = null;
    }
};


  const removeFile = (index: number) => {
    const updatedFiles = localFiles.filter((_, i) => i !== index);
    setLocalFiles(updatedFiles);
    setValue('paymentScreenshots', updatedFiles.map(f => f.file));
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: AddDonationFormValues) {
    if (!adminUserId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not identify the logged in user. Please log out and back in.",
        });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("adminUserId", adminUserId);
    Object.keys(values).forEach(key => {
        const valueKey = key as keyof AddDonationFormValues;
        const value = values[valueKey];
        if (value !== undefined && value !== null) {
            if (value instanceof Date) {
                formData.append(key, value.toISOString());
            } else if (Array.isArray(value)) {
                // For paymentScreenshots, handle array of files
                if (key === 'paymentScreenshots') {
                    value.forEach(file => {
                        if (file instanceof File) {
                            formData.append("paymentScreenshots", file);
                        }
                    });
                }
            } else {
                formData.append(key, String(value));
            }
        }
    });

    if (values.paymentScreenshotDataUrl) {
        formData.append("paymentScreenshotDataUrl", values.paymentScreenshotDataUrl);
    }
    
    const result = await handleAddDonation(formData);

    setIsSubmitting(false);

    if (result.success && result.donation) {
      toast({
        title: "Donation Added",
        description: `Successfully added donation from ${result.donation.donorName}.`,
      });
      handleCancel();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  const isFormInvalid = transactionIdState.isAvailable === false;
  const showOnlineFields = paymentMethod === 'Online (UPI/Card)' || paymentMethod === 'Bank Transfer';


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
           
             <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {paymentMethods.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {paymentMethod === 'Online (UPI/Card)' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5"/>
                        Payment Proof & Scanning
                    </h3>
                    <FormField
                    control={form.control}
                    name="paymentScreenshots"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload Screenshot</FormLabel>
                            <FormControl>
                                <Input 
                                    type="file" 
                                    accept="image/*,application/pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </FormControl>
                            <FormDescription>
                                Upload a screenshot to scan with AI or enter details manually.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    {localFiles.length > 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {localFiles.map((fp, index) => (
                                    <div key={index} className="p-2 border rounded-md bg-background space-y-2 group relative">
                                        {fp.file.type.startsWith('image/') ? (
                                            <Image src={fp.previewUrl} alt={`Preview ${index + 1}`} width={200} height={200} className="w-full h-auto object-contain rounded-md aspect-square" data-ai-hint="payment screenshot" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full bg-background rounded-md p-2">
                                                <FileText className="h-8 w-8 text-primary" />
                                                <p className="text-xs text-center break-all mt-2">{fp.file.name}</p>
                                            </div>
                                        )}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="h-7 w-7 rounded-full absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeFile(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        {isScanning ? (
                            <Button type="button" variant="destructive" className="w-full" onClick={stopScan}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Stop Scan
                            </Button>
                        ) : (
                            <Button type="button" variant="outline" className="w-full" onClick={handleScan} disabled={localFiles.length === 0}>
                                <ScanEye className="mr-2 h-4 w-4" />
                                Scan & Auto-Fill
                            </Button>
                        )}
                        <Button type="button" variant="secondary" className="w-full" onClick={handleExtractText} disabled={localFiles.length === 0 || isExtractingText}>
                            {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <TextSelect className="h-4 w-4" />}
                            Get Raw Text
                        </Button>
                    </div>
                </div>
            )}
            
            {(paymentMethod === 'Cash' || paymentMethod === 'Other') && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Manual Entry</AlertTitle>
                    <AlertDescription>
                        You are recording a {paymentMethod.toLowerCase()} donation. Please ensure all details are accurate.
                    </AlertDescription>
                </Alert>
            )}


           {rawText && (
                <div className="space-y-2">
                    <FormLabel htmlFor="rawTextOutput">Extracted Text</FormLabel>
                    <Textarea id="rawTextOutput" readOnly value={rawText} rows={10} className="text-xs font-mono" />
                    <FormDescription>Review the extracted text. You can copy-paste from here to correct any fields above.</FormDescription>
                </div>
            )}
            
            <h3 className="text-lg font-semibold border-b pb-2">Donation Details</h3>
            
            {isAdminView ? (
                <FormField
                    control={form.control}
                    name="donorId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Donor</FormLabel>
                        <Popover open={donorPopoverOpen} onOpenChange={setDonorPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value
                                    ? donorUsers.find(
                                        (user) => user.id === field.value
                                    )?.name
                                    : "Select a donor"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search donor..." />
                                <CommandList>
                                    <CommandEmpty>No donors found.</CommandEmpty>
                                    <CommandGroup>
                                    {donorUsers.map((user) => (
                                        <CommandItem
                                        value={user.name}
                                        key={user.id}
                                        onSelect={async () => {
                                            field.onChange(user.id!);
                                            const donor = await getUser(user.id!);
                                            setSelectedDonor(donor);
                                            setDonorPopoverOpen(false);
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
            ) : (
                currentUser && (
                    <div className="space-y-2">
                        <FormLabel>Donor</FormLabel>
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{currentUser.name}</span>
                        </div>
                        <FormDescription>You are submitting this donation for your own profile.</FormDescription>
                    </div>
                )
            )}
            
            <FormField
                control={form.control}
                name="includePledge"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!selectedDonor?.monthlyPledgeEnabled}
                        />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel>
                           Fulfill Monthly Pledge
                           {selectedDonor?.monthlyPledgeAmount && ` of ₹${selectedDonor.monthlyPledgeAmount.toLocaleString()}`}
                        </FormLabel>
                        <FormDescription>
                           This will record a separate donation fulfilling the monthly pledge. The total amount will be adjusted.
                        </FormDescription>
                        </div>
                    </FormItem>
                )}
            />
            
            <FormField
                control={form.control}
                name="includeTip"
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
                        Support for the Organization
                    </FormLabel>
                    <FormDescription>
                        Check this to include a small amount from the total transaction for organizational expenses.
                    </FormDescription>
                    </div>
                </FormItem>
                )}
            />
            
            {includeTip && (
                <div className="space-y-4 pl-4 border-l-2 ml-4">
                     <FormField
                        control={form.control}
                        name="tipAmount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contribution Amount for Organization</FormLabel>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {presetTipAmounts.map(amount => (
                                    <Button key={amount} type="button" variant={tipAmount === amount ? "default" : "outline"} onClick={() => field.onChange(amount)}>
                                        ₹{amount}
                                    </Button>
                                ))}
                            </div>
                            <FormControl>
                                <Input type="number" placeholder="Or enter custom amount" {...field} />
                            </FormControl>
                            <FormDescription>This amount will be recorded as a separate 'Sadaqah' donation for 'To Organization Use'.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            )}
            
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-base font-semibold">Linkage (Optional)</h3>
                <FormField
                    control={form.control}
                    name="linkToCampaign"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                            <FormLabel className="flex items-center gap-2 font-normal"><Megaphone className="h-4 w-4"/> Link to Campaign</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={(checked) => { field.onChange(checked); if(checked) setValue('linkToLead', false); }} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                {linkToCampaign && (
                    <FormField
                        control={form.control}
                        name="campaignId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant="outline"
                                        role="combobox"
                                        disabled={!!linkedLeadId}
                                        className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                        >
                                        {field.value
                                            ? campaigns.find(c => c.id === field.value)?.name
                                            : "Select a campaign"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search campaign..." />
                                    <CommandList>
                                        <CommandEmpty>No active campaigns found.</CommandEmpty>
                                        <CommandGroup>
                                        {(campaigns || []).filter(c => c.status !== 'Completed' && c.status !== 'Cancelled').map((campaign) => (
                                            <CommandItem
                                                value={campaign.name}
                                                key={campaign.id}
                                                onSelect={() => {
                                                    field.onChange(campaign.id!);
                                                    setCampaignPopoverOpen(false);
                                                    setValue('leadId', undefined); // Clear linked lead if campaign is selected
                                                }}
                                            >
                                            <Check className={cn("mr-2 h-4 w-4", campaign.id === field.value ? "opacity-100" : "opacity-0")} />
                                            {campaign.name} ({campaign.status})
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
                 <FormField
                    control={form.control}
                    name="linkToLead"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                            <FormLabel className="flex items-center gap-2 font-normal"><FileHeart className="h-4 w-4"/> Link to Lead</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={(checked) => { field.onChange(checked); if(checked) setValue('linkToCampaign', false); }} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 {linkToLead && (
                    <FormField
                    control={form.control}
                    name="leadId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                disabled={!!linkedCampaignId && linkedCampaignId !== 'none'}
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                >
                                {field.value
                                    ? leads.find(
                                        (lead) => lead.id === field.value
                                    )?.name
                                    : "Select a lead"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search lead by name or ID..." />
                                <CommandList>
                                    <CommandEmpty>No open leads found.</CommandEmpty>
                                    <CommandGroup>
                                    {(leads || []).map((lead) => (
                                        <CommandItem
                                        value={`${lead.name} ${lead.id}`}
                                        key={lead.id}
                                        onSelect={() => {
                                            field.onChange(lead.id!);
                                            setLeadPopoverOpen(false);
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            lead.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
                                        {lead.name} (Req: ₹{lead.helpRequested})
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
            </div>

            <FormField
            control={form.control}
            name="totalTransactionAmount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Total Transaction Amount</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Enter full amount from receipt" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Primary Donation Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {availableDonationTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        {selectedLead && (
                            <FormDescription>Only showing donation types acceptable for the selected lead.</FormDescription>
                        )}
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a purpose" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {donationPurposes.map(purpose => (
                                <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="donationDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Donation Date</FormLabel>
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
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormDescription>The date the transaction was made.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        
            {showOnlineFields && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg border-b pb-2">Online Transaction Details</h4>
                     
                     <FormField
                        control={form.control}
                        name="senderName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sender/Payer Name (if different from Donor)</FormLabel>
                                <FormControl><Input placeholder="Full name of the person who paid" {...field} /></FormControl><FormMessage />
                            </FormItem>
                        )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="paymentApp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment App</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment app" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {paymentApps.map(app => (
                                        <SelectItem key={app} value={app}>{app}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {paymentMethod === 'Bank Transfer' ? (
                             <FormField
                                control={form.control}
                                name="utrNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>UTR Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter UTR number" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        ) : (
                             <FormField
                                control={form.control}
                                name="transactionId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Primary Transaction ID</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter primary Transaction ID" {...field} />
                                    </FormControl>
                                        <AvailabilityFeedback state={transactionIdState} fieldName="Transaction ID" />
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>
             )}

          
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                      <Textarea placeholder="Add any internal notes, or comments from the screenshot." {...field} />
                  </FormControl>
                      <FormDescription>These notes are for internal use only and not visible to the donor.</FormDescription>
                  <FormMessage />
                  </FormItem>
              )}
          />

           <FormField
            control={form.control}
            name="isAnonymous"
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
                    Mark this Donation as Anonymous
                  </FormLabel>
                  <FormDescription>
                    If checked, the donor's name will be hidden from public view for this specific donation. This is automatically checked if the user's profile is set to anonymous.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {isAnonymous && selectedDonor && (
              <div className="space-y-2">
                  <FormLabel>Anonymous Donor ID</FormLabel>
                  <Input value={selectedDonor.anonymousDonorId || "Will be generated on save"} disabled />
                  <FormDescription>This ID will be used for public display to protect the donor's privacy.</FormDescription>
              </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || isFormInvalid}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Donation
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                <X className="mr-2 h-4 w-4" />
                Cancel
            </Button>
             <Button type="button" variant="secondary" onClick={clearForm} disabled={isSubmitting}>
                <XCircle className="mr-2 h-4 w-4" />
                Clear Form
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

export function AddDonationForm(props: AddDonationFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddDonationFormContent {...props} />
        </Suspense>
    )
}

