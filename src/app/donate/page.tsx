
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
import { Loader2, AlertCircle, CheckCircle, HandHeart, Info, UploadCloud, Edit, Link2, XCircle, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { handleCreatePendingDonation } from './actions';
import { createRazorpayOrder, verifyRazorpayPayment } from './razorpay-actions';
import { scanProof } from '@/app/admin/donations/add/actions';
import type { User, Lead, DonationPurpose, Organization, Campaign, Donation } from '@/services/types';
import { getUser } from '@/services/user-service';
import { getLead, getAllLeads } from '@/services/lead-service';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import { QrCodeDialog } from "@/components/qr-code-dialog";
import { getAppSettings } from "@/services/app-settings-service";
import { getAllCampaigns as getAllCampaignsService } from "@/services/campaign-service";
import { getCurrentOrganization } from "@/services/organization-service";
import { LinkLeadCampaignDialog } from "./link-lead-campaign-dialog";
import { Badge } from "@/components/ui/badge";


const donationPurposes = ['Zakat', 'Sadaqah', 'Fitr', 'Relief Fund'] as const;

// Schema for paying now
const payNowFormSchema = z.object({
  purpose: z.enum(donationPurposes),
  amount: z.coerce.number().min(10, "Donation amount must be at least ₹10."),
  donorName: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  phone: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
  leadId: z.string().optional(),
  campaignId: z.string().optional(),
}).refine(data => {
    if (!data.isAnonymous) {
        return !!data.donorName && data.donorName.length > 0;
    }
    return true;
}, {
    message: "Donor name is required for non-anonymous donations.",
    path: ["donorName"],
});

export type PayNowFormValues = z.infer<typeof payNowFormSchema>;


function PayNowForm({ user, targetLead, targetCampaignId, organization, openLeads, activeCampaigns, razorpayKeyId }: { user: User | null, targetLead: Lead | null, targetCampaignId: string | null, organization: Organization | null, openLeads: Lead[], activeCampaigns: Campaign[], razorpayKeyId?: string }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [donationData, setDonationData] = useState<PayNowFormValues | null>(null);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    
    const form = useForm<PayNowFormValues>({
        resolver: zodResolver(payNowFormSchema),
        defaultValues: {
        amount: 100,
        isAnonymous: false,
        },
    });

    const { watch, setValue } = form;

    const linkedLeadId = watch("leadId");
    const linkedCampaignId = watch("campaignId");

    const linkedLead = linkedLeadId ? openLeads.find(l => l.id === linkedLeadId) : null;
    const linkedCampaign = linkedCampaignId ? activeCampaigns.find(c => c.id === linkedCampaignId) : null;


    useEffect(() => {
        if(user) {
            setValue('donorName', user.name);
            setValue('phone', user.phone);
            setValue('email', user.email || undefined);
        }
    }, [user, setValue]);
    
    useEffect(() => {
        if (targetLead) {
        setValue('leadId', targetLead.id);
        setValue('purpose', 'Sadaqah'); // Default purpose when donating to a lead
        }
        if (targetCampaignId) {
        setValue('campaignId', targetCampaignId);
        setValue('purpose', 'Sadaqah'); // Default purpose
        }
    }, [targetLead, targetCampaignId, setValue]);

    const isAnonymous = watch("isAnonymous");

    const handleLoginRedirect = () => {
        toast({
            title: "Login Required",
            description: "Please log in to continue with your donation.",
        });
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
        router.push('/login');
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

    const handlePayWithRazorpay = async (values: PayNowFormValues) => {
        if (!user || !user.id) {
            handleLoginRedirect();
            return;
        }
        if (!razorpayKeyId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Razorpay is not configured on the server.' });
            return;
        }

        setIsSubmitting(true);
        const pendingResult = await handleCreatePendingDonation({ ...values, userId: user.id, donorName: user.name });

        if (!pendingResult.success || !pendingResult.donation?.id) {
            toast({ variant: 'destructive', title: 'Error', description: pendingResult.error || 'Failed to create a pending donation record.' });
            setIsSubmitting(false);
            return;
        }

        const donationId = pendingResult.donation.id;

        const orderResult = await createRazorpayOrder(values.amount, 'INR');

        if (!orderResult.success || !orderResult.order) {
            toast({ variant: 'destructive', title: 'Error', description: orderResult.error || 'Could not create Razorpay order.' });
            setIsSubmitting(false);
            return;
        }

        const { order } = orderResult;
        
        const options = {
            key: razorpayKeyId,
            amount: order.amount,
            currency: order.currency,
            name: organization?.name || 'Baitul Mal',
            description: `Donation for ${values.purpose}`,
            order_id: order.id,
            handler: async function (response: any) {
                const verificationResult = await verifyRazorpayPayment({
                    orderCreationId: order.id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature,
                    donationId: donationId,
                    adminUserId: user.id! // The user is the one performing this action.
                });
                
                if (verificationResult.success) {
                    router.push('/my-donations');
                    toast({ variant: 'success', title: 'Payment Successful!', description: 'Thank you for your generous donation.' });
                } else {
                    toast({ variant: 'destructive', title: 'Payment Failed', description: verificationResult.error || 'Payment verification failed. Please contact support.' });
                }
            },
            prefill: {
                name: user.name,
                email: user.email,
                contact: user.phone,
            },
            notes: {
                donation_id: donationId,
                user_id: user.id,
            },
            theme: {
                color: '#3399cc'
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setIsSubmitting(false);
    }

    async function onSubmit(values: PayNowFormValues) {
        if (!user || !user.id) {
            handleLoginRedirect();
            return;
        }
        setIsSubmitting(true);
        const result = await handleCreatePendingDonation({ ...values, userId: user.id, donorName: user.name });

        if (result.success) {
            setDonationData(values);
            setIsQrDialogOpen(true);
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to prepare donation.' });
        }
        setIsSubmitting(false);
    }
    
     return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {(targetLead || linkedLead) && (
                        <Alert className="mb-6">
                            <Info className="h-4 w-4" />
                            <AlertTitle>You are donating to a specific case!</AlertTitle>
                            <AlertDescription>
                            Your contribution will be directed to help <span className="font-semibold">{targetLead?.name || linkedLead?.name}</span> for the purpose of <span className="font-semibold">{targetLead?.purpose || linkedLead?.purpose}</span>.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {(targetCampaignId || linkedCampaign) && (
                        <Alert className="mb-6">
                            <Info className="h-4 w-4" />
                            <AlertTitle>You are donating to a specific campaign!</AlertTitle>
                            <AlertDescription>
                            Your contribution will support our <span className="font-semibold">{(targetCampaignId || linkedCampaign?.name)?.replace(/-/g, ' ')}</span> campaign.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Donation Purpose</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!targetLead || !!targetCampaignId || !!linkedLead || !!linkedCampaignId}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a purpose" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {donationPurposes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                                { (!!targetLead || !!targetCampaignId) && <FormDescription>Purpose is automatically set.</FormDescription>}
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Donation Amount (INR)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Enter amount" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                     <div className="space-y-2">
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
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="isAnonymous"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Donate Anonymously</FormLabel>
                                    <FormDescription>Your name will not be publicly displayed.</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {!isAnonymous && (
                            <FormField
                            control={form.control}
                            name="donorName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    
                    <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Any specific instructions or notes for your donation?"
                                className="resize-y"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <div className="flex flex-col gap-4">
                         <Button 
                            type="button" 
                            onClick={() => handlePayWithRazorpay(form.getValues())}
                            disabled={isSubmitting || !razorpayKeyId} 
                            className="w-full" 
                            size="lg"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                            Pay with Razorpay (Card, Netbanking, etc.)
                        </Button>
                        <Button 
                            type={!user ? "button" : "submit"} 
                            onClick={!user ? handleLoginRedirect : undefined}
                            disabled={isSubmitting} 
                            className="w-full" 
                            size="lg"
                            variant="secondary"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HandHeart className="mr-2 h-4 w-4" />}
                            {user ? 'Pay with UPI / QR Code' : 'Login to Pay'}
                        </Button>
                    </div>
                </form>
            </Form>
            {donationData && organization && (
                <QrCodeDialog
                    open={isQrDialogOpen}
                    onOpenChange={setIsQrDialogOpen}
                    donationDetails={donationData}
                    organization={organization}
                />
            )}
             <LinkLeadCampaignDialog
                open={isLinkDialogOpen}
                onOpenChange={setIsLinkDialogOpen}
                leads={openLeads}
                campaigns={activeCampaigns}
                onLink={handleLinkSelection}
            />
        </>
     );
}

// Helper to convert file to Base64 Data URL
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function UploadProofSection({ user }: { user: User | null }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isScanning, setIsScanning] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        } else {
            setPreviewUrl(null);
        }
    }
    
    const handleScan = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!file) {
            toast({ variant: 'destructive', title: 'No File', description: 'Please select a screenshot to upload.' });
            return;
        }
        setIsScanning(true);
        
        const formData = new FormData();
        formData.append("proofFile", file);

        const result = await scanProof(formData);

        if (result.success && result.details) {
            const queryParams = new URLSearchParams();
            Object.entries(result.details).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.set(key, String(value));
                }
            });
            
             // The user is already logged in, so we know their ID
            if (user?.id) {
                queryParams.set('donorId', user.id);
            }
            
            try {
                const dataUrl = await fileToDataUrl(file);
                sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({ dataUrl }));
            } catch (e) {
                 toast({ variant: 'destructive', title: "Error preparing screenshot" });
            }
            
            router.push(`/donate/confirm?${queryParams.toString()}`);

        } else {
             toast({ variant: 'destructive', title: "Scan Failed", description: result.error || "An unknown error occurred." });
        }
        setIsScanning(false);
    };

    const handleLoginRedirect = () => {
        toast({
            title: "Login Required",
            description: "Please log in to upload proof.",
        });
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
        router.push('/login');
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="paymentScreenshot">Payment Screenshot</Label>
                <Input 
                    id="paymentScreenshot" 
                    name="proof" 
                    type="file" 
                    required 
                    accept="image/*"
                    onChange={handleFileChange}
                />
                 <FormDescription>
                    Upload a screenshot of a payment you have already made. The system will scan it and take you to a form to confirm the details.
                </FormDescription>
            </div>
             {previewUrl && (
                <div className="p-2 border rounded-md bg-muted/50 flex flex-col items-center gap-4">
                     <div className="relative w-full h-64">
                         <Image src={previewUrl} alt="Screenshot Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" />
                    </div>
                </div>
            )}
            
            <Button 
                onClick={user ? handleScan : handleLoginRedirect} 
                disabled={isScanning || !file} 
                className="w-full"
            >
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {user ? 'Scan and Confirm Donation' : 'Login to Scan'}
            </Button>
        </div>
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
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donationMethod, setDonationMethod] = useState<'payNow' | 'uploadProof'>('payNow');

  const leadId = searchParams.get('leadId');
  const campaignId = searchParams.get('campaignId');

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      setIsLoading(true);
      const storedUserId = localStorage.getItem('userId');
      
      try {
        const [appSettings, orgData, allLeads, allCampaigns] = await Promise.all([
          getAppSettings(),
          getCurrentOrganization(),
          getAllLeads(),
          getAllCampaignsService()
        ]);
        
        setSettings(appSettings);
        setOrganization(orgData);
        setOpenLeads(allLeads.filter(l => l.status === 'Ready For Help' || l.status === 'Publish' || l.status === 'Partial'));
        setActiveCampaigns(allCampaigns.filter(c => c.status === 'Active' || c.status === 'Upcoming'));


        if (storedUserId) {
            const fetchedUser = await getUser(storedUserId);
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
    
    checkAuthAndLoadData();
  }, [leadId, campaignId, router]);
  
  if (isLoading) {
    return (
        <>
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
        </>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
  }
  
  const razorpayEnabled = settings?.paymentGateway?.razorpay?.enabled;

  return (
     <div className="flex-1 space-y-4">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Make a Donation</h2>
        </div>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Your Generosity Matters</CardTitle>
                <CardDescription>
                    Please choose how you'd like to proceed with your donation. Your support is greatly appreciated.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <Button 
                        variant={donationMethod === 'payNow' ? 'default' : 'outline'}
                        onClick={() => setDonationMethod('payNow')}
                        className="h-16 text-base"
                    >
                        <HandHeart className="mr-2"/> Pay Now
                    </Button>
                    <Button
                        variant={donationMethod === 'uploadProof' ? 'default' : 'outline'}
                        onClick={() => setDonationMethod('uploadProof')}
                        className="h-16 text-base"
                    >
                        <UploadCloud className="mr-2"/> Upload Proof
                    </Button>
                </div>

                {donationMethod === 'payNow' ? (
                   <PayNowForm user={user} targetLead={targetLead} targetCampaignId={targetCampaignId} organization={organization} openLeads={openLeads} activeCampaigns={activeCampaigns} razorpayKeyId={razorpayEnabled ? settings.paymentGateway.razorpay.keyId : undefined} />
                ) : (
                   <UploadProofSection user={user} />
                )}
            </CardContent>
        </Card>
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
