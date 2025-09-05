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
import { useState, useEffect, Suspense } from "react";
import { Loader2, AlertCircle, CheckCircle, HandHeart, Info, UploadCloud, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { createRazorpayOrder } from './actions';
import type { User, Lead, Organization, Campaign, AppSettings } from '@/services/types';
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
import { handleManualDonation } from './actions';
import { getRawTextFromImage } from '@/app/actions';


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
  proof: z.any().refine(file => file?.size > 0, "A proof file is required."),
});
export type RecordDonationFormValues = z.infer<typeof recordDonationSchema>;


function OnlineDonationForm({ user, targetLead, targetCampaignId, openLeads, activeCampaigns, razorpayKeyId }: { user: User, targetLead: Lead | null, targetCampaignId: string | null, openLeads: Lead[], activeCampaigns: Campaign[], razorpayKeyId?: string }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRazorpayLoaded, razorpayError] = useRazorpay();
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

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

    const { watch, setValue, getValues, control } = form;

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
                // This is a placeholder. A real implementation would verify this on the backend.
                toast({
                    variant: 'success',
                    title: 'Payment Successful!',
                    description: 'Your donation has been recorded. Thank you!',
                });
            },
            prefill: {
                name: user.name,
                email: user.email,
                contact: user.phone,
            },
            notes: {
                ...values.notes && { notes: values.notes },
                ...values.leadId && { leadId: values.leadId },
                ...values.campaignId && { campaignId: values.campaignId },
                userId: user.id,
            },
            theme: {
                color: '#16a34a' // Your primary theme color
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setIsSubmitting(false);
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
                        <Button type="submit" disabled={isSubmitting || !razorpayKeyId || !isRazorpayLoaded} className="w-full">
                           {isSubmitting || !isRazorpayLoaded ? <Loader2 className="mr-2 animate-spin"/> : <CreditCard className="mr-2"/>}
                           {razorpayError ? "Gateway Error" : isRazorpayLoaded ? "Pay Securely" : "Loading Gateway..."}
                        </Button>
                        {razorpayError && <p className="text-xs text-destructive text-center">{razorpayError}</p>}
                    </form>
                </Form>
                 <LinkLeadCampaignDialog
                    open={isLinkDialogOpen}
                    onOpenChange={setIsLinkDialogOpen}
                    leads={openLeads}
                    campaigns={activeCampaigns}
                    onLink={handleLinkSelection}
                />
            </CardContent>
        </Card>
    )
}

function RecordPastDonationForm({ user }: { user: User }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [rawText, setRawText] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm<RecordDonationFormValues>({
        resolver: zodResolver(recordDonationSchema),
        defaultValues: { donationDate: new Date() }
    });
    
    const { control, handleSubmit, setValue } = form;

    const handleScan = async (file: File) => {
        setIsScanning(true);
        const formData = new FormData();
        formData.append("imageFile", file);
        const result = await getRawTextFromImage(formData);
        if (result.success && result.rawText) {
            setRawText(result.rawText);
            // Here you could call another AI flow to parse the rawText and pre-fill the form
            toast({ variant: 'success', title: 'Text Extracted', description: 'Review details and submit.' });
        } else {
             toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract text.' });
        }
        setIsScanning(false);
    }
    
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
                                    <Input type="file" accept="image/*,application/pdf" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            field.onChange(file);
                                            setPreviewUrl(URL.createObjectURL(file));
                                            handleScan(file);
                                        }
                                    }}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        {previewUrl && <Image src={previewUrl} alt="Proof preview" width={200} height={200} className="rounded-md object-contain mx-auto" />}
                        {isScanning && <div className="text-sm text-muted-foreground flex items-center justify-center"><Loader2 className="mr-2 animate-spin"/>Analyzing image...</div>}
                        {rawText && <Textarea value={rawText} readOnly rows={5} className="text-xs font-mono bg-muted"/>}
                        
                        <FormField control={control} name="transactionId" render={({ field }) => (<FormItem><FormLabel>Transaction ID / UTR</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (INR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={control} name="purpose" render={({ field }) => (<FormItem><FormLabel>Purpose</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{donationPurposes.map(p=>(<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        
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
  
  const leadId = searchParams.get('leadId');
  const campaignId = searchParams.get('campaignId');
  
  const fetchPageData = async (userId: string | null) => {
      setIsLoading(true);
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


        if (userId) {
            const fetchedUser = await getUser(userId);
            setUser(fetchedUser);
        }

        if (leadId) {
          const lead = await getLead(leadId);
          setTargetLead(lead);
        } else if (campaignId) {
          setTargetCampaignId(campaignId);
        }
      } catch (e) {
        setError("Failed to load necessary data. Please try again.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    fetchPageData(storedUserId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, campaignId]);
  
  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
  }

  if (!user) {
    // Redirect to login if user is not found, preserving donation intent
    const redirectUrl = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    router.push(redirectUrl);
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }
  
  const onlinePaymentsEnabled = settings?.features?.onlinePaymentsEnabled ?? false;
  const razorpayEnabled = settings?.paymentGateway?.razorpay?.enabled && onlinePaymentsEnabled;
  const razorpayKey = razorpayEnabled ? (settings.paymentGateway.razorpay.mode === 'live' ? settings.paymentGateway.razorpay.live.keyId : settings.paymentGateway.razorpay.test.keyId) : undefined;

  return (
     <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Make a Donation</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
             <OnlineDonationForm 
                user={user}
                targetLead={targetLead}
                targetCampaignId={targetCampaignId}
                openLeads={openLeads}
                activeCampaigns={activeCampaigns}
                razorpayKeyId={razorpayKey}
             />
             <RecordPastDonationForm user={user} />
        </div>
     </div>
  );
}

export default function DonatePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DonatePageContent />
        </Suspense>
    )
}
