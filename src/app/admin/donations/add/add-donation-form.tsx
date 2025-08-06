

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
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { User, DonationType, DonationPurpose } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'] as const;
const donationPurposes = ['Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use', 'Loan Repayment'] as const;

const formSchema = z.object({
  donorId: z.string().min(1, "Please select a donor."),
  isAnonymous: z.boolean().default(false),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes).optional(),
  transactionId: z.string().min(1, "Transaction ID is required."),
  paymentScreenshot: z.any().optional(),
  paymentMethod: z.enum(["Bank Transfer", "Cash", "UPI / QR Code", "Other"]),
  includeTip: z.boolean().default(false),
  tipAmount: z.coerce.number().optional(),
}).refine(data => {
    if (data.includeTip) {
        return !!data.tipAmount && data.tipAmount > 0;
    }
    return true;
}, {
    message: "Tip amount must be greater than 0.",
    path: ["tipAmount"],
});

type AddDonationFormValues = z.infer<typeof formSchema>;

interface AddDonationFormProps {
  users: User[];
}

export function AddDonationForm({ users }: AddDonationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
  }, []);
  
  const donorUsers = users.filter(u => u.roles.includes('Donor'));

  const form = useForm<AddDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAnonymous: false,
      amount: 0,
      paymentMethod: "UPI / QR Code",
      includeTip: false,
      tipAmount: 0,
    },
  });

  const { watch } = form;
  const paymentMethod = watch("paymentMethod");
  const includeTip = watch("includeTip");
  const amount = watch("amount");
  const tipAmount = watch("tipAmount");
  
  const totalAmount = (amount || 0) + (tipAmount || 0);

  async function onSubmit(values: AddDonationFormValues) {
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
    formData.append("adminUserId", adminUserId);
    formData.append("donorId", values.donorId!);
    formData.append("isAnonymous", String(values.isAnonymous));
    formData.append("amount", String(values.amount));
    formData.append("type", values.type);
    if(values.purpose) formData.append("purpose", values.purpose);
    formData.append("transactionId", values.transactionId);
    if(values.tipAmount) formData.append("tipAmount", String(values.tipAmount));
    if (values.paymentScreenshot) {
        formData.append("paymentScreenshot", values.paymentScreenshot);
    }
    
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
                    {donorUsers.map(user => (
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
                  Mark this Donation as Anonymous
                </FormLabel>
                <FormDescription>
                  If checked, the donor's name will be hidden from public view for this specific donation.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Primary Donation Amount</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                </FormControl>
                 <FormDescription>The main amount for the donation's purpose.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["UPI / QR Code", "Bank Transfer", "Cash", "Other"].map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
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
          name="includeTip"
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
                  Split Transaction with Tip
                </FormLabel>
                <FormDescription>
                  Check this if the transaction includes a separate amount for organization expenses.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {includeTip && (
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="tipAmount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tip Amount</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Enter tip amount" {...field} />
                        </FormControl>
                        <FormDescription>This amount will be recorded as a separate donation for 'To Organization Use'.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Total Transaction Amount</AlertTitle>
                    <AlertDescription>
                        The total amount you should see on the bank statement is <span className="font-bold">₹{totalAmount.toLocaleString()}</span>.
                    </AlertDescription>
                </Alert>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Primary Donation Category</FormLabel>
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
                <FormLabel>Primary Donation Purpose</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a purpose (optional)" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {donationPurposes.filter(p => p !== 'To Organization Use').map(purpose => (
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
              <FormLabel>Transaction ID / Reference</FormLabel>
              <FormControl>
                <Input placeholder="Enter reference number" {...field} />
              </FormControl>
               <FormDescription>
                This ID should match the bank transaction. It will be used for both the donation and the tip.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {paymentMethod !== "Cash" && (
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
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Donation
        </Button>
      </form>
    </Form>
  );
}
