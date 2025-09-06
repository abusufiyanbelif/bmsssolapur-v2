
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
import { Loader2, Info, CalendarIcon, ChevronsUpDown, Check, X, ScanEye, TextSelect, XCircle, AlertTriangle, Bot, Text } from "lucide-react";
import type { User, Donation, DonationType, DonationPurpose, PaymentMethod, Lead, Campaign, ExtractDonationDetailsOutput } from "@/services/types";
import { getUser } from "@/services/user-service";
import { useSearchParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { handleAddDonation, checkTransactionId, handleExtractDonationDetails } from "./actions";
import { getRawTextFromImage } from '@/app/actions';
import { handleUpdateDonation } from '../[id]/edit/actions';
import { useDebounce } from "@/hooks/use-debounce";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";


const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Interest'] as const;
const donationPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'To Organization Use', 'Loan Repayment', 'Other'] as const;
const paymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];

const formSchema = z.object({
  donorId: z.string().min(1, "Please select a donor."),
  paymentMethod: z.enum(paymentMethods, { required_error: "Please select a payment method." }),
  
  isAnonymous: z.boolean().default(false),
  totalTransactionAmount: z.coerce.number().min(1, "Total amount must be greater than 0."),
  amount: z.coerce.number(),
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

  // Extracted details
  paymentApp: z.string().optional(),
  senderName: z.string().optional(),
  recipientName: z.string().optional(),
  
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
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

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
        recipientName: existingDonation?.recipientName,
        utrNumber: existingDonation?.utrNumber,
        googlePayTransactionId: existingDonation?.googlePayTransactionId,
        phonePeTransactionId: existingDonation?.phonePeTransactionId,
        paytmUpiReferenceNo: existingDonation?.paytmUpiReferenceNo,
    } : {
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
    },
  });
  
  const { watch, setValue, reset, getValues, control, trigger } = form;
  const includeTip = watch("includeTip");
  const totalTransactionAmount = watch("totalTransactionAmount");
  const tipAmount = watch("tipAmount");
  const transactionId = watch('transactionId');
  const debouncedTransactionId = useDebounce(transactionId, 500);
  const includePledge = watch("includePledge");
  
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

    // This effect runs once on mount to handle URL params
    const donorIdFromUrl = searchParams.get('donorId');
    if (donorIdFromUrl) {
      const user = users.find(u => u.id === donorIdFromUrl);
      if (user) {
        setValue('donorId', user.id!, { shouldValidate: true });
        setSelectedDonor(user);
      }
    }
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
        else {
          formData.append(key, String(value));
        }
      }
    });
    
    formData.append('adminUserId', adminUserId);


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
    } else {
      setValue('paymentScreenshot', null);
      setFile(null);
      setFilePreview(null);
      setRawText(null);
      setExtractedDetails(null);
    }
  };

  const handleScanText = async () => {
    if (!file) return;
    setIsScanning(true);
    setRawText(null);
    setExtractedDetails(null);
    try {
        const formData = new FormData();
        formData.append("imageFile", file);
        const result = await getRawTextFromImage(formData);

        if (result.success && result.rawText) {
            setRawText(result.rawText);
            toast({ variant: "success", title: "Text Extracted", description: "Raw text from the image is now available below."});
        } else {
            toast({ variant: 'destructive', title: "Scan Failed", description: result.error || "Could not extract text from the image." });
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
    if (result.success && result.details) {
        const { details } = result;
        setExtractedDetails(details);
        
        Object.entries(details).forEach(([key, value]) => {
            if (value !== undefined) {
                 if (key === 'amount') {
                    setValue('totalTransactionAmount', value as number);
                 } else if (key === 'date') {
                    setValue('donationDate', new Date(value as string));
                 } else if (key === 'type' && donationTypes.includes(value as any)) {
                    setValue('type', value as any);
                 } else if (key === 'purpose' && donationPurposes.includes(value as any)) {
                    setValue('purpose', value as any);
                 } else {
                    setValue(key as any, value);
                 }
            }
        });
        toast({ variant: "success", title: "Auto-fill Complete!", description: "Form has been populated. Please review." });
    } else {
        toast({ variant: "destructive", title: "Extraction Failed", description: result.error || "Could not extract details from text." });
    }
    setIsExtracting(false);
  };
  
  const isFormInvalid = transactionIdState.isAvailable === false;


  return (
    <>
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <FormField
                      control={form.control}
                      name="paymentScreenshot"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Payment Proof</FormLabel>
                              <FormControl>
                                  <Input 
                                      type="file" 
                                      accept="image/*,application/pdf"
                                      ref={fileInputRef}
                                      onChange={handleFileChange}
                                  />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  
                  {filePreview && (
                      <div className="flex flex-col items-center gap-4">
                          <Image src={filePreview} alt="Screenshot Preview" width={200} height={400} className="rounded-md object-contain" />
                      </div>
                  )}
                  {file && (
                     <div className="flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" onClick={handleScanText} disabled={isScanning} className="w-full">
                            {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                            {isScanning ? 'Scanning...' : 'Get Text from Image'}
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
              
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a method" />
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
                          <FormLabel>Purpose</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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

               {extractedDetails && (
                <div className="space-y-4 p-4 border rounded-lg bg-green-500/10">
                    <h3 className="font-semibold text-lg">Extracted Details (Review & Edit)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {extractedDetails.paymentApp && <FormField control={form.control} name="paymentApp" render={({field}) => (<FormItem><FormLabel>Payment App</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                        {extractedDetails.senderName && <FormField control={form.control} name="senderName" render={({field}) => (<FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                        {extractedDetails.recipientName && <FormField control={form.control} name="recipientName" render={({field}) => (<FormItem><FormLabel>Recipient Name</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                        {extractedDetails.utrNumber && <FormField control={form.control} name="utrNumber" render={({field}) => (<FormItem><FormLabel>UTR Number</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                        {extractedDetails.googlePayTransactionId && <FormField control={form.control} name="googlePayTransactionId" render={({field}) => (<FormItem><FormLabel>Google Pay ID</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                        {extractedDetails.phonePeTransactionId && <FormField control={form.control} name="phonePeTransactionId" render={({field}) => (<FormItem><FormLabel>PhonePe ID</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                        {extractedDetails.paytmUpiReferenceNo && <FormField control={form.control} name="paytmUpiReferenceNo" render={({field}) => (<FormItem><FormLabel>Paytm Ref No</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                    </div>
                </div>
               )}

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
