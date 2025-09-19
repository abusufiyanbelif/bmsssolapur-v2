// src/app/admin/donations/add/add-donation-form.tsx
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
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { Loader2, Info, CalendarIcon, ChevronsUpDown, Check, X, ScanEye, TextSelect, XCircle, AlertTriangle, Bot, Text, ZoomIn, ZoomOut, FileIcon, UserPlus, UserSearch, ScanSearch, UserRoundPlus } from "lucide-react";
import type { User, Donation, DonationType, DonationPurpose, PaymentMethod, Lead, Campaign, ExtractDonationDetailsOutput, ExtractBeneficiaryDetailsOutput } from "@/services/types";
import { getUser, checkAvailability } from "@/services/user-service";
import { useSearchParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { handleAddDonation, checkTransactionId, handleExtractDonationDetails } from "./actions";
import { findDonorByDetails } from "./find-donor-action";
import { getRawTextFromImage } from '@/app/actions';
import { handleUpdateDonation } from '../[id]/edit/actions';
import { useDebounce } from "@/hooks/use-debounce";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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


const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Interest'] as const;
const donationPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'To Organization Use', 'Loan Repayment', 'Other'] as const;
const paymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];
const paymentApps = ['Google Pay', 'PhonePe', 'Paytm', 'Other'] as const;

const formSchema = z.object({
  donorId: z.string().min(1, "Please select an existing donor."),
  paymentMethod: z.enum(paymentMethods, { required_error: "Please select a payment method." }),
  
  isAnonymous: z.boolean().default(false),
  totalTransactionAmount: z.coerce.number().min(0, "Total amount must be positive.").optional(),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  donationDate: z.date(),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes, { required_error: "Please select a purpose." }),
  status: z.enum(['Pending verification', 'Verified', 'Partially Allocated', 'Allocated', 'Failed/Incomplete']).default("Pending verification"),
  
  transactionId: z.string().optional(),
  utrNumber: z.string().optional(),
  googlePayTransactionId: z.string().optional(),
  phonePeTransactionId: z.string().optional(),
  paytmUpiReferenceNo: z.string().optional(),
  
  paymentScreenshot: z.any().optional(),

  includeTip: z.boolean().default(false),
  tipAmount: z.coerce.number().optional(),
  includePledge: z.boolean().default(false),
  notes: z.string().optional(),

  // Linking fields
  leadId: z.string().optional(),
  campaignId: z.string().optional(),

  // Extracted details
  paymentApp: z.string().optional(),
  time: z.string().optional(),
  senderName: z.string().optional(),
  senderBankName: z.string().optional(),
  phonePeSenderName: z.string().optional(),
  googlePaySenderName: z.string().optional(),
  paytmSenderName: z.string().optional(),
  recipientName: z.string().optional(),
  phonePeRecipientName: z.string().optional(),
  googlePayRecipientName: z.string().optional(),
  paytmRecipientName: z.string().optional(),
  donorPhone: z.string().optional(),
  recipientPhone: z.string().optional(),
  senderUpiId: z.string().optional(),
  recipientUpiId: z.string().optional(),
  senderAccountNumber: z.string().optional(),
  recipientAccountNumber: z.string().optional(),
  
  // Profile update flags
  updateDonorPhone: z.boolean().default(false),
  updateDonorUpiId: z.boolean().default(false),
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
        return data.tipAmount < (data.totalTransactionAmount || 0);
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
  existingDonation?: Donation;
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

const initialFormValues: Partial<AddDonationFormValues> = {
    donorId: '',
    paymentMethod: 'Online (UPI/Card)',
    isAnonymous: false,
    totalTransactionAmount: 0,
    amount: 0,
    donationDate: new Date(),
    type: 'Sadaqah',
    purpose: 'To Organization Use',
    status: 'Pending verification',
    transactionId: '',
    notes: '',
    includeTip: false,
    tipAmount: 0,
    includePledge: false,
    paymentScreenshot: null,
    leadId: 'none',
    campaignId: 'none',
    senderName: '',
    senderBankName: '',
    senderUpiId: '',
    recipientName: '',
    recipientUpiId: '',
    time: '',
    utrNumber: '',
    googlePayTransactionId: '',
    phonePeTransactionId: '',
    paytmUpiReferenceNo: '',
    phonePeSenderName: '',
    googlePaySenderName: '',
    paytmSenderName: '',
    phonePeRecipientName: '',
    googlePayRecipientName: '',
    paytmRecipientName: '',
    updateDonorPhone: false,
    updateDonorUpiId: false,
};

function AddDonationFormContent({ users, leads, campaigns, existingDonation }: AddDonationFormProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [donorPopoverOpen, setDonorPopoverOpen] = useState(false);
  const [transactionIdState, setTransactionIdState] = useState<AvailabilityState>(initialAvailabilityState);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Mismatch state
  const [showPhoneUpdate, setShowPhoneUpdate] = useState(false);
  const [showUpiUpdate, setShowUpiUpdate] = useState(false);

  const [extractedDetails, setExtractedDetails] = useState<ExtractDonationDetailsOutput | null>(null);

  const isEditing = !!existingDonation;
  
  const form = useForm<AddDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
        donorId: existingDonation?.donorId,
        paymentMethod: existingDonation?.paymentMethod,
        isAnonymous: existingDonation?.isAnonymous,
        totalTransactionAmount: existingDonation?.amount,
        amount: existingDonation?.amount,
        donationDate: new Date(existingDonation!.donationDate),
        type: existingDonation?.type,
        purpose: existingDonation?.purpose,
        status: existingDonation?.status,
        transactionId: existingDonation?.transactionId,
        notes: existingDonation?.notes,
        paymentScreenshot: existingDonation?.paymentScreenshotUrls?.[0] || null,
        paymentApp: existingDonation?.paymentApp,
        senderName: existingDonation?.senderName,
        senderBankName: existingDonation?.senderBankName,
        senderUpiId: existingDonation?.senderUpiId,
        recipientName: existingDonation?.recipientName,
        recipientUpiId: existingDonation?.recipientUpiId,
        utrNumber: existingDonation?.utrNumber,
        googlePayTransactionId: existingDonation?.googlePayTransactionId,
        phonePeTransactionId: existingDonation?.phonePeTransactionId,
        paytmUpiReferenceNo: existingDonation?.paytmUpiReferenceNo,
        phonePeSenderName: existingDonation?.phonePeSenderName,
        googlePaySenderName: existingDonation?.googlePaySenderName,
        paytmSenderName: existingDonation?.paytmSenderName,
        phonePeRecipientName: existingDonation?.phonePeRecipientName,
        googlePayRecipientName: existingDonation?.googlePayRecipientName,
        paytmRecipientName: existingDonation?.paytmRecipientName,
        leadId: existingDonation?.leadId || 'none',
        campaignId: existingDonation?.campaignId || 'none',
        time: existingDonation?.time,
    } : initialFormValues,
  });
  
  const { watch, setValue, reset, getValues, control } = form;
  const includeTip = watch("includeTip");
  const totalTransactionAmount = watch("totalTransactionAmount");
  const tipAmount = watch("tipAmount");
  const transactionId = watch('transactionId');
  const debouncedTransactionId = useDebounce(transactionId, 500);
  const includePledge = watch("includePledge");
  const paymentMethod = watch("paymentMethod");
  const paymentApp = watch("paymentApp");
  
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
    handleTxnIdCheck(debouncedTransactionId || '');
  }, [debouncedTransactionId, handleTxnIdCheck]);
  
  useEffect(() => {
    const total = totalTransactionAmount || 0;
    const pledge = (includePledge && selectedDonor?.monthlyPledgeEnabled && selectedDonor.monthlyPledgeAmount) ? selectedDonor.monthlyPledgeAmount : 0;
    const tip = includeTip ? (tipAmount || 0) : 0;
    const primaryAmount = Math.max(0, total - tip - pledge);
    setValue('amount', primaryAmount, { shouldDirty: true, shouldValidate: true });
  }, [totalTransactionAmount, tipAmount, includeTip, setValue, includePledge, selectedDonor]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);

    const initializeForm = async () => {
        const donorIdFromUrl = searchParams.get('donorId');
        if (donorIdFromUrl) {
            const user = users.find(u => u.id === donorIdFromUrl);
            if (user) {
                setValue('donorId', user.id!, { shouldValidate: true });
                setSelectedDonor(user);
            }
        }
        if (isEditing && existingDonation?.donorId) {
            const donor = users.find(u => u.id === existingDonation.donorId);
            if(donor) setSelectedDonor(donor);
        }
    }
    initializeForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const donorUsers = users.filter(u => u.roles.includes('Donor'));

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
        } else if (key === 'paymentScreenshot' && value instanceof File) {
            formData.append('paymentScreenshot', value);
        }
        else if (typeof value === 'boolean') {
          if (value) formData.append(key, 'on');
        }
        else {
          formData.append(key, String(value));
        }
      }
    });
    
    formData.append('adminUserId', adminUserId);
    formData.append('donorType', 'existing'); // Assume existing for this simplified flow


    const result = isEditing 
        ? await handleUpdateDonation(existingDonation.id!, formData, adminUserId)
        : await handleAddDonation(formData);

    setIsSubmitting(false);

    if (result.success) {
      if (isEditing) {
          toast({
              title: "Donation Updated",
              description: "Successfully updated donation record.",
          });
      } else if (result.donationId) {
          router.push(`/admin/donations/add/success?id=${result.donationId}`);
      }
    } else {
      toast({
        variant: "destructive",
        title: `Error ${isEditing ? 'Updating' : 'Adding'} Donation`,
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('paymentScreenshot', file, { shouldValidate: true });
      const preview = URL.createObjectURL(file);
      setFile(file);
      setFilePreview(preview);
      setRawText(null); // Clear old text on new file
      setExtractedDetails(null);
      setAutoFilledFields(new Set());
      setZoom(1);
    } else {
      clearFile();
    }
  };

  const clearFile = () => {
    setValue('paymentScreenshot', null);
    setFile(null);
    setFilePreview(null);
    setRawText(null);
    setExtractedDetails(null);
    setAutoFilledFields(new Set());
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }
  
  const clearForm = () => {
    reset(initialFormValues);
    clearFile();
    setSelectedDonor(null);
    setAutoFilledFields(new Set());
    setShowPhoneUpdate(false);
    setShowUpiUpdate(false);
  }

 const handleScanText = async () => {
    if (!file) return;
    setIsScanning(true);
    setRawText(null);
    setExtractedDetails(null);
    setAutoFilledFields(new Set());
    try {
        const formData = new FormData();
        formData.append("file_0", file);
        const result = await getRawTextFromImage(formData);

        if (result.success && result.rawText) {
            setRawText(result.rawText);
            toast({ variant: "success", title: "Text Extracted", description: "Raw text from the document is now available below."});
        } else {
            toast({ variant: 'destructive', title: "Scan Failed", description: result.error || "Could not extract text from the document." });
        }
    } catch (e) {
        toast({ variant: 'destructive', title: "Error", description: e instanceof Error ? e.message : "An unknown error occurred." });
    } finally {
        setIsScanning(false);
    }
  };
  
   const handleAutoFill = async () => {
    if (!rawText) return;
    setIsExtracting(true);
    const result = await handleExtractDonationDetails(rawText);

    if (!result.success || !result.details) {
        toast({ variant: "destructive", title: "Extraction Failed", description: result.error || "Could not extract details from text." });
        setIsExtracting(false);
        return;
    }

    const { details } = result;
    setExtractedDetails(details);
    
    const newAutoFilledFields = new Set<string>();
    Object.entries(details).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
                newAutoFilledFields.add(key);
                if (key === 'amount') {
                setValue('totalTransactionAmount', value as number, { shouldDirty: true });
                } else if (key === 'date' && typeof value === 'string') {
                setValue('donationDate', new Date(value), { shouldDirty: true });
                } else if (key === 'type' && donationTypes.includes(value as any)) {
                setValue('type', value as any, { shouldDirty: true });
                } else if (key === 'purpose' && donationPurposes.includes(value as any)) {
                setValue('purpose', value as any, { shouldDirty: true });
                } else {
                setValue(key as any, value, { shouldDirty: true });
                }
        }
    });
    setAutoFilledFields(newAutoFilledFields);
    toast({ variant: "success", title: "Auto-fill Complete!", description: "Form populated. Searching for donor..." });

    // After filling form, automatically search for the donor
    const donor = await findDonorByDetails({
        upiId: details.senderUpiId,
        phone: details.donorPhone,
        name: details.senderName,
    });
    
    setShowPhoneUpdate(false);
    setShowUpiUpdate(false);

    if (donor) {
        setValue('donorId', donor.id, { shouldDirty: true });
        setSelectedDonor(donor);
        toast({ variant: "success", title: "Donor Found!", description: `Automatically selected existing donor: ${donor.name}` });

        // Check for new phone number
        if(details.donorPhone && !donor.upiPhoneNumbers?.includes(details.donorPhone) && donor.phone !== details.donorPhone) {
            setShowPhoneUpdate(true);
        }
        // Check for new UPI ID
        if(details.senderUpiId && !donor.upiIds?.includes(details.senderUpiId)) {
            setShowUpiUpdate(true);
        }

    } else {
        toast({ variant: "default", title: "New Donor", description: `No existing donor found. Please create one.` });
        const query = new URLSearchParams();
        if(details.senderName) query.set('name', details.senderName);
        if(details.donorPhone) query.set('phone', details.donorPhone);
        if(details.senderUpiId) query.set('upiId', details.senderUpiId);
        if(filePreview) sessionStorage.setItem('donationScreenshot', filePreview);
        
        router.push(`/admin/user-management/add?role=Donor&redirect_url=/admin/donations/add&${query.toString()}`);
    }

    setIsExtracting(false);
  };
  
  const isFormInvalid = transactionIdState.isAvailable === false;
  
   const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom(prevZoom => Math.max(0.5, Math.min(prevZoom - e.deltaY * 0.001, 5)));
  };

     const getFieldClass = (fieldName: string) => {
        return autoFilledFields.has(fieldName) ? "bg-green-100 dark:bg-green-900/50" : "";
    };


  return (
    <>
      <Accordion type="single" collapsible className="w-full mb-8">
            <AccordionItem value="scan-payment-proof">
                <AccordionTrigger>
                    <div className="flex items-center gap-2 text-primary">
                        <ScanEye className="h-5 w-5" />
                        Scan Payment Proof (Optional)
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Upload a payment screenshot to automatically fill in the donation details.</p>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="paymentScreenshotFile">Screenshot File</Label>
                            <Input id="paymentScreenshotFile" name="paymentScreenshot" type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" />
                        </div>
                        {filePreview && (
                            <div className="relative group p-2 border rounded-lg">
                                <div onWheel={handleWheel} className="relative w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto cursor-zoom-in">
                                     {file?.type.startsWith('image/') ? (
                                        <Image src={filePreview} alt="Proof preview" width={800 * zoom} height={800 * zoom} className="object-contain transition-transform duration-100" style={{ transform: `scale(${zoom})` }} />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                                            <FileIcon className="h-16 w-16" />
                                            <span className="text-sm font-semibold">{file?.name}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-1 rounded-md">
                                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => z * 1.2)}><ZoomIn className="h-4 w-4"/></Button>
                                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.5, z / 1.2))}><ZoomOut className="h-4 w-4"/></Button>
                                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={clearFile}><X className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        )}
                        {file && (
                           <div className="flex flex-col sm:flex-row gap-2">
                              <Button type="button" variant="outline" className="w-full" onClick={handleScanText} disabled={isScanning}>
                                  {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                                  Get Text from Image
                              </Button>
                              {rawText && (
                                  <Button type="button" onClick={handleAutoFill} disabled={isExtracting} className="w-full">
                                      {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                      Auto-fill Form
                                  </Button>
                              )}
                           </div>
                        )}
                        {rawText && (
                            <div className="space-y-2">
                                <Label>Extracted Text</Label>
                                <Textarea value={rawText} readOnly rows={5} className="text-xs font-mono" />
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center gap-4">
                <FormField
                    control={form.control}
                    name="donorId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col flex-grow">
                        <FormLabel>Donor</FormLabel>
                        <Popover open={donorPopoverOpen} onOpenChange={setDonorPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground" )}
                                disabled={isEditing}
                                >
                                {selectedDonor?.name || "Search by name, phone, Aadhaar..."}
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
                                        value={`${user.name} ${user.phone} ${user.aadhaarNumber}`}
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
                <Button asChild variant="outline" className="mt-8">
                    <Link href="/admin/user-management/add?role=Donor">
                        <UserPlus className="mr-2 h-4 w-4"/> New
                    </Link>
                </Button>
              </div>
              
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                      control={form.control}
                      name="totalTransactionAmount"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Total Transaction Amount</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="Enter full amount from receipt" {...field} className={getFieldClass('amount')} />
                          </FormControl>
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
                                      className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground", getFieldClass('date'))}
                                      >
                                      {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
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
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                </div>
              
                <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-medium">Transaction Details</h3>
                     <FormField
                        control={form.control}
                        name="paymentApp"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment App</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={getFieldClass('paymentApp')}><SelectValue placeholder="Select the app used" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {paymentApps.map(app => ( <SelectItem key={app} value={app}>{app}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <FormField control={form.control} name="transactionId" render={({ field }) => (<FormItem><FormLabel>Primary Transaction ID</FormLabel><FormControl><Input {...field} className={getFieldClass('transactionId')} /></FormControl><FormMessage /></FormItem>)} />
                        
                        {paymentApp === 'Google Pay' && (
                            <div className="space-y-4 p-2 border-l-2 border-blue-500">
                                <h4 className="font-semibold text-sm text-blue-600">Google Pay Details</h4>
                                <FormField control={form.control} name="googlePayTransactionId" render={({ field }) => (<FormItem><FormLabel>Google Pay Transaction ID</FormLabel><FormControl><Input {...field} className={getFieldClass('googlePayTransactionId')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="googlePaySenderName" render={({ field }) => (<FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input {...field} className={getFieldClass('googlePaySenderName')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="senderUpiId" render={({ field }) => (<FormItem><FormLabel>Sender UPI ID</FormLabel><FormControl><Input {...field} className={getFieldClass('senderUpiId')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="googlePayRecipientName" render={({ field }) => (<FormItem><FormLabel>Recipient Name</FormLabel><FormControl><Input {...field} className={getFieldClass('googlePayRecipientName')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="recipientUpiId" render={({ field }) => (<FormItem><FormLabel>Recipient UPI ID</FormLabel><FormControl><Input {...field} className={getFieldClass('recipientUpiId')} /></FormControl></FormItem>)} />
                            </div>
                        )}
                         {paymentApp === 'PhonePe' && (
                            <div className="space-y-4 p-2 border-l-2 border-purple-500">
                                <h4 className="font-semibold text-sm text-purple-600">PhonePe Details</h4>
                                <FormField control={form.control} name="phonePeSenderName" render={({field}) => (<FormItem><FormLabel>PhonePe Sender Name</FormLabel><FormControl><Input {...field} className={getFieldClass('phonePeSenderName')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="phonePeTransactionId" render={({field}) => (<FormItem><FormLabel>PhonePe Transaction ID</FormLabel><FormControl><Input {...field} className={getFieldClass('phonePeTransactionId')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="phonePeRecipientName" render={({field}) => (<FormItem><FormLabel>PhonePe Recipient Name</FormLabel><FormControl><Input {...field} className={getFieldClass('phonePeRecipientName')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="senderUpiId" render={({ field }) => (<FormItem><FormLabel>Sender UPI ID</FormLabel><FormControl><Input {...field} className={getFieldClass('senderUpiId')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="recipientUpiId" render={({ field }) => (<FormItem><FormLabel>Recipient UPI ID</FormLabel><FormControl><Input {...field} className={getFieldClass('recipientUpiId')} /></FormControl></FormItem>)} />
                            </div>
                        )}
                         {paymentApp === 'Paytm' && (
                             <div className="space-y-4 p-2 border-l-2 border-sky-500">
                                <h4 className="font-semibold text-sm text-sky-600">Paytm Details</h4>
                                <FormField control={form.control} name="paytmUpiReferenceNo" render={({field}) => (<FormItem><FormLabel>Paytm UPI Reference No.</FormLabel><FormControl><Input {...field} className={getFieldClass('paytmUpiReferenceNo')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="paytmSenderName" render={({field}) => (<FormItem><FormLabel>Paytm Sender Name</FormLabel><FormControl><Input {...field} className={getFieldClass('paytmSenderName')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="paytmRecipientName" render={({field}) => (<FormItem><FormLabel>Paytm Recipient Name</FormLabel><FormControl><Input {...field} className={getFieldClass('paytmRecipientName')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="senderUpiId" render={({ field }) => (<FormItem><FormLabel>Sender UPI ID</FormLabel><FormControl><Input {...field} className={getFieldClass('senderUpiId')} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="recipientUpiId" render={({ field }) => (<FormItem><FormLabel>Recipient UPI ID</FormLabel><FormControl><Input {...field} className={getFieldClass('recipientUpiId')} /></FormControl></FormItem>)} />
                            </div>
                        )}
                        {(extractedDetails?.utrNumber || (paymentMethod === 'Bank Transfer' && paymentApp !== 'Google Pay')) && <FormField control={form.control} name="utrNumber" render={({ field }) => (<FormItem><FormLabel>UTR Number</FormLabel><FormControl><Input {...field} className={getFieldClass('utrNumber')} /></FormControl></FormItem>)} />}
                         <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input {...field} className={getFieldClass('time')} /></FormControl></FormItem>)} />
                         <FormField control={form.control} name="senderBankName" render={({ field }) => (<FormItem><FormLabel>Sender Bank</FormLabel><FormControl><Input {...field} className={getFieldClass('senderBankName')} /></FormControl></FormItem>)} />
                          {showUpiUpdate && <FormField control={form.control} name="updateDonorUpiId" render={({field}) => (<FormItem className="flex items-center gap-2 rounded-md border p-3 bg-blue-50"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Add new UPI ID <span className="font-semibold">{getValues('senderUpiId')}</span> to <span className="font-semibold">{selectedDonor?.name}</span>'s profile?</FormLabel></FormItem>)} />}
                          {showPhoneUpdate && <FormField control={form.control} name="updateDonorPhone" render={({field}) => (<FormItem className="flex items-center gap-2 rounded-md border p-3 bg-blue-50"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm font-normal">Add new Phone <span className="font-semibold">{getValues('donorPhone')}</span> to <span className="font-semibold">{selectedDonor?.name}</span>'s profile?</FormLabel></FormItem>)} />}
                    </div>

                    {transactionIdState.isChecking && <p className="text-xs text-muted-foreground flex items-center mt-2"><Loader2 className="mr-2 h-3 w-3 animate-spin" />Checking for duplicates...</p>}
                    {transactionIdState.isAvailable === false && <p className="text-xs text-destructive flex items-center mt-2"><AlertTriangle className="mr-2 h-3 w-3" /> A donation with this ID already exists. <Link href={`/admin/donations/${transactionIdState.existingDonationId}/edit`} className="ml-1 underline">View it.</Link></p>}
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Primary Donation Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                              <SelectTrigger className={getFieldClass('type')}><SelectValue placeholder="Select a category" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                              {donationTypes.map(type => (
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
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                              <SelectTrigger className={getFieldClass('purpose')}><SelectValue placeholder="Select a purpose" /></SelectTrigger>
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
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Lead (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead to support" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.name} (Req: ₹{lead.helpRequested})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Allocate this donation to a specific beneficiary's case.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="campaignId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Campaign (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campaign" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Allocate this donation to a specific campaign drive.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               </div>

               <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting || isFormInvalid}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isEditing ? 'Save Changes' : 'Add Donation'}
                  </Button>
                   <Button type="button" variant="outline" onClick={clearForm} disabled={isSubmitting}>
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
