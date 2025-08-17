
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
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { Loader2, Info, ImageIcon, CalendarIcon, FileText, Trash2, ChevronsUpDown, Check, X, ScanEye, User as UserIcon, TextSelect, XCircle, Users, AlertTriangle, Megaphone, FileHeart, Building, CheckCircle, FileUp } from "lucide-react";
import type { User, Lead, PaymentMethod, Campaign } from "@/services/types";
import { getUser } from "@/services/user-service";
import { useSearchParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { handleAddTransfer } from "./actions";
import { scanProof, getRawTextFromImage } from '@/app/admin/donations/add/actions';

const paymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];
const paymentApps = ['Google Pay', 'PhonePe', 'Paytm'] as const;

const formSchema = z.object({
  leadId: z.string().min(1, "Please select a lead/beneficiary."),
  campaignId: z.string().optional(),
  paymentMethod: z.enum(paymentMethods, { required_error: "Please select a payment method." }),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  transactionDate: z.date(),
  transactionId: z.string().optional(),
  utrNumber: z.string().optional(),
  googlePayTransactionId: z.string().optional(),
  phonePeTransactionId: z.string().optional(),
  paytmUpiReferenceNo: z.string().optional(),
  paymentApp: z.enum(paymentApps).optional(),
  proof: z.any().refine(file => file instanceof File && file.size > 0, 'A proof file is required.').optional(),
  notes: z.string().optional(),
  // Participant details
  senderName: z.string().optional(),
  senderAccountNumber: z.string().optional(),
  senderUpiId: z.string().optional(),
  recipientName: z.string().optional(),
  recipientAccountNumber: z.string().optional(),
  recipientUpiId: z.string().optional(),
  recipientPhone: z.string().optional(),
  status: z.string().optional(),
});

type AddTransferFormValues = z.infer<typeof formSchema>;

interface AddTransferFormProps {
    leads: Lead[];
    campaigns: Campaign[];
}

function AddTransferFormContent({ leads, campaigns }: AddTransferFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [beneficiaryDetails, setBeneficiaryDetails] = useState<User | null>(null);
  
  const form = useForm<AddTransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      transactionDate: new Date(),
      paymentMethod: 'Online (UPI/Card)',
    },
  });

  const { watch, setValue, reset, control } = form;
  const paymentMethod = watch("paymentMethod");
  const selectedLeadId = watch("leadId");
  const paymentApp = watch("paymentApp");
  
  const selectedLead = leads.find(l => l.id === selectedLeadId);
  
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
            if(beneficiary) {
                setValue('recipientName', beneficiary.name);
                setValue('recipientPhone', beneficiary.phone);
                setValue('recipientAccountNumber', beneficiary.bankAccountNumber);
                if (beneficiary.upiIds && beneficiary.upiIds.length > 0) {
                    setValue('recipientUpiId', beneficiary.upiIds[0]);
                }
            }
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
      Object.entries(result.details).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'date' && typeof value === 'string') {
            setValue('transactionDate', new Date(value));
          } else if (key === 'amount') {
            setValue('amount', value as number);
          } else {
            setValue(key as any, value);
          }
        }
      });
      if(result.details.rawText) setRawText(result.details.rawText);
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
    const result = await getRawTextFromImage(formData);
    if(result.success && result.text) {
        setRawText(result.text);
    } else {
         toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract text.' });
    }
    setIsExtractingText(false);
  };

  async function onSubmit(values: AddTransferFormValues) {
    if (!adminUserId) {
      toast({ variant: "destructive", title: "Error", description: "Could not identify administrator." });
      return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("adminUserId", adminUserId);
    Object.entries(values).forEach(([key, value]) => {
        if (value instanceof Date) {
            formData.append(key, value.toISOString());
        } else if(key === 'proof' && value instanceof File) {
             formData.append('proof', value);
        } else if (value) {
            formData.append(key, String(value));
        }
    });

    const result = await handleAddTransfer(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({ variant: "success", title: "Transfer Recorded", description: `Successfully recorded transfer for lead.` });
      router.push("/admin/transfers");
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error || "An unknown error occurred." });
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={control}
          name="leadId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Select Lead/Beneficiary</FormLabel>
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
              {selectedLead && (
                 <FormDescription>
                    Pending Amount for this lead: <span className="font-bold">₹{(selectedLead.helpRequested - selectedLead.helpGiven).toLocaleString()}</span>
                </FormDescription>
              )}
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {(campaigns || []).filter(c => c.status !== 'Completed' && c.status !== 'Cancelled').map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id!}>
                            {campaign.name} ({campaign.status})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormDescription>Associate this transfer with a specific fundraising campaign.</FormDescription>
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
        
        {(paymentMethod === 'Online (UPI/Card)' || paymentMethod === 'Bank Transfer') && (
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

        {rawText && (
            <div className="space-y-2">
                <FormLabel>Extracted Text</FormLabel>
                <Textarea readOnly value={rawText} rows={10} className="text-xs font-mono" />
            </div>
        )}

        <h3 className="text-lg font-semibold border-b pb-2">Transaction Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <FormField
            control={control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Enter amount transferred" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Transaction Date</FormLabel>
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={control} name="paymentApp" render={({ field }) => (
                <FormItem>
                    <FormLabel>Payment App</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select payment app" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {paymentApps.map(app => (<SelectItem key={app} value={app}>{app}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
            <FormField control={control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>
        
        {paymentApp !== 'PhonePe' && (
            <FormField control={control} name="transactionId" render={({ field }) => (<FormItem><FormLabel>Primary Transaction ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        )}
        
        {paymentApp === 'Google Pay' && (
            <FormField control={control} name="googlePayTransactionId" render={({ field }) => (<FormItem><FormLabel>Google Pay Transaction ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        )}
        
        {paymentApp === 'PhonePe' && (
            <>
                <FormField control={control} name="phonePeTransactionId" render={({ field }) => (<FormItem><FormLabel>PhonePe Transaction ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={control} name="utrNumber" render={({ field }) => (<FormItem><FormLabel>UTR Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            </>
        )}
        
        <FormField control={control} name="paytmUpiReferenceNo" render={({ field }) => (<FormItem><FormLabel>Paytm UPI Reference No.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
       
        <h3 className="text-lg font-semibold border-b pb-2 pt-4">Participant Details</h3>
        <FormField control={control} name="senderName" render={({ field }) => (<FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        <FormField control={control} name="senderAccountNumber" render={({ field }) => (<FormItem><FormLabel>Sender Account</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        <FormField control={control} name="senderUpiId" render={({ field }) => (<FormItem><FormLabel>Sender UPI</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        
        {/* Recipient Section */}
        <div className="space-y-4 rounded-lg border p-4">
             <h4 className="font-semibold">Recipient Details (from Beneficiary Profile)</h4>
             {beneficiaryDetails ? (
                <div className="space-y-2">
                     <FormField control={control} name="recipientName" render={({ field }) => (<FormItem><FormLabel>Recipient Name</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl></FormItem>)} />
                     <FormField control={control} name="recipientPhone" render={({ field }) => (<FormItem><FormLabel>Recipient Phone</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl></FormItem>)} />
                     <FormField control={control} name="recipientAccountNumber" render={({ field }) => (<FormItem><FormLabel>Recipient Account</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl></FormItem>)} />
                     <FormField control={control} name="recipientUpiId" render={({ field }) => (<FormItem><FormLabel>Recipient UPI</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl></FormItem>)} />
                </div>
             ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">Select a lead above to view beneficiary details.</p>
             )}
        </div>


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
