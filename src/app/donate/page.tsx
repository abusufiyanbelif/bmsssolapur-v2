

// src/app/donate/page.tsx
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense, useRef } from "react";
import { Loader2, AlertCircle, CheckCircle, HandHeart, Info, UploadCloud, Link2, XCircle, CreditCard, Save, FileUp, ScanEye, Text, Bot, ZoomIn, ZoomOut, X, FileIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { createRazorpayOrder, handleManualDonation } from './actions';
import type { User, Lead, Organization, Campaign, AppSettings, ExtractDonationDetailsOutput } from '@/services/types';
import { getUser } from '@/services/user-service';
import { getLead, getAllLeads } from '@/services/lead-service';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import { getAppSettings, getCurrentOrganization } from "@/app/admin/settings/actions";
import { getAllCampaigns } from "@/services/campaign-service";
import { LinkLeadCampaignDialog } from "./link-lead-campaign-dialog";
import { Badge } from "@/components/ui/badge";
import { useRazorpay } from "@/hooks/use-razorpay";
import { Checkbox } from "@/components/ui/checkbox";
import { getRawTextFromImage } from '@/app/actions';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { handleExtractDonationDetails } from "@/app/admin/donations/add/actions";
import { QrCodeDialog } from "@/app/organization/qr-code-dialog";


const donationPurposes = ['Zakat', 'Sadaqah', 'Fitr', 'Relief Fund'] as const;

// Schema for making a new online donation
const onlineDonationSchema = z.object({
  purpose: z.enum(donationPurposes, { required_error: "Please select a purpose."}),
  amount: z.coerce.number().min(10, "Donation amount must be at least ₹10."),
  isAnonymous: z.boolean().default(false),
  leadId: z.string().optional(),
  campaignId: z.string().optional(),
  includePledge: z.boolean().default(false),
  notes: z.string().optional(),
});
export type OnlineDonationFormValues = z.infer<typeof onlineDonationSchema>;

// Schema for recording a past donation
const recordDonationSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  purpose: z.enum(donationPurposes, { required_error: "Please select a purpose."}),
  transactionId: z.string().min(1, "Transaction ID/UTR is required."),
  donationDate: z.date(),
  notes: z.string().optional(),
  proof: z.any().optional(), // No longer mandatory as it can be uploaded after
  // Extracted fields
  paymentApp: z.string().optional(),
  senderName: z.string().optional(),
  googlePaySenderName: z.string().optional(),
  phonePeSenderName: z.string().optional(),
  paytmSenderName: z.string().optional(),
  senderUpiId: z.string().optional(),
  senderAccountNumber: z.string().optional(),
  recipientName: z.string().optional(),
  googlePayRecipientName: z.string().optional(),
  phonePeRecipientName: z.string().optional(),
  paytmRecipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientUpiId: z.string().optional(),
  recipientAccountNumber: z.string().optional(),
  utrNumber: z.string().optional(),
  googlePayTransactionId: z.string().optional(),
  phonePeTransactionId: z.string().optional(),
  paytmUpiReferenceNo: z.string().optional(),
});
export type RecordDonationFormValues = z.infer<typeof recordDonationSchema>;

const initialRecordFormValues: Partial<RecordDonationFormValues> = {
    amount: 0,
    transactionId: '',
    notes: '',
    proof: undefined,
    donationDate: new Date(),
    paymentApp: '',
    senderName: '',
    googlePaySenderName: '',
    phonePeSenderName: '',
    paytmSenderName: '',
    senderUpiId: '',
    senderAccountNumber: '',
    recipientName: '',
    googlePayRecipientName: '',
    phonePeRecipientName: '',
    paytmRecipientName: '',
    recipientPhone: '',
    recipientUpiId: '',
    recipientAccountNumber: '',
    utrNumber: '',
    googlePayTransactionId: '',
    phonePeTransactionId: '',
    paytmUpiReferenceNo: '',
};

function OnlineDonationForm({ user, targetLead, targetCampaignId, openLeads, activeCampaigns, razorpayKeyId, organization }: { user: User, targetLead: Lead | null, targetCampaignId: string | null, openLeads: Lead[], activeCampaigns: Campaign[], razorpayKeyId?: string, organization: Organization | null }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRazorpayLoaded, razorpayError] = useRazorpay();
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

    const form = useForm<OnlineDonationFormValues>({
        resolver: zodResolver(onlineDonationSchema),
        defaultValues: {
            amount: 100,
            isAnonymous: user.isAnonymousAsDonor || false,
            purpose: targetLead?.donationType || 'Sadaqah',
            includePledge: false,
            notes: '',
            leadId: targetLead?.id || undefined,
            campaignId: targetCampaignId || undefined,
        },
    });

    const { watch, setValue, getValues, control, formState: { isValid } } = form;

    const linkedLeadId = watch("leadId");
    const linkedCampaignId = watch("campaignId");
    const includePledge = watch("includePledge");

    const linkedLead = linkedLeadId ? openLeads.find(l => l.id === linkedLeadId) : null;
    const linkedCampaign = linkedCampaignId ? activeCampaigns.find(c => c.id === linkedCampaignId) : null;
    
    useEffect(() => {
        if (includePledge && user?.monthlyPledgeEnabled && user.monthlyPledgeAmount) {
            setValue('amount', user.monthlyPledgeAmount);
            setValue('notes', 'Monthly pledged donation to organization.');
        } else if (!targetLead) {
            setValue('amount', 100);
            setValue('notes', '');
        }
    }, [includePledge, user, setValue, targetLead]);

    async function onSubmit(values: OnlineDonationFormValues) {
        if (razorpayKeyId) {
            // Existing Razorpay Logic
            setIsSubmitting(true);
            const orderResult = await createRazorpayOrder(values.amount, 'INR');

            if (!orderResult.success || !orderResult.order) {
                toast({ variant: 'destructive', title: 'Error', description: orderResult.error || 'Could not create payment order.' });
                setIsSubmitting(false);
                return;
            }

            const options = {
                key: razorpayKeyId,
                amount: orderResult.order.amount,
                currency: orderResult.order.currency,
                name: "Baitul Mal Samajik Sanstha",
                description: `Donation for ${values.purpose}`,
                order_id: orderResult.order.id,
                handler: function (response: any) {
                    toast({
                        variant: 'success',
                        title: 'Payment Successful!',
                        description: 'Your donation has been recorded. Thank you!',
                    });
                },
                prefill: { name: user.name, email: user.email, contact: user.phone },
                notes: {
                    ...values.notes && { notes: values.notes },
                    ...values.leadId && { leadId: values.leadId },
                    ...values.campaignId && { campaignId: values.campaignId },
                    userId: user.id,
                },
                theme: { color: '#16a34a' }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
            setIsSubmitting(false);
        } else {
            // UPI/QR Code flow
            setIsQrDialogOpen(true);
        }
    }
    
     const handleLinkSelection = ({ leadId, campaignId }: { leadId?: string, campaignId?: string }) => {
        setValue('leadId', leadId, { shouldDirty: true });
        setValue('campaignId', campaignId, { shouldDirty: true });
        setIsLinkDialogOpen(false);
    };

    const clearLink = () => {
        setValue('leadId', undefined);
        setValue('campaignId', undefined);
    };

    const isPayDisabled = isSubmitting || (razorpayKeyId && !isRazorpayLoaded) || !isValid;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Make a New Online Donation</CardTitle>
                <CardDescription>Use our secure payment gateway to make your contribution.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setIsLinkDialogOpen(true)}>
                            <Link2 className="mr-2 h-4 w-4" /> Link to a Specific Cause (Optional)
                        </Button>
                        {(linkedLead || linkedCampaign) && (
                            <div className="p-2 border rounded-md bg-muted/50 flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    Linked to: <Badge variant="secondary">{linkedLead?.name || linkedCampaign?.name}</Badge>
                                </p>
                                <Button type="button" variant="ghost" size="icon" onClick={clearLink} className="h-6 w-6">
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <FormField control={control} name="purpose" render={({ field }) => (<FormItem><FormLabel>Purpose</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{donationPurposes.map(p=>(<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        <FormField control={control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (INR)</FormLabel><FormControl><Input type="number" {...field} disabled={includePledge} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={control} name="isAnonymous" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label>Donate Anonymously</Label></FormItem>)}/>
                        {user.monthlyPledgeEnabled && user.monthlyPledgeAmount && (<FormField control={control} name="includePledge" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label>Fulfill my monthly pledge of ₹{user.monthlyPledgeAmount}</Label></FormItem>)}/>)}
                        <Button type="submit" disabled={isPayDisabled} className="w-full">
                           {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <CreditCard className="mr-2"/>}
                           {razorpayKeyId ? "Pay Securely via Razorpay" : "Pay with UPI / QR"}
                        </Button>
                        {razorpayKeyId && razorpayError && <p className="text-xs text-destructive text-center">{razorpayError}</p>}
                    </form>
                </Form>
                 <LinkLeadCampaignDialog
                    open={isLinkDialogOpen}
                    onOpenChange={setIsLinkDialogOpen}
                    leads={openLeads}
                    campaigns={activeCampaigns}
                    onLink={handleLinkSelection}
                />
                 {organization && (
                    <QrCodeDialog
                        open={isQrDialogOpen}
                        onOpenChange={setIsQrDialogOpen}
                        donationDetails={getValues()}
                        organization={organization}
                    />
                 )}
            </CardContent>
        </Card>
    )
}

function RecordPastDonationForm({ user }: { user: User }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [rawText, setRawText] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [extractedDetails, setExtractedDetails] = useState<ExtractDonationDetailsOutput | null>(null);
    const [zoom, setZoom] = useState(1);


    const form = useForm<RecordDonationFormValues>({
        resolver: zodResolver(recordDonationSchema),
        defaultValues: initialRecordFormValues
    });
    
    const { control, handleSubmit, setValue } = form;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        if (selectedFile) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setValue('proof', selectedFile, { shouldValidate: true });
        } else {
            clearFile();
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreviewUrl(null);
        setRawText(null);
        setExtractedDetails(null);
        setValue('proof', null, { shouldValidate: true });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleGetText = async () => {
        if (!file) {
          toast({ variant: 'destructive', title: 'No File', description: 'Please select a screenshot to scan.' });
          return;
        }
        setIsScanning(true);
        const formData = new FormData();
        formData.append("file_0", file);
        const result = await getRawTextFromImage(formData);
        if (result.success && result.rawText) {
            setRawText(result.rawText);
            toast({ variant: 'success', title: 'Text Extracted', description: 'Raw text has been populated below. You can now analyze it.' });
        } else {
             toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract text.' });
        }
        setIsScanning(false);
    }
    
    const handleAutoFill = async () => {
        if (!rawText) return;
        setIsAnalyzing(true);
        const result = await handleExtractDonationDetails(rawText);
        if (result.success && result.details) {
            const details = result.details;
            setExtractedDetails(details);
            Object.entries(details).forEach(([key, value]) => {
                if (value !== undefined && key !== 'rawText') {
                    if (key === 'date' && typeof value === 'string') {
                        setValue('donationDate', new Date(value));
                    } else if (key === 'amount' && typeof value === 'number') {
                        setValue('amount', value);
                    } else {
                        setValue(key as any, value);
                    }
                }
            });
            toast({ variant: 'success', title: 'Auto-fill Complete', description: 'Please review all fields.' });
        } else {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
        }
        setIsAnalyzing(false);
    };
    
    const onSubmit = async (values: RecordDonationFormValues) => {
        setIsSubmitting(true);
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (value instanceof Date) formData.append(key, value.toISOString());
            else if (value) formData.append(key, value);
        });

        const result = await handleManualDonation(user.id!, formData);

        if (result.success) {
            toast({ variant: 'success', title: 'Donation Recorded', description: 'Thank you! Our team will verify your submission shortly.' });
            router.push('/my-donations');
        } else {
            toast({ variant: 'destructive', title: 'Submission Failed', description: result.error || 'An unknown error occurred.' });
        }
        setIsSubmitting(false);
    }
    
     const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        setZoom(prevZoom => Math.max(0.5, Math.min(prevZoom - e.deltaY * 0.001, 5)));
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Record a Past Donation</CardTitle>
                <CardDescription>If you've already donated via bank transfer or another method, upload your proof here to record it.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={control} name="proof" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proof of Donation</FormLabel>
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
                        )}/>
                        {previewUrl && (
                            <div className="relative group">
                                 <div onWheel={handleWheel} className="relative w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto flex items-center justify-center">
                                    {file?.type.startsWith('image/') ? (
                                        <Image 
                                            src={previewUrl} 
                                            alt="Screenshot Preview"
                                            width={800 * zoom}
                                            height={800 * zoom}
                                            className="object-contain transition-transform duration-100"
                                            style={{ transform: `scale(${zoom})` }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
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
                              <Button type="button" variant="outline" className="w-full" onClick={handleGetText} disabled={isScanning}>
                                  {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Text className="mr-2 h-4 w-4" />}
                                  Get Text from Image
                              </Button>
                              {rawText && (
                                  <Button type="button" onClick={handleAutoFill} disabled={isAnalyzing} className="w-full">
                                      {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                      Auto-fill Form
                                  </Button>
                              )}
                           </div>
                        )}
                        
                        {rawText && <Textarea value={rawText} readOnly rows={5} className="text-xs font-mono bg-muted"/>}
                        
                        <FormField control={control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (INR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={control} name="purpose" render={({ field }) => (<FormItem><FormLabel>Purpose</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{donationPurposes.map(p=>(<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
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
                                        className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
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
                        
                        {extractedDetails ? (
                           <div className="space-y-4 p-4 border rounded-lg bg-green-500/10">
                                <h3 className="font-semibold text-lg">Extracted Details (Review & Edit)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="transactionId" render={({field}) => (<FormItem><FormLabel>Transaction ID</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />
                                    {extractedDetails.paymentApp && <FormField control={form.control} name="paymentApp" render={({field}) => (<FormItem><FormLabel>Payment App</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
                                    {extractedDetails.utrNumber && <FormField control={form.control} name="utrNumber" render={({field}) => (<FormItem><FormLabel>UTR Number</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.googlePayTransactionId && <FormField control={form.control} name="googlePayTransactionId" render={({field}) => (<FormItem><FormLabel>Google Pay ID</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.phonePeTransactionId && <FormField control={form.control} name="phonePeTransactionId" render={({field}) => (<FormItem><FormLabel>PhonePe ID</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.paytmUpiReferenceNo && <FormField control={form.control} name="paytmUpiReferenceNo" render={({field}) => (<FormItem><FormLabel>Paytm Ref No</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    
                                    {extractedDetails.senderName && <FormField control={form.control} name="senderName" render={({field}) => (<FormItem><FormLabel>Sender Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
                                    {extractedDetails.googlePaySenderName && <FormField control={form.control} name="googlePaySenderName" render={({field}) => (<FormItem><FormLabel>GPay Sender</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.phonePeSenderName && <FormField control={form.control} name="phonePeSenderName" render={({field}) => (<FormItem><FormLabel>PhonePe Sender</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.paytmSenderName && <FormField control={form.control} name="paytmSenderName" render={({field}) => (<FormItem><FormLabel>Paytm Sender</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.senderUpiId && <FormField control={form.control} name="senderUpiId" render={({field}) => (<FormItem><FormLabel>Sender UPI ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
                                    {extractedDetails.senderAccountNumber && <FormField control={form.control} name="senderAccountNumber" render={({field}) => (<FormItem><FormLabel>Sender Account No.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}

                                    {extractedDetails.recipientName && <FormField control={form.control} name="recipientName" render={({field}) => (<FormItem><FormLabel>Recipient Name</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.googlePayRecipientName && <FormField control={form.control} name="googlePayRecipientName" render={({field}) => (<FormItem><FormLabel>GPay Recipient</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.phonePeRecipientName && <FormField control={form.control} name="phonePeRecipientName" render={({field}) => (<FormItem><FormLabel>PhonePe Recipient</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.paytmRecipientName && <FormField control={form.control} name="paytmRecipientName" render={({field}) => (<FormItem><FormLabel>Paytm Recipient</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)} />}
                                    {extractedDetails.recipientPhone && <FormField control={form.control} name="recipientPhone" render={({field}) => (<FormItem><FormLabel>Recipient Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
                                    {extractedDetails.recipientUpiId && <FormField control={form.control} name="recipientUpiId" render={({field}) => (<FormItem><FormLabel>Recipient UPI ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
                                    {extractedDetails.recipientAccountNumber && <FormField control={form.control} name="recipientAccountNumber" render={({field}) => (<FormItem><FormLabel>Recipient Account No.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />}
                                </div>
                            </div>
                        ) : (
                            <FormField control={control} name="transactionId" render={({ field }) => (<FormItem><FormLabel>Transaction ID / UTR</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        )}
                        
                        <FormField control={control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                           {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
                           Submit Record
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function DonatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [targetLead, setTargetLead] = useState<Lead | null>(null);
  const [targetCampaignId, setTargetCampaignId] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [openLeads, setOpenLeads] = useState<Lead[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donationMethod, setDonationMethod] = useState<'online' | 'record' | null>(null);
  
  const leadId = searchParams.get('leadId');
  const campaignId = searchParams.get('campaignId');
  
  useEffect(() => {
    const fetchPageData = async () => {
        setIsLoading(true);
        const storedUserId = localStorage.getItem('userId');
        
        try {
          const [appSettings, orgData, allLeads, allCampaigns] = await Promise.all([
            getAppSettings(),
            getCurrentOrganization(),
            getAllLeads(),
            getAllCampaigns(),
          ]);
          
          setSettings(appSettings);
          setOrganization(orgData);
          setOpenLeads(allLeads.filter(l => l.caseAction === 'Publish' || l.caseAction === 'Partial'));
          setActiveCampaigns(allCampaigns.filter(c => c.status === 'Active' || c.status === 'Upcoming'));
  
          if (storedUserId) {
              const fetchedUser = await getUser(storedUserId);
              setUser(fetchedUser);
          }
  
          if (leadId) {
            const lead = await getLead(leadId);
            setTargetLead(lead);
            setDonationMethod('online');
          } else if (campaignId) {
            setTargetCampaignId(campaignId);
            setDonationMethod('online');
          }
        } catch (e) {
          setError("Failed to load necessary data. Please try again.");
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };

    fetchPageData();
  }, [leadId, campaignId]);
  
  useEffect(() => {
    if (!isLoading && !user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      router.push(redirectUrl);
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
  }
  
  if (!user) {
    // This will show briefly before the useEffect above redirects.
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  const onlinePaymentsEnabled = settings?.features?.onlinePaymentsEnabled ?? false;
  const razorpayEnabled = settings?.paymentGateway?.razorpay?.enabled && onlinePaymentsEnabled;
  const razorpayKey = razorpayEnabled ? (settings.paymentGateway.razorpay.mode === 'live' ? settings.paymentGateway.razorpay.live.keyId : settings.paymentGateway.razorpay.test.keyId) : undefined;
  
  const allowRecordDonation = settings?.donationConfiguration?.allowDonorSelfServiceDonations ?? true;


  return (
     <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Make a Donation</h2>
        </div>

        {!donationMethod && (
            <Card>
                <CardHeader>
                    <CardTitle>How would you like to donate?</CardTitle>
                    <CardDescription>Please select one of the options below to proceed.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {onlinePaymentsEnabled && (
                        <div 
                            className="p-6 border rounded-lg hover:shadow-lg hover:border-primary transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4"
                            onClick={() => setDonationMethod('online')}
                        >
                            <CreditCard className="h-12 w-12 text-primary" />
                            <h3 className="text-xl font-semibold">Make a New Online Donation</h3>
                            <p className="text-sm text-muted-foreground">Use our secure payment gateway to contribute directly.</p>
                        </div>
                    )}
                     {allowRecordDonation && (
                        <div 
                            className="p-6 border rounded-lg hover:shadow-lg hover:border-primary transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4"
                            onClick={() => setDonationMethod('record')}
                        >
                            <FileUp className="h-12 w-12 text-primary" />
                            <h3 className="text-xl font-semibold">I've Already Donated</h3>
                            <p className="text-sm text-muted-foreground">Upload proof of a past payment made via bank transfer, UPI, or another method.</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        )}

        {donationMethod === 'online' && onlinePaymentsEnabled && (
            <OnlineDonationForm 
                user={user}
                targetLead={targetLead}
                targetCampaignId={targetCampaignId}
                openLeads={openLeads}
                activeCampaigns={activeCampaigns}
                razorpayKeyId={razorpayKey}
                organization={organization}
             />
        )}
        
        {donationMethod === 'record' && allowRecordDonation && (
            <RecordPastDonationForm user={user} />
        )}
     </div>
  );
}

export default function DonatePage() {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <DonatePageContent />
        </Suspense>
    )
}
