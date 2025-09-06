
'use client';

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
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { Loader2, Info, ImageIcon, CalendarIcon, FileText, Trash2, ChevronsUpDown, Check, X, ScanEye, User as UserIcon, TextSelect, XCircle, Users, AlertTriangle, Megaphone, FileHeart, Building, CheckCircle, FileUp, UploadCloud, Bot, Text } from "lucide-react";
import type { User, Lead, PaymentMethod, Campaign, UserRole } from "@/services/types";
import { getUser, getUserByPhone, getUserByUpiId } from "@/services/user-service";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { handleAddTransfer } from "./actions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { handleExtractDonationDetails } from "@/app/admin/donations/add/actions";
import { getRawTextFromImage } from '@/app/actions';

const paymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];
const paymentApps = ['Google Pay', 'PhonePe', 'Paytm'] as const;

const formSchema = z.object({
  leadId: z.string().min(1, "Please select a lead/beneficiary."),
  campaignId: z.string().optional(),
  recipientType: z.enum(['Beneficiary', 'Referral']).default('Beneficiary'),
  recipientId: z.string().optional(),
  paymentMethod: z.enum(paymentMethods, { required_error: "Please select a payment method." }),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  transactionDate: z.date(),
  transactionId: z.string().optional(),
  utrNumber: z.string().optional(),
  proof: z.any().optional(),
  notes: z.string().optional(),
  paymentApp: z.enum(paymentApps).optional(),
  googlePayTransactionId: z.string().optional(),
  phonePeTransactionId: z.string().optional(),
  paytmUpiReferenceNo: z.string().optional(),
  // Participant details
  senderName: z.string().optional(),
  phonePeSenderName: z.string().optional(),
  googlePaySenderName: z.string().optional(),
  paytmSenderName: z.string().optional(),
  senderPhone: z.string().optional(),
  senderAccountNumber: z.string().optional(),
  senderBankName: z.string().optional(),
  senderIfscCode: z.string().optional(),
  senderUpiId: z.string().optional(),
  recipientName: z.string().optional(),
  phonePeRecipientName: z.string().optional(),
  googlePayRecipientName: z.string().optional(),
  paytmRecipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientAccountNumber: z.string().optional(),
  recipientBankName: z.string().optional(),
  recipientIfscCode: z.string().optional(),
  recipientUpiId: z.string().optional(),
  status: z.string().optional(),
}).refine(data => {
    if (['Online (UPI/Card)', 'Bank Transfer'].includes(data.paymentMethod)) {
        return !!data.proof;
    }
    return true;
}, {
    message: "A proof file is required for this payment method.",
    path: ["proof"],
});

type AddTransferFormValues = z.infer<typeof formSchema>;

const initialFormValues: Partial<AddTransferFormValues> = {
  amount: 0,
  transactionDate: new Date(),
  paymentMethod: 'Online (UPI/Card)',
  recipientType: 'Beneficiary',
  leadId: undefined,
  campaignId: undefined,
  recipientId: undefined,
  transactionId: '',
  utrNumber: '',
  googlePayTransactionId: '',
  phonePeTransactionId: '',
  paytmUpiReferenceNo: '',
  paymentApp: undefined,
  proof: undefined,
  notes: '',
  senderName: '',
  senderPhone: '',
  senderAccountNumber: '',
  senderBankName: '',
  senderIfscCode: '',
  senderUpiId: '',
  recipientName: '',
  recipientPhone: '',
  recipientAccountNumber: '',
  recipientBankName: '',
  recipientIfscCode: '',
  recipientUpiId: '',
  status: '',
};

interface AddTransferFormProps {
    leads: Lead[];
    campaigns: Campaign[];
    users: User[];
}

function AddTransferFormContent({ leads, campaigns, users }: AddTransferFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [referralPopoverOpen, setReferralPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [beneficiaryDetails, setBeneficiaryDetails] = useState<User | null>(null);
  const [recipientDetails, setRecipientDetails] = useState<User | null>(null);
  const [transferMethod, setTransferMethod] = useState<'record' | 'scan'>('record');
  const [extractedDetails, setExtractedDetails] = useState<any | null>(null);
  
  const potentialReferrals = users.filter(u => u.roles.includes("Referral"));

  const form = useForm<AddTransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormValues,
  });

  const { watch, setValue, reset, control, trigger, register, handleSubmit } = form;
  const paymentMethod = watch("paymentMethod");
  const selectedLeadId = watch("leadId");
  const paymentApp = watch("paymentApp");
  const recipientType = watch("recipientType");
  const selectedRecipientId = watch("recipientId");

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  
   const transactionIdLabel = useMemo(() => {
        if (paymentMethod === 'Bank Transfer') return 'UTR Number';
        switch (paymentApp) {
            case 'PhonePe': return 'Transaction ID';
            case 'Paytm': return 'UPI Ref. No';
            case 'Google Pay': return 'UPI Transaction ID';
            default: return 'Primary Transaction ID';
        }
    }, [paymentApp, paymentMethod]);


  const clearForm = () => {
    reset(initialFormValues);
    setFile(null);
    setPreviewUrl(null);
    setRawText(null);
    setBeneficiaryDetails(null);
    setRecipientDetails(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
  }, []);
  
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
        setPreviewUrl(null);
    }
  }, [file]);
  
  useEffect(() => {
    const fetchBeneficiary = async () => {
      if (selectedLead?.beneficiaryId) {
        try {
            const beneficiary = await getUser(selectedLead.beneficiaryId);
            setBeneficiaryDetails(beneficiary);
            setValue('recipientType', 'Beneficiary');
        } catch (e) {
            console.error("Failed to fetch beneficiary details", e);
            setBeneficiaryDetails(null);
        }
      } else {
        setBeneficiaryDetails(null);
      }
    };
    fetchBeneficiary();
  }, [selectedLead, setValue]);

  useEffect(() => {
      if (recipientType === 'Beneficiary') {
          setRecipientDetails(beneficiaryDetails);
      } else if (recipientType === 'Referral') {
          const referral = users.find(u => u.id === selectedRecipientId);
          setRecipientDetails(referral || null);
      } else {
          setRecipientDetails(null);
      }
  }, [recipientType, beneficiaryDetails, selectedRecipientId, users]);

  const handleScan = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please select a screenshot to scan.' });
      return;
    }
    
    setIsScanning(true);
    
    try {
        const formData = new FormData();
        formData.append("imageFile", file);
        const textResult = await getRawTextFromImage(formData);

        if (textResult.success && textResult.rawText) {
            const result = await handleExtractDonationDetails(textResult.rawText);
            
            if (result.success && result.details) {
                toast({ variant: 'success', title: 'Scan Successful!', description: 'Form fields populated. Please review.' });
                 setExtractedDetails(result.details);
                Object.entries(result.details).forEach(([key, value]) => {
                    if (value && key !== 'rawText') {
                        if (key === 'date') setValue('transactionDate', new Date(value as string));
                        else if (key === 'amount') setValue('amount', value as number);
                        else setValue(key as any, value);
                    }
                });
                if (textResult.rawText) setRawText(textResult.rawText);
                setTransferMethod('record');
                trigger();
            } else {
                 toast({ variant: 'destructive', title: 'Detail Extraction Failed', description: result.error || 'Could not extract details from the text.' });
            }
        } else {
             toast({ variant: 'destructive', title: 'Text Extraction Failed', description: textResult.error || 'Could not extract text from the image.' });
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'Scan Failed', description: e instanceof Error ? e.message : "Could not extract details." });
    }
    setIsScanning(false);
  };
  
   const handleExtractText = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select a payment screenshot first.' });
      return;
    }
    setIsExtractingText(true);
    try {
        const formData = new FormData();
        formData.append("imageFile", file);
        const result = await getRawTextFromImage(formData);
        if (result.success && result.rawText) {
            setRawText(result.rawText);
        } else {
            toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract text from the image.' });
        }
    } catch(e) {
        toast({ variant: 'destructive', title: 'Extraction Failed', description: e instanceof Error ? e.message : 'Could not extract text from the image.' });
    }
    setIsExtractingText(false);
  };

   const onFormSubmit = async (data: AddTransferFormValues) => {
    if (!adminUserId) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Could not identify the logged-in administrator. Please log out and back in." });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    for (const key in data) {
        const value = data[key as keyof typeof data];
        if (value) {
            if(key === 'proof' && value instanceof File) {
                formData.append('proof', value);
            } else if (value instanceof Date) {
                formData.append(key, value.toISOString());
            } else {
                formData.append(key, String(value));
            }
        }
    }
    formData.append("adminUserId", adminUserId);
    if(file) formData.append("proof", file);

    const result = await handleAddTransfer(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({ variant: "success", title: "Transfer Recorded", description: "The fund transfer has been successfully recorded." });
      router.push("/admin/transfers");
    } else {
      toast({ variant: "destructive", title: "Submission Failed", description: result.error || "An unknown error occurred." });
    }
  };
  
  return (
    <>
       <div className="grid grid-cols-2 gap-4 mb-8">
          <Button 
              variant={transferMethod === 'record' ? 'default' : 'outline'}
              onClick={() => setTransferMethod('record')}
              className="h-16 text-base"
          >
              <FileUp className="mr-2"/> Record a Transfer
          </Button>
          <Button
              variant={transferMethod === 'scan' ? 'default' : 'outline'}
              onClick={() => setTransferMethod('scan')}
              className="h-16 text-base"
          >
              <ScanEye className="mr-2"/> Scan Proof
          </Button>
      </div>

    {transferMethod === 'scan' ? (
        <div className="space-y-6">
            <FormField
                control={control}
                name="proof"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Upload Screenshot</FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept="image/*,application/pdf"
                                ref={fileInputRef}
                                onChange={(e) => { field.onChange(e.target.files?.[0]); setFile(e.target.files?.[0] || null); }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {previewUrl && (
                <div className="relative w-full h-96"><Image src={previewUrl} alt="Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" /></div>
            )}
             <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={handleExtractText} disabled={!file || isExtractingText}>
                    {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                    Get Raw Text
                </Button>
                <Button type="button" className="w-full" onClick={handleScan} disabled={!file || isScanning}>
                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Auto-fill Form
                </Button>
            </div>
             {rawText && (
                <div className="space-y-2">
                    <Label htmlFor="rawTextOutput">Extracted Text</Label>
                    <Textarea id="rawTextOutput" readOnly value={rawText} rows={8} className="text-xs font-mono" />
                </div>
            )}
        </div>
    ) : (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
            <h3 className="text-lg font-semibold border-b pb-2">Recipient & Case Details</h3>
            <FormField
                control={control}
                name="leadId"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Select Lead</FormLabel>
                    <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant="outline"
                            role="combobox"
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                        >
                            {field.value ? leads.find(l => l.id === field.value)?.name : "Select a lead..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandInput placeholder="Search lead..." />
                        <CommandList>
                            <CommandEmpty>No open leads found.</CommandEmpty>
                            <CommandGroup>
                            {leads.map((lead) => (
                                <CommandItem
                                value={`${lead.name} ${lead.id}`}
                                key={lead.id}
                                onSelect={() => { field.onChange(lead.id!); setLeadPopoverOpen(false); }}
                                >
                                <Check className={cn("mr-2 h-4 w-4", lead.id === field.value ? "opacity-100" : "opacity-0")} />
                                <span>{lead.name} (Req: ₹{lead.helpRequested})</span>
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
          
            {selectedLead && (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Case Summary: {selectedLead.purpose}</AlertTitle>
                    <AlertDescription>
                        <p>Requested: ₹{selectedLead.helpRequested.toLocaleString()}</p>
                        <p>Received: ₹{selectedLead.helpGiven.toLocaleString()}</p>
                        <p className="font-semibold text-destructive">Pending: ₹{(selectedLead.helpRequested - selectedLead.helpGiven).toLocaleString()}</p>
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recipient Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="recipientType"
                        render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Transfer funds directly to:</FormLabel>
                            <FormControl>
                            <RadioGroup
                                onValueChange={(value: any) => {
                                    field.onChange(value);
                                    setValue('recipientId', undefined);
                                }}
                                value={field.value}
                                className="flex flex-wrap gap-x-4 gap-y-2"
                            >
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl><RadioGroupItem value="Beneficiary" /></FormControl>
                                    <FormLabel className="font-normal">Beneficiary</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl><RadioGroupItem value="Referral" disabled={!selectedLead?.referredByUserId} /></FormControl>
                                    <FormLabel className="font-normal">Referral</FormLabel>
                                </FormItem>
                            </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     {recipientDetails && (
                        <div className="p-4 border bg-muted/50 rounded-lg text-sm space-y-2">
                            <div className="flex justify-between"><span>Name:</span><span className="font-semibold">{recipientDetails.name}</span></div>
                            <div className="flex justify-between"><span>Bank Name:</span><span className="font-semibold">{recipientDetails.bankAccountName}</span></div>
                            <div className="flex justify-between"><span>Bank Account:</span><span className="font-semibold">{recipientDetails.bankAccountNumber}</span></div>
                            <div className="flex justify-between"><span>IFSC:</span><span className="font-semibold">{recipientDetails.bankIfscCode}</span></div>
                            <div className="flex justify-between"><span>UPI ID:</span><span className="font-semibold">{recipientDetails.upiIds?.[0]}</span></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <h3 className="text-lg font-semibold border-b pb-2">Transaction Details</h3>
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
            {paymentMethod === 'Online (UPI/Card)' && (
                <FormField
                    control={form.control}
                    name="paymentApp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Payment App</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an app" />
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
            )}
            <FormField
                control={control}
                name="proof"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Proof of Transfer</FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept="image/*,application/pdf"
                                ref={fileInputRef}
                                onChange={(e) => { field.onChange(e.target.files?.[0]); setFile(e.target.files?.[0] || null); }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {previewUrl && (
                <div className="relative w-full h-64"><Image src={previewUrl} alt="Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" /></div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="Enter amount transferred" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="transactionDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Transaction Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            </div>

            <FormField control={form.control} name="transactionId" render={({ field }) => (<FormItem><FormLabel>{transactionIdLabel}</FormLabel><FormControl><Input placeholder={`Enter ${transactionIdLabel}`} {...field} /></FormControl><FormMessage /></FormItem>)} />

            {extractedDetails && (
                 <div className="space-y-4 p-4 border rounded-lg bg-green-500/10">
                    <h3 className="font-semibold text-lg">Extracted Details (Review & Edit)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {extractedDetails.paymentApp && <FormField control={form.control} name="paymentApp" render={({field}) => (<FormItem><FormLabel>Payment App</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
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
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                  Record Transfer
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
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
    )}
    </>
  );
}

export function AddTransferForm(props: AddTransferFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddTransferFormContent {...props} />
        </Suspense>
    )
}
