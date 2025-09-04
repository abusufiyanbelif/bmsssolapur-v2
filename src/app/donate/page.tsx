

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
import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { Loader2, AlertCircle, CheckCircle, HandHeart, Info, UploadCloud, Edit, Link2, XCircle, CreditCard, Save, Banknote, Bot, Text } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { handleCreatePendingDonation } from './actions';
import { createRazorpayOrder, verifyRazorpayPayment } from './razorpay-actions';
import type { User, Lead, DonationPurpose, Organization, Campaign, Donation, DonationType, PaymentMethod, AppSettings } from '@/services/types';
import { getUser, updateUser } from '@/services/user-service';
import { getLead, getAllLeads } from '@/services/lead-service';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import { QrCodeDialog } from "@/components/qr-code-dialog";
import { getAppSettings, getCurrentOrganization } from "@/app/admin/settings/actions";
import { getAllCampaigns as getAllCampaignsService } from "@/services/campaign-service";
import { LinkLeadCampaignDialog } from "./link-lead-campaign-dialog";
import { Badge } from "@/components/ui/badge";
import { useRazorpay } from "@/hooks/use-razorpay";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { getRawTextFromImage, getDetailsFromText } from "@/app/admin/donations/add/actions";


const donationPurposes = ['Zakat', 'Sadaqah', 'Fitr', 'Relief Fund'] as const;
const allPaymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];


// Schema for paying now
const payNowFormSchema = z.object({
  paymentMethod: z.enum(allPaymentMethods, { required_error: "Please select a payment method." }),
  purpose: z.enum(donationPurposes, { required_error: "Please select a purpose."}),
  amount: z.coerce.number().min(10, "Donation amount must be at least ₹10."),
  donorName: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  phone: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
  leadId: z.string().optional(),
  campaignId: z.string().optional(),
  includePledge: z.boolean().default(false),
  // Bank Transfer Fields
  utrNumber: z.string().optional(),
  senderBankName: z.string().optional(),
  senderIfscCode: z.string().optional(),
}).refine(data => {
    if (!data.isAnonymous) {
        return !!data.donorName && data.donorName.length > 0;
    }
    return true;
}, {
    message: "Donor name is required for non-anonymous donations.",
    path: ["donorName"],
}).refine(data => {
    if (data.paymentMethod === 'Bank Transfer') {
        return !!data.utrNumber && data.utrNumber.length > 0;
    }
    return true;
}, {
    message: "UTR Number is required for Bank Transfers.",
    path: ["utrNumber"],
});

export type PayNowFormValues = z.infer<typeof payNowFormSchema>;

function PledgeSettings({ user, onUpdate, organization }: { user: User, onUpdate: () => void, organization: Organization | null }) {
    const { toast } = useToast();
    const [monthlyPledgeEnabled, setMonthlyPledgeEnabled] = useState(user.monthlyPledgeEnabled || false);
    const [monthlyPledgeAmount, setMonthlyPledgeAmount] = useState(user.monthlyPledgeAmount || 0);
    const [enableMonthlyDonationReminder, setEnableMonthlyDonationReminder] = useState(user.enableMonthlyDonationReminder || false);
    const [isSavingPledge, setIsSavingPledge] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const hasChanged = (monthlyPledgeEnabled !== (user.monthlyPledgeEnabled || false)) ||
                           (Number(monthlyPledgeAmount) !== (user.monthlyPledgeAmount || 0)) ||
                           (enableMonthlyDonationReminder !== (user.enableMonthlyDonationReminder || false));
        setIsDirty(hasChanged);
    }, [monthlyPledgeEnabled, monthlyPledgeAmount, enableMonthlyDonationReminder, user]);


    const handleSavePledge = async () => {
        setIsSavingPledge(true);
        try {
            await updateUser(user.id!, {
                monthlyPledgeEnabled,
                monthlyPledgeAmount: Number(monthlyPledgeAmount),
                enableMonthlyDonationReminder,
            });
            toast({ variant: 'success', title: 'Settings Updated', description: 'Your pledge and notification settings have been saved.' });
            onUpdate();
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save your settings.' });
            console.error(e);
        } finally {
            setIsSavingPledge(false);
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>Notification &amp; Pledge Settings</CardTitle>
                <CardDescription>Manage your recurring donation commitment and related notification settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="monthly-pledge-switch" className="font-semibold">Enable Monthly Donation Pledge</Label>
                        <Switch
                            id="monthly-pledge-switch"
                            checked={monthlyPledgeEnabled}
                            onCheckedChange={setMonthlyPledgeEnabled}
                        />
                    </div>
                     {monthlyPledgeEnabled && (
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="pledge-amount">My Monthly Pledge Amount (₹)</Label>
                            <Input
                                id="pledge-amount"
                                type="number"
                                value={monthlyPledgeAmount}
                                onChange={(e) => setMonthlyPledgeAmount(Number(e.target.value))}
                                placeholder="e.g., 500"
                            />
                        </div>
                    )}
                </div>
                 <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="monthly-reminder-switch" className="font-semibold">Enable Monthly Donation Reminder</Label>
                         <Switch
                            id="monthly-reminder-switch"
                            checked={enableMonthlyDonationReminder}
                            onCheckedChange={setEnableMonthlyDonationReminder}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">If enabled, you will receive an email reminder to make your monthly donation.</p>
                </div>
            </CardContent>
            {isDirty && (
                <CardFooter>
                    <Button onClick={handleSavePledge} disabled={isSavingPledge}>
                        {isSavingPledge ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

function PayNowForm({ user, targetLead, targetCampaignId, organization, openLeads, activeCampaigns, razorpayKeyId, onlinePaymentsEnabled }: { user: User | null, targetLead: Lead | null, targetCampaignId: string | null, organization: Organization | null, openLeads: Lead[], activeCampaigns: Campaign[], razorpayKeyId?: string, onlinePaymentsEnabled: boolean }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRazorpayLoaded, razorpayError] = useRazorpay();
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [donationData, setDonationData] = useState<PayNowFormValues | null>(null);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    
    const availablePaymentMethods = useMemo(() => {
        if (!onlinePaymentsEnabled) {
            return allPaymentMethods.filter(m => m !== 'Online (UPI/Card)');
        }
        return allPaymentMethods;
    }, [onlinePaymentsEnabled]);
    
    const form = useForm<PayNowFormValues>({
        resolver: zodResolver(payNowFormSchema),
        defaultValues: {
            amount: 100,
            isAnonymous: false,
            purpose: 'Sadaqah',
            includePledge: false,
            paymentMethod: onlinePaymentsEnabled ? 'Online (UPI/Card)' : 'Bank Transfer',
            donorName: '',
            phone: '',
            email: '',
            notes: '',
            leadId: '',
            campaignId: '',
            utrNumber: '',
            senderBankName: '',
            senderIfscCode: '',
        },
    });

    const { watch, setValue, getValues, control } = form;

    const linkedLeadId = watch("leadId");
    const linkedCampaignId = watch("campaignId");
    const includePledge = watch("includePledge");
    const paymentMethod = watch("paymentMethod");

    const linkedLead = linkedLeadId ? openLeads.find(l => l.id === linkedLeadId) : null;
    const linkedCampaign = linkedCampaignId ? activeCampaigns.find(c => c.id === linkedCampaignId) : null;
    
    const availableDonationTypes = useMemo(() => {
        if (linkedLead && linkedLead.acceptableDonationTypes && linkedLead.acceptableDonationTypes.length > 0) {
            if(linkedLead.acceptableDonationTypes.includes('Any')) return donationPurposes;
            return linkedLead.acceptableDonationTypes.filter(t => donationPurposes.includes(t as any)) as typeof donationPurposes;
        }
        return donationPurposes;
    }, [linkedLead]);
    
    // Auto-update purpose when lead changes
    useEffect(() => {
        const currentType = getValues('purpose');
        if (linkedLead && !availableDonationTypes.includes(currentType)) {
            setValue('purpose', availableDonationTypes[0]);
        }
    }, [linkedLead, availableDonationTypes, setValue, getValues]);


    useEffect(() => {
        if(user) {
            setValue('donorName', user.name);
            setValue('phone', user.phone);
            setValue('email', user.email || '');
        }
    }, [user, setValue]);
    
    useEffect(() => {
        if (targetLead) {
            setValue('leadId', targetLead.id);
            const leadDonationTypes = targetLead.acceptableDonationTypes?.filter(t => donationPurposes.includes(t as any)) as (typeof donationPurposes) | undefined;
            if(leadDonationTypes && leadDonationTypes.length > 0) {
                setValue('purpose', leadDonationTypes[0]);
            } else {
                setValue('purpose', 'Sadaqah');
            }
        }
        if (targetCampaignId) {
            setValue('campaignId', targetCampaignId);
            setValue('purpose', 'Sadaqah'); // Default purpose for campaigns
        }
    }, [targetLead, targetCampaignId, setValue]);

    useEffect(() => {
        if (includePledge && user?.monthlyPledgeEnabled && user.monthlyPledgeAmount) {
            setValue('amount', user.monthlyPledgeAmount);
            setValue('notes', 'Monthly pledged donation to organization.');
        } else {
            // Reset to default or clear if you want
            setValue('amount', 100);
            setValue('notes', '');
        }
    }, [includePledge, user, setValue]);


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
        if (!razorpayKeyId || !isRazorpayLoaded) {
            toast({ variant: 'destructive', title: 'Error', description: razorpayError || 'Payment gateway is not ready. Please try again in a moment.' });
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
            },
            config: {
                display: {
                    blocks: {
                        upi: {
                            name: "Pay with UPI",
                            instruments: [
                                { method: "upi" },
                                { method: "gpay" },
                                { method: "phonepe" },
                                { method: "paytm" },
                            ],
                        },
                        banks: {
                            name: "Pay with Netbanking",
                            instruments: [
                                { method: "netbanking" }
                            ]
                        },
                        cards: {
                             name: "Pay with Card",
                            instruments: [
                                { method: "card" }
                            ]
                        },
                         wallets: {
                             name: "Pay with Wallet",
                            instruments: [
                                { method: "wallet" }
                            ]
                        }
                    },
                    sequence: ["block.upi", "block.banks", "block.cards", "block.wallets"],
                    preferences: {
                        show_default_blocks: true,
                    },
                },
            },
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
            if (values.paymentMethod === 'Online (UPI/Card)') {
                setDonationData(values);
                setIsQrDialogOpen(true);
            } else {
                toast({
                    variant: "success",
                    title: "Donation Recorded",
                    description: "Thank you! Please complete your donation via the chosen method. Our team will verify it soon.",
                });
                router.push('/my-donations');
            }
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

                    {user?.monthlyPledgeEnabled && user.monthlyPledgeAmount && user.monthlyPledgeAmount > 0 && (
                        <FormField
                            control={form.control}
                            name="includePledge"
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
                                            Fulfill my monthly pledge of ₹{user.monthlyPledgeAmount.toLocaleString()}
                                        </FormLabel>
                                        <FormDescription>
                                            This will set the donation amount to your pledged amount.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    )}
                    
                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a payment method" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {availablePaymentMethods.map(method => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Donation Purpose</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!!linkedLead}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a purpose" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {availableDonationTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                                { linkedLead && <FormDescription>Only showing types allowed for this lead.</FormDescription>}
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
                                <Input type="number" placeholder="Enter amount" {...field} disabled={includePledge} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
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
                    
                    {paymentMethod === 'Bank Transfer' && (
                        <div className="space-y-6 pt-4 border-t">
                             <Alert>
                                <Banknote className="h-4 w-4" />
                                <AlertTitle>Bank Transfer Details</AlertTitle>
                                <AlertDescription>
                                    Please transfer your donation to the account below and enter the UTR number to help us verify your payment.
                                </AlertDescription>
                             </Alert>
                             <div className="p-4 border rounded-lg bg-muted/50 space-y-2 text-sm">
                                <p><strong>Account Name:</strong> {organization?.bankAccountName}</p>
                                <p><strong>Account Number:</strong> {organization?.bankAccountNumber}</p>
                                <p><strong>IFSC Code:</strong> {organization?.bankIfscCode}</p>
                             </div>
                             <FormField
                                control={control}
                                name="utrNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>UTR Number</FormLabel>
                                        <FormControl><Input placeholder="Enter the transaction reference number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={control} name="senderBankName" render={({ field }) => (<FormItem><FormLabel>Your Bank Name</FormLabel><FormControl><Input placeholder="e.g., State Bank of India" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={control} name="senderIfscCode" render={({ field }) => (<FormItem><FormLabel>Your Branch IFSC Code</FormLabel><FormControl><Input placeholder="e.g., SBIN0001234" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </div>
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
                        {onlinePaymentsEnabled && paymentMethod === 'Online (UPI/Card)' && razorpayKeyId && (
                           <>
                                <Button 
                                    type="button" 
                                    onClick={form.handleSubmit(handlePayWithRazorpay)}
                                    disabled={!isRazorpayLoaded || isSubmitting}
                                    className="w-full" 
                                    size="lg"
                                >
                                    {isSubmitting || !isRazorpayLoaded ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                                    Pay with Razorpay
                                </Button>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                                 <Button 
                                    type={!user ? "button" : "submit"} 
                                    onClick={!user ? handleLoginRedirect : undefined}
                                    disabled={isSubmitting}
                                    className="w-full" 
                                    size="lg"
                                    variant="secondary"
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HandHeart className="mr-2 h-4 w-4" />}
                                    {user ? 'Pay via Manual UPI / QR Code' : 'Login to Pay'}
                                </Button>
                            </>
                        )}
                         {(!onlinePaymentsEnabled || paymentMethod !== 'Online (UPI/Card)') && (
                            <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HandHeart className="mr-2 h-4 w-4" />}
                                Submit Donation Record
                            </Button>
                         )}
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
        formData.append("imageFile", file);

        const textResult = await getRawTextFromImage(formData);

        if (!textResult.success || !textResult.text) {
             toast({ variant: 'destructive', title: 'Scan Failed', description: textResult.error || "Could not extract text from the image." });
             setIsScanning(false);
             return;
        }

        const detailsResult = await getDetailsFromText(textResult.text);

        if (detailsResult.success && detailsResult.details) {
            const queryParams = new URLSearchParams();
            if(detailsResult.details.rawText) {
                queryParams.set('rawText', encodeURIComponent(detailsResult.details.rawText));
            }
            
            try {
                const dataUrl = await fileToDataUrl(file);
                sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({ details: detailsResult.details, dataUrl, rawText: detailsResult.details.rawText }));
            } catch (e) {
                 toast({ variant: 'destructive', title: "Error preparing screenshot" });
            }
            
            router.push(`/donate/confirm?${queryParams.toString()}`);

        } else {
             toast({ variant: 'destructive', title: 'Parsing Failed', description: detailsResult.error || "An unknown error occurred." });
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
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donationMethod, setDonationMethod] = useState<'payNow' | 'uploadProof'>('payNow');

  const leadId = searchParams.get('leadId');
  const campaignId = searchParams.get('campaignId');
  
  const fetchPageData = async () => {
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

  useEffect(() => {
    fetchPageData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, campaignId, router]);
  
  if (isLoading) {
    return (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
  }
  
  const onlinePaymentsEnabled = settings?.features?.onlinePaymentsEnabled ?? false;
  const razorpayEnabled = settings?.paymentGateway?.razorpay?.enabled && onlinePaymentsEnabled;
  const razorpayKey = razorpayEnabled ? (settings.paymentGateway.razorpay.mode === 'live' ? settings.paymentGateway.razorpay.live.keyId : settings.paymentGateway.razorpay.test.keyId) : undefined;


  return (
     <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Make a Donation</h2>
        </div>
        {user && user.roles.includes('Donor') && <PledgeSettings user={user} onUpdate={fetchPageData} organization={organization} />}
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
                   <PayNowForm user={user} targetLead={targetLead} targetCampaignId={targetCampaignId} organization={organization} openLeads={openLeads} activeCampaigns={activeCampaigns} razorpayKeyId={razorpayKey} onlinePaymentsEnabled={onlinePaymentsEnabled} />
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
