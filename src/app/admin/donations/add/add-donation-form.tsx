
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { Loader2, Info, ImageIcon, CalendarIcon, FileText, Trash2, ChevronsUpDown, Check, X, ScanEye, User as UserIcon, TextSelect, XCircle, Users, AlertTriangle, Megaphone, FileHeart, Building } from "lucide-react";
import type { User, DonationType, DonationPurpose, PaymentMethod, UserRole, Lead, Campaign } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUser, getUserByPhone, getUserByUpiId, getUserByBankAccountNumber } from "@/services/user-service";
import { useSearchParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { handleAddDonation, checkTransactionId } from "./actions";
import { scanProof, getRawTextFromImage } from '@/ai/text-extraction-actions';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDebounce } from "@/hooks/use-debounce";


const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'] as const;
const donationPurposes = ['Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use', 'Loan Repayment'] as const;
const paymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];
const paymentApps = ['Google Pay', 'PhonePe', 'Paytm'] as const;
const recipientRoles = ['Beneficiary', 'Referral', 'To Organization', 'Organization Member'] as const;

const formSchema = z.object({
  donorId: z.string().min(1, "Please select a donor."),
  paymentMethod: z.enum(paymentMethods),
  recipientId: z.string().optional(),
  recipientRole: z.enum(recipientRoles).optional(),
  leadId: z.string().optional(),
  campaignId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  donationDate: z.date(),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes).optional(),
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
  notes: z.string().optional(),
}).refine(data => {
    if (data.includeTip) {
        return !!data.tipAmount && data.tipAmount > 0;
    }
    return true;
}, {
    message: "Tip amount must be greater than 0.",
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
  const [manualScreenshotPreview, setManualScreenshotPreview] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [donorPopoverOpen, setDonorPopoverOpen] = useState(false);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [recipientPopoverOpen, setRecipientPopoverOpen] = useState(false);
  const scanAbortController = useRef<AbortController | null>(null);
  const [transactionIdState, setTransactionIdState] = useState<AvailabilityState>(initialAvailabilityState);

  const form = useForm<AddDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAnonymous: false,
      amount: 0,
      donationDate: new Date(),
      includeTip: false,
      tipAmount: 0,
      notes: "",
      paymentScreenshots: [],
      paymentScreenshotDataUrl: undefined,
    },
  });
  
  const { watch, setValue, reset, getValues } = form;
  const includeTip = watch("includeTip");
  const amount = watch("amount");
  const tipAmount = watch("tipAmount");
  const isAnonymous = watch("isAnonymous");
  const paymentApp = watch("paymentApp");
  const recipientRole = watch("recipientRole");
  const donorUpiId = watch("donorUpiId");
  const donorBankAccount = watch("donorBankAccount");
  const recipientUpiId = watch("recipientUpiId");
  const recipientAccountNumber = watch("recipientAccountNumber");
  const transactionId = watch('transactionId');
  const debouncedTransactionId = useDebounce(transactionId, 500);

  const linkedLeadId = watch("leadId");
  const linkedCampaignId = watch("campaignId");
  const paymentMethod = watch("paymentMethod");
  const showOnlineFields = paymentMethod === 'Online (UPI/Card)' || paymentMethod === 'Bank Transfer';

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
    handleTxnIdCheck(debouncedTransactionId || '');
  }, [debouncedTransactionId, handleTxnIdCheck]);


  const stopScan = () => {
    if (scanAbortController.current) {
        scanAbortController.current.abort();
        toast({ title: 'Scan Cancelled', description: 'The scanning process has been stopped.' });
    }
     setIsScanning(false);
  };


  const clearForm = () => {
    stopScan();
    reset({
      isAnonymous: false,
      amount: 0,
      donationDate: new Date(),
      includeTip: false,
      tipAmount: 0,
      notes: "",
      paymentScreenshots: [],
      paymentScreenshotDataUrl: undefined,
      donorId: undefined,
      recipientId: undefined,
      recipientRole: undefined,
      recipientPhone: undefined,
      recipientUpiId: undefined,
      recipientAccountNumber: undefined,
    });
    setLocalFiles([]);
    setRawText(null);
    setManualScreenshotPreview(null);
    setSelectedDonor(null);
    setSelectedRecipient(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    router.push('/admin/donations/add', { scroll: false });
  };
  
  const handleCancel = () => {
    // Context-aware redirect
    router.push(isAdminView ? '/admin/donations' : '/donate');
  }
  
  useEffect(() => {
    const prefillData = async () => {
        const amountParam = searchParams.get('amount');
        const transactionIdParam = searchParams.get('transactionId');
        const donorIdParam = searchParams.get('donorId');
        const notesParam = searchParams.get('notes');
        const dateParam = searchParams.get('date');
        const donorUpiIdParam = searchParams.get('donorUpiId');
        const donorPhoneParam = searchParams.get('donorPhone');
        const donorBankAccountParam = searchParams.get('bankAccountNumber');
        const rawTextParam = searchParams.get('rawText');

        if (amountParam) setValue('amount', parseFloat(amountParam));
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
                setManualScreenshotPreview(dataUrl);
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
  
  const totalAmount = (amount || 0) + (tipAmount || 0);

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
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        setRawText(null);
        const filePreview = {
            file,
            previewUrl: URL.createObjectURL(file)
        };
        setLocalFiles([filePreview]);
        setValue('paymentScreenshots', [file]);
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
      
      if (scanAbortController.current.signal.aborted) return;
      
      if (!scanResult || !scanResult.success || !scanResult.details) {
        throw new Error(scanResult?.error || "AI scan did not return any data. The image might be unreadable.");
      }
      
      const details = scanResult.details;
      toast({ variant: 'success', title: 'Data Extracted', description: 'Form fields have been populated. Checking for users...' });
      
      // Populate form with all extracted details first
      for (const [key, value] of Object.entries(details)) {
        if (value !== undefined && value !== null) {
          if (key === 'date' && typeof value === 'string') {
            setValue('donationDate', new Date(value), { shouldDirty: true });
          } else if (key === 'paymentApp' && typeof value === 'string' && ['Google Pay', 'PhonePe', 'Paytm'].includes(value)) {
            setValue('paymentApp', value as any, { shouldDirty: true });
            setValue('paymentMethod', 'Online (UPI/Card)', { shouldDirty: true });
          }
          else {
            setValue(key as any, value, { shouldDirty: true });
          }
        }
      }
      
      // Find DONOR
      let foundDonor: User | null = null;
      if (details.senderUpiId) foundDonor = await getUserByUpiId(details.senderUpiId);
      if (!foundDonor && details.donorPhone) foundDonor = await getUserByPhone(details.donorPhone);
      if (!foundDonor && details.senderAccountNumber) foundDonor = await getUserByBankAccountNumber(details.senderAccountNumber);

      if (foundDonor) {
          setSelectedDonor(foundDonor);
          setValue('donorId', foundDonor.id!, { shouldDirty: true });
          toast({
              variant: 'success',
              title: 'Donor Found!',
              description: `Automatically selected existing donor: ${foundDonor.name}`,
              icon: <UserIcon />,
          });
          // Populate fields from profile, prioritizing profile data unless scan data is more specific.
          setValue('senderName', foundDonor.name);
          if (!details.donorPhone) setValue('donorPhone', foundDonor.phone);
          
           if (details.senderUpiId) {
             setValue('donorUpiId', details.senderUpiId);
             setValue('donorBankAccount', '');
          } else if (foundDonor.upiIds && foundDonor.upiIds.length > 0) {
            setValue('donorUpiId', foundDonor.upiIds[0]);
            setValue('donorBankAccount', ''); 
          } else if (foundDonor.bankAccountNumber) {
              setValue('donorUpiId', '');
              setValue('donorBankAccount', details.senderAccountNumber || foundDonor.bankAccountNumber);
          }
      }
      
      // Find RECIPIENT
      if (details.recipientId) { // This implies the AI identified a user
          const foundRecipient = users.find(u => u.id === details.recipientId);
           if (foundRecipient) {
                setSelectedRecipient(foundRecipient);
                setValue('recipientId', foundRecipient.id);
                setValue('recipientPhone', foundRecipient.phone);
                setValue('recipientName', foundRecipient.name);
                if (foundRecipient.upiIds && foundRecipient.upiIds.length > 0) {
                    setValue('recipientUpiId', foundRecipient.upiIds[0]);
                } else {
                    setValue('recipientAccountNumber', foundRecipient.bankAccountNumber || '');
                }
                
                // Determine recipient role from found user's roles
                let suitableRole: 'Organization Member' | 'Beneficiary' | 'Referral' | undefined;
                if (foundRecipient.roles.includes('Admin') || foundRecipient.roles.includes('Super Admin')) {
                    suitableRole = 'Organization Member';
                } else if (foundRecipient.roles.includes('Beneficiary')) {
                    suitableRole = 'Beneficiary';
                } else if (foundRecipient.roles.includes('Referral')) {
                    suitableRole = 'Referral';
                }
                
                if (suitableRole) {
                    setValue('recipientRole', suitableRole);
                    toast({
                        variant: 'success',
                        title: 'Recipient Found!',
                        description: `Automatically selected: ${foundRecipient.name} as ${suitableRole}`,
                        icon: <UserIcon />,
                    });
                }
           }
      }

      if (details.rawText) {
        setRawText(details.rawText);
      }
      
    } catch(err) {
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
                if (key === 'paymentScreenshots' && value[0] instanceof File) {
                    formData.append("paymentScreenshots", value[0]);
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


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
            <h3 className="text-lg font-semibold border-b pb-2">Primary Details</h3>
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
          
            <fieldset disabled={paymentMethod === 'Cash'}>
                <div className={cn("space-y-4 p-4 border rounded-lg bg-muted/50", paymentMethod === 'Cash' && "opacity-50 cursor-not-allowed")}>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5"/>
                        Payment Proof & Scanning
                    </h3>
                    {manualScreenshotPreview ? (
                        <div className="flex justify-center">
                            <div className="relative w-full h-80">
                                    <Image src={manualScreenshotPreview} alt="Screenshot Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" />
                                </div>
                        </div>
                    ) : (
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
                                        disabled={paymentMethod === 'Cash'}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Upload a screenshot to scan with AI or enter details manually.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}

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
                                            disabled={paymentMethod === 'Cash'}
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
                            <Button type="button" variant="outline" className="w-full" onClick={handleScan} disabled={localFiles.length === 0 || paymentMethod === 'Cash'}>
                                <ScanEye className="mr-2 h-4 w-4" />
                                Scan & Auto-Fill
                            </Button>
                        )}
                        <Button type="button" variant="secondary" className="w-full" onClick={handleExtractText} disabled={localFiles.length === 0 || isExtractingText || paymentMethod === 'Cash'}>
                            {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <TextSelect className="h-4 w-4" />}
                            Get Raw Text
                        </Button>
                    </div>
                </div>
            </fieldset>

           {rawText && (
                <div className="space-y-2">
                    <FormLabel htmlFor="rawTextOutput">Extracted Text</FormLabel>
                    <Textarea id="rawTextOutput" readOnly value={rawText} rows={10} className="text-xs font-mono" />
                    <FormDescription>Review the extracted text. You can copy-paste from here to correct any fields above.</FormDescription>
                </div>
            )}

        
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

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-lg">Recipient (Optional)</h3>
                <FormField
                    control={form.control}
                    name="recipientRole"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Recipient Type</FormLabel>
                        <FormControl>
                        <RadioGroup
                            onValueChange={(value: any) => {
                                field.onChange(value);
                                setValue('recipientId', undefined);
                                setSelectedRecipient(null);
                            }}
                            value={field.value}
                            className="flex flex-wrap gap-x-4 gap-y-2"
                        >
                            <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="Beneficiary" /></FormControl>
                                <FormLabel className="font-normal">Beneficiary</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="Referral" /></FormControl>
                                <FormLabel className="font-normal">Referral</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="To Organization" /></FormControl>
                                <FormLabel className="font-normal">To Organization</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="Organization Member" /></FormControl>
                                <FormLabel className="font-normal">Organization Member</FormLabel>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {(recipientRole && recipientRole !== 'To Organization') && (
                     <FormField
                        control={form.control}
                        name="recipientId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Select {recipientRole}</FormLabel>
                            <Popover open={recipientPopoverOpen} onOpenChange={setRecipientPopoverOpen}>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between",!field.value && "text-muted-foreground")}
                                    >
                                    {field.value ? users.find((user) => user.id === field.value)?.name : `Select a ${recipientRole}`}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder={`Search ${recipientRole}...`} />
                                    <CommandList>
                                        <CommandEmpty>No {recipientRole}s found.</CommandEmpty>
                                        <CommandGroup>
                                            {users.filter(u => {
                                                if(recipientRole === 'Organization Member') return u.roles.includes('Admin') || u.roles.includes('Super Admin');
                                                if(recipientRole) return u.roles.includes(recipientRole as UserRole);
                                                return false;
                                            }).map((user) => (
                                                <CommandItem
                                                    value={user.name}
                                                    key={user.id}
                                                    onSelect={async () => {
                                                        field.onChange(user.id!);
                                                        setSelectedRecipient(user);
                                                        setRecipientPopoverOpen(false);
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
                 {recipientRole === 'To Organization' && (
                     <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">This donation will be marked for general organizational use.</span>
                    </div>
                )}
            </div>

             <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-lg">Linkage (Optional)</h3>
                 <FormField
                  control={form.control}
                  name="campaignId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Megaphone className="h-4 w-4"/> Link to Campaign</FormLabel>
                      <Select
                        onValueChange={(value) => {
                           field.onChange(value === 'none' ? '' : value);
                           if (value !== 'none') {
                               setValue('leadId', undefined); // Clear linked lead if campaign is selected
                           }
                        }}
                        value={field.value}
                        disabled={!!linkedLeadId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campaign" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {(campaigns || []).filter(c => c.status !== 'Completed' && c.status !== 'Cancelled').map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id!}>
                              {campaign.name} ({campaign.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Link this donation to a specific fundraising campaign.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2"><FileHeart className="h-4 w-4" />Link to Lead</FormLabel>
                       <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={!!linkedCampaignId && linkedCampaignId !== 'none'}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
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
                      <FormDescription>Allocate this donation to a specific help case.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <h3 className="text-lg font-semibold border-b pb-2">Payment Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Primary Donation Amount</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                </FormControl>
                    <FormDescription>The main amount for the donation's purpose.</FormDescription>
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
                    Split Transaction with Tip
                  </FormLabel>
                  <FormDescription>
                    Check this if the transaction includes a separate amount for organization expenses.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {includeTip && (
              <div className="space-y-4">
                  <FormField
                      control={form.control}
                      name="tipAmount"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Tip Amount</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="Enter tip amount" {...field} />
                          </FormControl>
                          <FormDescription>This amount will be recorded as a separate donation for 'To Organization Use'.</FormDescription>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Total Transaction Amount</AlertTitle>
                      <AlertDescription>
                          The total amount you should see on the bank statement is <span className="font-bold">₹{totalAmount.toLocaleString()}</span>.
                      </AlertDescription>
                  </Alert>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Primary Donation Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
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
                  <FormLabel>Primary Donation Purpose</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a purpose (optional)" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {donationPurposes.filter(p => p !== 'To Organization Use').map(purpose => (
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
                 {paymentApp === 'Google Pay' ? (
                    <FormField
                        control={form.control}
                        name="transactionId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>UPI Transaction ID</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter UPI Transaction ID" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 ) : (
                    <FormField
                        control={form.control}
                        name="utrNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>UTR Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter UTR number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 )}
            </div>
             <div className="space-y-4">
                {paymentApp === 'Google Pay' && (
                    <FormField
                        control={form.control}
                        name="googlePayTransactionId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Google Pay Transaction ID</FormLabel>
                            <FormControl>
                            <Input placeholder="Google Pay ID" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
                 {paymentApp === 'PhonePe' && (
                    <FormField
                        control={form.control}
                        name="phonePeTransactionId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>PhonePe Transaction ID</FormLabel>
                            <FormControl>
                            <Input placeholder="PhonePe ID" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 )}
                 {paymentApp === 'Paytm' && (
                    <FormField
                        control={form.control}
                        name="paytmUpiReferenceNo"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Paytm UPI Reference No</FormLabel>
                            <FormControl>
                            <Input placeholder="Paytm Ref No" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 )}
            </div>
            
            <h4 className="font-semibold text-lg border-b pb-2">Sender & Recipient Details</h4>
            
            <FormField control={form.control} name="senderName" render={({ field }) => (
                <FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input placeholder="Full name of the sender" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            {paymentApp === 'Google Pay' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="googlePaySenderName" render={({ field }) => (
                        <FormItem><FormLabel>Google Pay Sender Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="googlePayRecipientName" render={({ field }) => (
                        <FormItem><FormLabel>Google Pay Recipient Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            )}
            {paymentApp === 'PhonePe' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="phonePeSenderName" render={({ field }) => (
                        <FormItem><FormLabel>PhonePe Sender Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phonePeRecipientName" render={({ field }) => (
                        <FormItem><FormLabel>PhonePe Recipient Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            )}
             {paymentApp === 'Paytm' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="paytmSenderName" render={({ field }) => (
                        <FormItem><FormLabel>Paytm Sender Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="paytmRecipientName" render={({ field }) => (
                        <FormItem><FormLabel>Paytm Recipient Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            )}


            <h4 className="font-semibold text-sm">Donor Contact Details (for reference)</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="donorPhone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Donor Phone</FormLabel>
                        <FormControl>
                            <Input placeholder="10-digit phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {!donorBankAccount && (
                    <FormField
                        control={form.control}
                        name="donorUpiId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Donor UPI ID</FormLabel>
                                {selectedDonor?.upiIds && selectedDonor.upiIds.length > 0 ? (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a UPI ID" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {selectedDonor.upiIds.map((id) => (
                                                <SelectItem key={id} value={id}>{id}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <FormControl>
                                        <Input placeholder="e.g., username@okhdfc" {...field} />
                                    </FormControl>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
             {!donorUpiId && (
                <FormField
                    control={form.control}
                    name="donorBankAccount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Donor Bank Account (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="Last 4 digits or full number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
            )}
            
            <h4 className="font-semibold text-sm">Recipient Contact Details (for reference)</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="recipientPhone" render={({ field }) => (
                    <FormItem><FormLabel>Recipient Phone</FormLabel><FormControl><Input placeholder="10-digit phone number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 {!recipientAccountNumber && (
                    <FormField control={form.control} name="recipientUpiId" render={({ field }) => (
                        <FormItem><FormLabel>Recipient UPI ID</FormLabel><FormControl><Input placeholder="e.g., username@okaxis" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}
            </div>
             {!recipientUpiId && (
                <FormField control={form.control} name="recipientAccountNumber" render={({ field }) => (
                    <FormItem><FormLabel>Recipient Bank Account</FormLabel><FormControl><Input placeholder="Last 4 digits or full number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
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
