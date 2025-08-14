// src/app/donate/confirm/page.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, Suspense } from "react";
import { Loader2, CheckCircle, HandHeart, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User, DonationType, DonationPurpose } from '@/services/types';
import { getUser } from '@/services/user-service';
import { useRouter, useSearchParams } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { handleConfirmDonation } from "../actions";

const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'] as const;
const donationPurposes = ['Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use', 'Loan Repayment'] as const;

const formSchema = z.object({
  donorName: z.string().min(1, "Donor name is required."),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  donationDate: z.date(),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes).optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  rawText: z.string().optional(),
  paymentScreenshotDataUrl: z.string().min(1, "Screenshot data is missing."),
});

type ConfirmDonationFormValues = z.infer<typeof formSchema>;


function ConfirmDonationPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const form = useForm<ConfirmDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      donationDate: new Date(),
    },
  });

  const { setValue } = form;

  useEffect(() => {
    const prefillForm = async () => {
        const storedUserId = localStorage.getItem('userId');
        if(!storedUserId) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to confirm a donation.'});
            router.push('/login');
            return;
        }

        const fetchedUser = await getUser(storedUserId);
        setUser(fetchedUser);

        // Pre-fill from query params
        const amountParam = searchParams.get('amount');
        if (amountParam) setValue('amount', parseFloat(amountParam));

        const dateParam = searchParams.get('date');
        if (dateParam) setValue('donationDate', new Date(dateParam));

        const transactionIdParam = searchParams.get('transactionId');
        if (transactionIdParam) setValue('transactionId', transactionIdParam);
        
        const notesParam = searchParams.get('notes');
        if (notesParam) setValue('notes', notesParam);
        
        const rawTextParam = searchParams.get('rawText');
        if (rawTextParam) setValue('rawText', rawTextParam);
        
        // Pre-fill from logged-in user
        if(fetchedUser) setValue('donorName', fetchedUser.name);

        // Pre-fill screenshot from session storage
        const screenshotData = sessionStorage.getItem('scannedProofDataUrl');
        if (screenshotData) {
            setScreenshotPreview(screenshotData);
            setValue('paymentScreenshotDataUrl', screenshotData);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Screenshot data not found. Please try scanning again.'});
            router.push('/donate');
        }
    };
    prefillForm();
  }, [searchParams, setValue, toast, router]);


  async function onSubmit(values: ConfirmDonationFormValues) {
    if (!user?.id) return;
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'donationDate' && value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const result = await handleConfirmDonation(formData, user.id);
    
    setIsSubmitting(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Donation Recorded!",
        description: `Your donation is now pending verification. Thank you!`,
        icon: <CheckCircle />,
      });
       sessionStorage.removeItem('scannedProofDataUrl');
      router.push('/my-donations');
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Confirm Your Donation</h2>
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Verify Scanned Details</CardTitle>
                <CardDescription>
                    Please review the details extracted from your screenshot. Correct any errors before submitting.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Form */}
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="donorName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Your Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                 <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
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
                                                "pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                                )}
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
                             <FormField
                                control={form.control}
                                name="transactionId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Transaction ID (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-2 gap-4">
                                <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Donation Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
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
                                    <FormLabel>Purpose (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a purpose" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {donationPurposes.map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Add any extra details from the receipt here." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="rawText"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Raw Extracted Text</FormLabel>
                                    <FormControl>
                                        <Textarea className="font-mono text-xs h-32" readOnly {...field} />
                                    </FormControl>
                                    <FormDescription>This is the full text extracted from the image for your reference.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Right Column: Screenshot */}
                        <div className="space-y-4">
                             <FormLabel>Your Screenshot</FormLabel>
                            {screenshotPreview ? (
                                <div className="p-2 border rounded-md bg-muted/50">
                                    <div className="relative w-full h-96">
                                        <Image src={screenshotPreview} alt="Screenshot Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" />
                                    </div>
                                </div>
                            ) : <p className="text-sm text-muted-foreground">Loading screenshot...</p>}
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" disabled={isSubmitting} size="lg">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Confirm & Submit Donation
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}


export default function ConfirmDonationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmDonationPageContent />
        </Suspense>
    )
}
