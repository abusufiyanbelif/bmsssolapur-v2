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
import { Loader2, AlertCircle, CheckCircle, HandHeart, Info, UploadCloud, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { handleCreatePendingDonation, handleScanAndPrefill } from './actions';
import type { User, Lead, DonationPurpose } from '@/services/types';
import { getUser } from '@/services/user-service';
import { getLead } from '@/services/lead-service';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";


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

type PayNowFormValues = z.infer<typeof payNowFormSchema>;


function PayNowForm({ user, targetLead, targetCampaignId }: { user: User | null, targetLead: Lead | null, targetCampaignId: string | null }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<PayNowFormValues>({
        resolver: zodResolver(payNowFormSchema),
        defaultValues: {
        amount: 100,
        isAnonymous: false,
        },
    });

    useEffect(() => {
        if(user) {
            form.setValue('donorName', user.name);
            form.setValue('phone', user.phone);
            form.setValue('email', user.email || undefined);
        }
    }, [user, form]);
    
    useEffect(() => {
        if (targetLead) {
        form.setValue('leadId', targetLead.id);
        form.setValue('purpose', 'Sadaqah'); // Default purpose when donating to a lead
        }
        if (targetCampaignId) {
        form.setValue('campaignId', targetCampaignId);
        form.setValue('purpose', 'Sadaqah'); // Default purpose
        }
    }, [targetLead, targetCampaignId, form]);

    const isAnonymous = form.watch("isAnonymous");

    async function onSubmit(values: PayNowFormValues) {
        setIsSubmitting(true);
        
        try {
            const donationData = { ...values, userId: user?.id };
            const result = await handleCreatePendingDonation(donationData);

            if (result.success && result.upiUrl) {
                toast({
                    title: "Redirecting to UPI...",
                    description: "Your donation has been recorded as pending. Please complete the payment.",
                    variant: 'success'
                });
                window.location.href = result.upiUrl;
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to initiate donation.' });
            }
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
     return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 {targetLead && (
                    <Alert className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertTitle>You are donating to a specific case!</AlertTitle>
                        <AlertDescription>
                           Your contribution will be directed to help <span className="font-semibold">{targetLead.name}</span> for the purpose of <span className="font-semibold">{targetLead.purpose}</span>.
                        </AlertDescription>
                    </Alert>
                )}
                
                {targetCampaignId && (
                     <Alert className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertTitle>You are donating to a specific campaign!</AlertTitle>
                        <AlertDescription>
                           Your contribution will support our <span className="font-semibold">{targetCampaignId.replace(/-/g, ' ')}</span> campaign.
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!targetLead || !!targetCampaignId}>
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

                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HandHeart className="mr-2 h-4 w-4" />}
                    Proceed to Pay with UPI
                </Button>
            </form>
        </Form>
     );
}


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
        formData.append('proof', file);
        
        const result = await handleScanAndPrefill(formData);

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
            
            if (result.dataUrl) {
                // Use session storage to pass the large data URL
                sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({ dataUrl: result.dataUrl }));
            }
            
            router.push(`/admin/donations/add?${queryParams.toString()}`);

        } else {
             toast({ variant: 'destructive', title: "Scan Failed", description: result.error || "An unknown error occurred." });
        }
        setIsScanning(false);
    };

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
            
            <Button onClick={handleScan} disabled={isScanning || !file} className="w-full">
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Scan and Review Donation
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
        if (storedUserId) {
            const fetchedUser = await getUser(storedUserId);
            
            const isAdmin = fetchedUser?.roles.includes('Admin') || fetchedUser?.roles.includes('Super Admin');
            if (isAdmin) {
                router.replace('/admin');
                return;
            }
            setUser(fetchedUser);
        } else {
            // Allow guests to see the form, but they might need to log in to proceed.
            // If there's a target (leadId/campaignId), we should prompt login.
            if(leadId || campaignId) {
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                router.replace('/login');
                return;
            }
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
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
  }
  
  return (
     <div className="flex-1 space-y-4">
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
                   <PayNowForm user={user} targetLead={targetLead} targetCampaignId={targetCampaignId} />
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
