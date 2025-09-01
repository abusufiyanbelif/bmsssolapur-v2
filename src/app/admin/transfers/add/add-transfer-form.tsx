
'use client';

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
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense, useRef, useCallback, useMemo } from "react";
import { Loader2, Info, ImageIcon, CalendarIcon, FileText, Trash2, ChevronsUpDown, Check, X, ScanEye, User as UserIcon, TextSelect, XCircle, Users, AlertTriangle, Megaphone, FileHeart, Building, CheckCircle, FileUp } from "lucide-react";
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
import { scanProof } from '@/app/admin/donations/add/actions';
import { getRawTextFromImage } from '@/ai/flows/extract-raw-text-flow';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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
  // Participant details
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  senderAccountNumber: z.string().optional(),
  senderBankName: z.string().optional(),
  senderIfscCode: z.string().optional(),
  senderUpiId: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientAccountNumber: z.string().optional(),
  recipientBankName: z.string().optional(),
  recipientIfscCode: z.string().optional(),
  recipientUpiId: z.string().optional(),
  status: z.string().optional(),
}).refine(data => {
    // If payment method is Online or Bank Transfer, a proof is required.
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
  
  const potentialReferrals = users.filter(u => u.roles.includes("Referral"));

  const form = useForm<AddTransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormValues,
  });

  const { watch, setValue, reset, control, trigger } = form;
  const paymentMethod = watch("paymentMethod");
  const selectedLeadId = watch("leadId");
  const paymentApp = watch("paymentApp");
  const recipientType = watch("recipientType");
  const selectedRecipientId = watch("recipientId");

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const showOnlineFields = paymentMethod === 'Online (UPI/Card)' || paymentMethod === 'Bank Transfer';

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
  
  // Set Beneficiary Details when a lead is selected
  useEffect(() => {
    const fetchBeneficiary = async () => {
      if (selectedLead?.beneficiaryId) {
        try {
            const beneficiary = await getUser(selectedLead.beneficiaryId);
            setBeneficiaryDetails(beneficiary);
            // Default recipient type to beneficiary when a lead is picked
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

  // Set Recipient Details based on selection
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
    
    const formData = new FormData();
    formData.append('proofFile', file);
    
    const result = await scanProof(formData);
    
    if (result.success && result.details) {
      toast({ variant: 'success', title: 'Scan Successful', description: 'Form fields populated. Please review.' });
      
      // Populate fields from scan
      Object.entries(result.details).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'date' && typeof value === 'string') {
            setValue('transactionDate', new Date(value));
          } else if (key === 'amount') {
            setValue('amount', value as number);
          } else if (key === 'paymentApp' && typeof value === 'string' && ['Google Pay', 'PhonePe', 'Paytm'].includes(value)) {
            setValue('paymentApp', value as any);
          } else {
            setValue(key as any, value);
          }
        }
      });
      if(result.details.rawText) setRawText(result.details.rawText);

      // Auto-detect recipient user from scanned details
      let foundRecipient: User | null = null;
      if (result.details.recipientUpiId) foundRecipient = await getUserByUpiId(result.details.recipientUpiId);
      if (!foundRecipient && result.details.recipientPhone) foundRecipient = await getUserByPhone(result.details.recipientPhone);

      if (foundRecipient) {
          toast({ variant: 'info', title: 'Recipient Detected!', description: `Automatically matched ${foundRecipient.name}.`});
          if (foundRecipient.roles.includes('Referral')) {
              setValue('recipientType', 'Referral');
              setValue('recipientId', foundRecipient.id);
          } else {
              // Default to beneficiary if not a referral (even if they have other roles)
              setValue('recipientType', 'Beneficiary');
              setValue('recipientId', foundRecipient.id);
          }
      }
      
      // Explicitly trigger validation and re-render
      trigger();

    } else {
      toast({ variant: 'destructive', title: 'Scan Failed', description: result.error || "Could not extract details." });
    }
    setIsScanning(false);
  };
  
  const handleExtractText = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please select a file first.' });
      return;
    }
    setIsExtractingText(true);
    const formData = new FormData();
    formData.append('imageFile', file);
    const result = await getRawTextFromImage({photoDataUri: await fileToDataUrl(file)});
    if(result.success && result.text) {
        setRawText(result.text);
    } else {
         toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract text.' });
    }
    setIsExtractingText(false);
  };
  
    const fileToDataUrl = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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
  
  const transactionIdLabel = useMemo(() => {
        if (paymentMethod === 'Bank Transfer') return 'UTR Number';
        switch (paymentApp) {
            case 'PhonePe': return 'Transaction ID';
            case 'Paytm': return 'UPI Ref. No';
            case 'Google Pay': return 'UPI Transaction ID';
            default: return 'Primary Transaction ID';
        }
    }, [paymentApp, paymentMethod]);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8 max-w-2xl">
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
        
        <FormField
          control={form.control}
          name="campaignId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link to Campaign (Optional)</FormLabel>
              <Select
                onValueChange={(value) => { field.onChange(value === 'none' ? '' : value) }}
                value={field.value || 'none'}
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
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={control}
            name="paymentMethod"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
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

        {showOnlineFields && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold text-lg flex items-center gap-2"><ImageIcon className="h-5 w-5"/>Payment Proof & Scanning</h3>
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
                <div className="relative w-full h-64"><Image src={previewUrl} alt="Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" /></div>
                )}
                <div className="flex gap-2">
                    <Button type="button" variant="outline" className="w-full" onClick={handleScan} disabled={!file || isScanning}>
                        {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanEye className="h-4 w-4" />} Scan & Auto-Fill
                    </Button>
                     <Button type="button" variant="secondary" className="w-full" onClick={handleExtractText} disabled={!file || isExtractingText}>
                        {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <TextSelect className="h-4 w-4" />} Get Raw Text
                    </Button>
                </div>
            </div>
        )}
        
         {paymentMethod === 'Cash' || paymentMethod === 'Other' ? (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Manual Entry</AlertTitle>
                <AlertDescription>
                    You are recording a {paymentMethod.toLowerCase()} transfer.
                </AlertDescription>
            </Alert>
        ) : null}

        {rawText && (
            <div className="space-y-2">
                <FormLabel>Extracted Text</FormLabel>
                <Textarea readOnly value={rawText} rows={10} className="text-xs font-mono" />
            </div>
        )}

        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><UserIcon className="h-4 w-4" />Beneficiary Details (For Case)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                {beneficiaryDetails ? (
                    <>
                        <div className="flex justify-between"><span>Name:</span><span className="font-semibold">{beneficiaryDetails.name}</span></div>
                        <div className="flex justify-between"><span>Phone:</span><span className="font-semibold">{beneficiaryDetails.phone}</span></div>
                    </>
                ) : (
                    <p className="text-muted-foreground">Select a lead to see beneficiary details.</p>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Recipient & Transaction Details</CardTitle>
                <CardDescription>Details about who received the funds and the transaction itself. Auto-fill by scanning proof.</CardDescription>
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
                                <FormControl><RadioGroupItem value="Referral" /></FormControl>
                                <FormLabel className="font-normal">Referral</FormLabel>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {recipientType === 'Referral' && (
                    <FormField
                        control={form.control}
                        name="recipientId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Select Referral</FormLabel>
                            <Popover open={referralPopoverOpen} onOpenChange={setReferralPopoverOpen}>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" role="combobox" className={cn("w-full justify-between",!field.value && "text-muted-foreground")}>
                                    {field.value ? users.find((user) => user.id === field.value)?.name : "Select a referral"}
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
                                                    onSelect={() => { field.onChange(user.id!); setReferralPopoverOpen(false); }}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="Enter amount transferred" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="transactionDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Transaction Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                </div>
                 {showOnlineFields && (
                     <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={control} name="paymentApp" render={({ field }) => (<FormItem><FormLabel>Payment App</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select payment app" /></SelectTrigger></FormControl><SelectContent>{paymentApps.map(app => (<SelectItem key={app} value={app}>{app}</SelectItem>))}</SelectContent></Select></FormItem>)} />
                            <FormField control={control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <FormField control={control} name={paymentMethod === 'Bank Transfer' ? 'utrNumber' : 'transactionId'} render={({ field }) => (<FormItem><FormLabel>{transactionIdLabel}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        
                        <h4 className="font-semibold border-b pb-1">Sender & Recipient Details</h4>
                        <FormField control={control} name="senderName" render={({ field }) => (<FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="senderBankName" render={({ field }) => (<FormItem><FormLabel>Sender Bank Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={control} name="senderAccountNumber" render={({ field }) => (<FormItem><FormLabel>Sender Account</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={control} name="senderIfscCode" render={({ field }) => (<FormItem><FormLabel>Sender IFSC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                         <FormField control={control} name="senderUpiId" render={({ field }) => (<FormItem><FormLabel>Sender UPI</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="recipientName" render={({ field }) => (<FormItem><FormLabel>Recipient Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="recipientBankName" render={({ field }) => (<FormItem><FormLabel>Recipient Bank Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={control} name="recipientAccountNumber" render={({ field }) => (<FormItem><FormLabel>Recipient Account</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={control} name="recipientIfscCode" render={({ field }) => (<FormItem><FormLabel>Recipient IFSC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <FormField control={control} name="recipientUpiId" render={({ field }) => (<FormItem><FormLabel>Recipient UPI</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </>
                 )}
            </CardContent>
        </Card>

        <h3 className="text-lg font-semibold border-b pb-2 pt-4">Additional Info</h3>
        <FormField control={control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any internal notes about this transfer?" {...field} /></FormControl></FormItem>)} />

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
  );
}

export function AddTransferForm(props: AddTransferFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddTransferFormContent {...props} />
        </Suspense>
    )
}
