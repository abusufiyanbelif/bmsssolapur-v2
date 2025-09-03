
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
import type { User, Donation, DonationType, DonationPurpose, PaymentMethod, UserRole, Lead, Campaign, LeadPurpose } from "@/services/types";
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
import { handleUpdateDonation } from '../[id]/edit/actions';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDebounce } from "@/hooks/use-debounce";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Interest'] as const;
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
  status: z.enum(['Pending verification', 'Verified', 'Partially Allocated', 'Allocated', 'Failed/Incomplete']).default("Pending verification"),
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
  senderBankName: z.string().optional(),
  senderIfscCode: z.string().optional(),
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
  recipientBankName: z.string().optional(),
  recipientIfscCode: z.string().optional(),
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
}).refine(data => {
    if (['Online (UPI/Card)', 'Bank Transfer'].includes(data.paymentMethod)) {
        return !!data.paymentScreenshotDataUrl;
    }
    return true;
}, {
    message: 'A payment screenshot is required for this payment method.',
    path: ['paymentScreenshotDataUrl'],
});

type AddDonationFormValues = z.infer<typeof formSchema>;

interface AddDonationFormProps {
  users: User[];
  leads: Lead[];
  campaigns: Campaign[];
  currentUser?: User | null;
  existingDonation?: Donation;
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

const presetTipAmounts = [50, 100, 200];

function AddDonationFormContent({ users, leads, campaigns, existingDonation }: AddDonationFormProps) {
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
  const [localFiles, setLocalFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [donorPopoverOpen, setDonorPopoverOpen] = useState(false);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);
  const [transactionIdState, setTransactionIdState] = useState<AvailabilityState>(initialAvailabilityState);
  
  const isEditing = !!existingDonation;

  const form = useForm<AddDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        donorId: existingDonation?.donorId || '',
        paymentMethod: existingDonation?.paymentMethod || 'Online (UPI/Card)',
        recipientId: existingDonation?.recipientId || '',
        recipientRole: existingDonation?.recipientRole || undefined,
        linkToCampaign: !!existingDonation?.campaignId,
        linkToLead: !!existingDonation?.leadId,
        campaignId: existingDonation?.campaignId || undefined,
        leadId: existingDonation?.leadId || undefined,
        isAnonymous: existingDonation?.isAnonymous || false,
        totalTransactionAmount: existingDonation?.amount || 0,
        amount: existingDonation?.amount || 0,
        donationDate: existingDonation?.donationDate ? new Date(existingDonation.donationDate) : new Date(),
        type: existingDonation?.type || 'Sadaqah',
        purpose: existingDonation?.purpose || 'To Organization Use',
        category: existingDonation?.category || '',
        status: existingDonation?.status || 'Pending verification',
        transactionId: existingDonation?.transactionId || '',
        utrNumber: existingDonation?.utrNumber || '',
        googlePayTransactionId: existingDonation?.googlePayTransactionId || '',
        phonePeTransactionId: existingDonation?.phonePeTransactionId || '',
        paytmUpiReferenceNo: existingDonation?.paytmUpiReferenceNo || '',
        paymentApp: (existingDonation?.paymentApp as any) || undefined,
        senderPaymentApp: existingDonation?.senderPaymentApp || '',
        recipientPaymentApp: existingDonation?.recipientPaymentApp || '',
        donorUpiId: existingDonation?.donorUpiId || '',
        donorPhone: existingDonation?.donorPhone || '',
        donorBankAccount: existingDonation?.donorBankAccount || '',
        senderName: existingDonation?.senderName || '',
        phonePeSenderName: existingDonation?.phonePeSenderName || '',
        googlePaySenderName: existingDonation?.googlePaySenderName || '',
        paytmSenderName: existingDonation?.paytmSenderName || '',
        recipientName: existingDonation?.recipientName || '',
        phonePeRecipientName: existingDonation?.phonePeRecipientName || '',
        googlePayRecipientName: existingDonation?.googlePayRecipientName || '',
        paytmRecipientName: existingDonation?.paytmRecipientName || '',
        recipientPhone: existingDonation?.recipientPhone || '',
        recipientUpiId: existingDonation?.recipientUpiId || '',
        recipientAccountNumber: existingDonation?.recipientAccountNumber || '',
        paymentScreenshots: [],
        paymentScreenshotDataUrl: existingDonation?.paymentScreenshotUrls?.[0] || '',
        includeTip: false,
        tipAmount: 0,
        includePledge: false,
        notes: existingDonation?.notes || '',
    },
  });
  
  const { watch, setValue, reset, getValues, control, trigger } = form;
  const includeTip = watch("includeTip");
  const totalTransactionAmount = watch("totalTransactionAmount");
  const tipAmount = watch("tipAmount");
  const isAnonymous = watch("isAnonymous");
  const transactionId = watch('transactionId');
  const debouncedTransactionId = useDebounce(transactionId, 500);

  const linkToLead = watch("linkToLead");
  const linkToCampaign = watch("linkToCampaign");
  const linkedLeadId = watch("leadId");
  const linkedCampaignId = watch("campaignId");
  const paymentMethod = watch("paymentMethod");
  const paymentApp = watch("paymentApp");
  const includePledge = watch("includePledge");
  
  const showProofSection = useMemo(() => {
    return ['Online (UPI/Card)', 'Bank Transfer'].includes(paymentMethod);
  }, [paymentMethod]);

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
    if (!txnId || (isEditing && txnId === existingDonation?.transactionId)) {
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
  }, [isEditing, existingDonation]);

  useEffect(() => {
    if (paymentApp !== 'PhonePe') {
        handleTxnIdCheck(debouncedTransactionId || '');
    }
  }, [debouncedTransactionId, handleTxnIdCheck, paymentApp]);
  
  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
    };

  useEffect(() => {
    const prefillData = async () => {
        if(isEditing) {
            const donor = await getUser(existingDonation.donorId);
            setSelectedDonor(donor);
            if(existingDonation.paymentScreenshotUrls && existingDonation.paymentScreenshotUrls.length > 0) {
                setLocalFiles([{ file: new File([], 'existing-proof.png'), previewUrl: existingDonation.paymentScreenshotUrls[0] }]);
            }
            if(existingDonation.rawText) {
                setRawText(existingDonation.rawText);
            }
            return;
        }

        const screenshotData = sessionStorage.getItem('manualDonationScreenshot');
        if (screenshotData) {
            try {
                const { details, dataUrl } = JSON.parse(screenshotData);
                
                Object.entries(details).forEach(([key, value]) => {
                    if(value) {
                         if (key === 'date') {
                             setValue('donationDate', new Date(value as string));
                         } else if (key === 'amount') {
                             setValue('totalTransactionAmount', value as number);
                         } else {
                             setValue(key as any, value);
                         }
                    }
                });

                if (details.donorId) {
                    const foundUser = await getUser(details.donorId);
                     if (foundUser) setSelectedDonor(foundUser);
                }

                if (dataUrl) {
                    const file = await dataUrlToFile(dataUrl, 'scanned-screenshot.png');
                    setLocalFiles([{ file, previewUrl: dataUrl }]);
                    setValue('paymentScreenshots', [file], { shouldValidate: true });
                    setValue('paymentScreenshotDataUrl', dataUrl, { shouldValidate: true });
                }
            } catch (error) {
                console.error("Error processing session screenshot", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not load the screenshot data." });
            } finally {
                sessionStorage.removeItem('manualDonationScreenshot');
            }
        }
    }
    prefillData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);


  async function onSubmit(values: AddDonationFormValues) {
    if (!adminUserId) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify admin. Please log in again." });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (key === 'paymentScreenshots' && Array.isArray(value) && value[0] instanceof File) {
             formData.append("paymentScreenshots", value[0]);
        } else if (Array.isArray(value)) {
            // This will handle non-file arrays, like upiIds
        }
        else {
          formData.append(key, String(value));
        }
      }
    });
    
    formData.append('adminUserId', adminUserId);
    formData.append('paymentScreenshotDataUrl', values.paymentScreenshotDataUrl || '');


    const result = isEditing 
        ? await handleUpdateDonation(existingDonation.id!, formData, adminUserId)
        : await handleAddDonation(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: isEditing ? "Donation Updated" : "Donation Added",
        description: `Successfully ${isEditing ? 'updated' : 'added'} donation.`,
      });
       if(!isEditing) {
        router.push('/admin/donations');
      }
    } else {
      toast({
        variant: "destructive",
        title: `Error ${isEditing ? 'Updating' : 'Adding'} Donation`,
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  const isFormInvalid = transactionIdState.isAvailable === false;


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground" )}
                            >
                            {selectedDonor?.name || "Select a donor"}
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
            
            <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); trigger('paymentScreenshotDataUrl'); }} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select a payment method" /></SelectTrigger>
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

             {showProofSection && (
                 <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <FormField
                        control={form.control}
                        name="paymentScreenshotDataUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Proof</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept="image/*,application/pdf"
                                        ref={fileInputRef}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setValue('paymentScreenshotDataUrl', reader.result as string, { shouldValidate: true });
                                                };
                                                reader.readAsDataURL(file);
                                            } else {
                                                setValue('paymentScreenshotDataUrl', '', { shouldValidate: true });
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {watch('paymentScreenshotDataUrl') && (
                        <div className="flex flex-col items-center gap-2">
                            <Image src={watch('paymentScreenshotDataUrl')} alt="Screenshot Preview" width={200} height={400} className="rounded-md object-contain" />
                             <Button type="button" variant="ghost" size="sm" onClick={() => {
                                if(fileInputRef.current) fileInputRef.current.value = "";
                                setValue('paymentScreenshotDataUrl', '', { shouldValidate: true });
                            }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </Button>
                        </div>
                    )}
                 </div>
             )}

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
            
             <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {Object.values(['Pending verification', 'Verified', 'Partially Allocated', 'Allocated', 'Failed/Incomplete']).map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
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
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                    <FormDescription>The date the transaction was made.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />

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
                    If checked, the donor&apos;s name will be hidden from public view for this specific donation.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || isFormInvalid}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Donation'}
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
