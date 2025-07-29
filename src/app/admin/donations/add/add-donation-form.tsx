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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { handleAddDonation } from "./actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { User } from "@/services/user-service";
import { DonationType, DonationPurpose } from "@/services/donation-service";

const donationTypes: Exclude<DonationType, 'Split'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'];
const donationPurposes: DonationPurpose[] = ['Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use', 'Loan Repayment'];

const formSchema = z.object({
  donorId: z.string().min(1, "Donor is required."),
  isAnonymous: z.boolean().default(false),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes).optional(),
  transactionId: z.string().min(1, "Transaction ID is required."),
  paymentScreenshot: z.any().refine(file => file instanceof File, { message: "Screenshot is required." }),
});

type AddDonationFormValues = z.infer<typeof formSchema>;

interface AddDonationFormProps {
  users: User[];
}

export function AddDonationForm({ users }: AddDonationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const anonymousDonor = users.find(u => u.name === "Anonymous Donor");

  const form = useForm<AddDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAnonymous: false,
      amount: 0,
    },
  });

  const isAnonymous = form.watch("isAnonymous");

  async function onSubmit(values: AddDonationFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("donorId", isAnonymous ? anonymousDonor!.id! : values.donorId);
    formData.append("donorName", isAnonymous ? "Anonymous Donor" : users.find(u => u.id === values.donorId)?.name || "Unknown");
    formData.append("isAnonymous", String(values.isAnonymous));
    formData.append("amount", String(values.amount));
    formData.append("type", values.type);
    if(values.purpose) formData.append("purpose", values.purpose);
    formData.append("transactionId", values.transactionId);
    formData.append("paymentScreenshot", values.paymentScreenshot);
    
    const result = await handleAddDonation(formData);

    setIsSubmitting(false);

    if (result.success && result.donation) {
      toast({
        title: "Donation Added",
        description: `Successfully added donation from ${result.donation.donorName}.`,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="isAnonymous"
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
                  Donate Anonymously
                </FormLabel>
                <FormDescription>
                  If checked, the donation will be linked to a generic "Anonymous Donor" profile.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {!isAnonymous && (
            <FormField
            control={form.control}
            name="donorId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Donor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a donor" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {users.filter(u => u.name !== "Anonymous Donor").map(user => (
                        <SelectItem key={user.id} value={user.id!}>
                            {user.name} ({user.phone})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        )}

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
          name="paymentScreenshot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Screenshot</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                />
              </FormControl>
              <FormDescription>
                Upload a screenshot of the payment for verification.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Donation
        </Button>
      </form>
    </Form>
  );
}
