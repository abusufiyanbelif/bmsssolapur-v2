
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
import { handleUpdateDonation } from "./actions";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { Donation, DonationStatus, DonationType, DonationPurpose } from "@/services/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'] as const;
const donationPurposes = ['Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use', 'Loan Repayment'] as const;
const donationStatuses = ["Pending verification", "Verified", "Failed/Incomplete", "Allocated"] as const;

const formSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes).optional(),
  status: z.enum(donationStatuses),
  transactionId: z.string().min(1, "Transaction ID is required."),
  notes: z.string().optional(),
});

type EditDonationFormValues = z.infer<typeof formSchema>;

interface EditDonationFormProps {
  donation: Donation;
}

export function EditDonationForm({ donation }: EditDonationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would be handled by a more robust session management.
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
  }, []);

  const form = useForm<EditDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: donation.amount,
      type: donation.type as Exclude<DonationType, 'Split'>,
      purpose: donation.purpose,
      status: donation.status,
      transactionId: donation.transactionId || '',
      notes: donation.notes || '',
    },
  });

  const { formState: { isDirty } } = form;

  async function onSubmit(values: EditDonationFormValues) {
    if (!adminUserId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not identify the logged in administrator. Please log out and back in.",
        });
        return;
    }

    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("amount", String(values.amount));
    formData.append("type", values.type);
    if (values.purpose) formData.append("purpose", values.purpose);
    formData.append("status", values.status);
    formData.append("transactionId", values.transactionId);
    if (values.notes) formData.append("notes", values.notes);
    
    const result = await handleUpdateDonation(donation.id!, formData, adminUserId);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Donation Updated",
        description: `Successfully updated donation from ${donation.donorName}.`,
      });
      form.reset(values);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
     <Card>
        <CardHeader>
            <CardTitle>Edit Donation</CardTitle>
            <CardDescription>
                Update the details for the donation from <span className="font-semibold">{donation.donorName}</span>.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
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
                        <FormLabel>Purpose</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a purpose (optional)" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {donationPurposes.map(purpose => (
                                <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
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
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {donationStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Transaction ID</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter transaction ID or reference number" {...field} />
                    </FormControl>
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
                        <Textarea placeholder="Add any internal notes about this donation" {...field} />
                    </FormControl>
                     <FormDescription>These notes are for internal use only and not visible to the donor.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
