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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle, HandHeart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { handleCreatePendingDonation } from './actions';
import type { User } from '@/services/types';
import { getUser } from '@/services/user-service';
import { useRouter } from 'next/navigation';

const donationPurposes = ['Zakat', 'Sadaqah', 'Fitrah', 'Relief Fund'] as const;

const formSchema = z.object({
  purpose: z.enum(donationPurposes),
  amount: z.coerce.number().min(10, "Donation amount must be at least ₹10."),
  donorName: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  phone: z.string().optional(),
  email: z.string().optional(),
  proof: z.any().optional(),
  notes: z.string().optional(),
}).refine(data => {
    if (!data.isAnonymous) {
        return !!data.donorName && data.donorName.length > 0;
    }
    return true;
}, {
    message: "Donor name is required for non-anonymous donations.",
    path: ["donorName"],
});

type DonationFormValues = z.infer<typeof formSchema>;

export default function DonatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
        getUser(storedUserId).then(setUser);
    }
  }, []);

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 100,
      isAnonymous: false,
    },
  });

  useEffect(() => {
      if(user) {
          form.setValue('donorName', user.name);
          form.setValue('phone', user.phone);
          form.setValue('email', user.email);
      }
  }, [user, form]);

  const isAnonymous = form.watch("isAnonymous");

  async function onSubmit(values: DonationFormValues) {
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
     <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Make a Donation</h2>
        </div>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Your Generosity Matters</CardTitle>
                <CardDescription>
                    Please fill out the form below to proceed with your donation. Your support is greatly appreciated.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Donation Purpose</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        name="proof"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Upload Proof (Optional)</FormLabel>
                            <FormControl>
                                <Input 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                />
                            </FormControl>
                            <FormDescription>
                                You can upload a screenshot after payment on the 'My Donations' page.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

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
                        Pay with UPI
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
     </div>
  );
}
