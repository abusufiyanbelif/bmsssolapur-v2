

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
import { useState, useEffect, Suspense, useRef } from "react";
import { Loader2, Info, Image as ImageIcon } from "lucide-react";
import type { User, DonationType, DonationPurpose } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUser, getUserByUserId, getUserByPhone } from "@/services/user-service";
import { useSearchParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

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
  notes: z.string().optional(),
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

// Helper to convert Base64 Data URL back to a File object
const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

function AddDonationFormContent({ users }: AddDonationFormProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<User | null>(null);
  const [manualScreenshotPreview, setManualScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      notes: "",
    },
  });
  
  const { watch, setValue, trigger } = form;
  const paymentMethod = watch("paymentMethod");
  const includeTip = watch("includeTip");
  const amount = watch("amount");
  const tipAmount = watch("tipAmount");
  const isAnonymous = watch("isAnonymous");
  
  useEffect(() => {
    const prefillData = async () => {
        const amountParam = searchParams.get('amount');
        const transactionIdParam = searchParams.get('transactionId');
        const donorIdentifierParam = searchParams.get('donorIdentifier');
        const notesParam = searchParams.get('notes');

        if (amountParam) setValue('amount', parseFloat(amountParam));
        if (transactionIdParam) setValue('transactionId', transactionIdParam);
        if (notesParam) setValue('notes', notesParam);

        if (donorIdentifierParam) {
            let user = null;
            if (donorIdentifierParam.includes('@')) {
                user = await getUserByUserId(donorIdentifierParam);
            } else if (/^[0-9]{10,}/.test(donorIdentifierParam)) {
                user = await getUserByPhone(donorIdentifierParam.slice(-10));
            } else {
                 user = await getUserByUserId(donorIdentifierParam);
            }
            
            if (user && user.roles.includes('Donor')) {
                setValue('donorId', user.id!);
                setSelectedDonor(user);
            }
        }
        
        // Check for manually passed screenshot from dialog
        const screenshotData = sessionStorage.getItem('manualDonationScreenshot');
        if (screenshotData) {
            try {
                const { dataUrl, name, type } = JSON.parse(screenshotData);
                setManualScreenshotPreview(dataUrl);

                // Convert data URL back to a File and set it in the form
                const screenshotFile = await dataUrlToFile(dataUrl, name);
                
                // Use a DataTransfer object to set the file on the input
                if (fileInputRef.current) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(screenshotFile);
                    fileInputRef.current.files = dataTransfer.files;
                    setValue('paymentScreenshot', screenshotFile);
                    trigger('paymentScreenshot');
                }
            } catch (error) {
                console.error("Error processing session screenshot", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not load the screenshot for manual entry." });
            } finally {
                // Clean up sessionStorage
                sessionStorage.removeItem('manualDonationScreenshot');
            }
        }
    }
    prefillData();
  }, [searchParams, setValue, trigger, toast]);

  useEffect(() => {
    if (selectedDonor) {
        setValue('isAnonymous', !!selectedDonor.isAnonymousAsDonor);
    }
  }, [selectedDonor, setValue]);
  
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
    if(values.notes) formData.append("notes", values.notes);
    
    const result = await handleAddDonation(formData);

    setIsSubmitting(false);

    if (result.success && result.donation) {
      toast({
        title: "Donation Added",
        description: `Successfully added donation from ${result.donation.donorName}.`,
      });
      form.reset();
      setSelectedDonor(null);
      setManualScreenshotPreview(null);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <>
      {manualScreenshotPreview && (
          <div className="mb-8 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5"/>
                Screenshot for Manual Entry
              </h3>
              <div className="flex justify-center">
                   <div className="relative w-full h-80">
                        <Image src={manualScreenshotPreview} alt="Screenshot Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" />
                    </div>
              </div>
          </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
          <FormField
              control={form.control}
              name="donorId"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Donor</FormLabel>
                  <Select
                      onValueChange={async (value) => {
                          field.onChange(value);
                          const donor = await getUser(value);
                          setSelectedDonor(donor);
                      }}
                      value={field.value}
                  >
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
                    If checked, the donor's name will be hidden from public view for this specific donation. This is automatically checked if the user's profile is set to anonymous.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {isAnonymous && selectedDonor && (
              <div className="space-y-2">
                  <FormLabel>Anonymous Donor ID</FormLabel>
                  <Input value={selectedDonor.anonymousDonorId || "Will be generated on save"} disabled />
                  <FormDescription>This ID will be used for public display to protect the donor's privacy.</FormDescription>
              </div>
          )}

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
          
          <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                      <Textarea placeholder="Add any internal notes, or comments from the screenshot." {...field} />
                  </FormControl>
                      <FormDescription>These notes are for internal use only and not visible to the donor.</FormDescription>
                  <FormMessage />
                  </FormItem>
              )}
          />

          {paymentMethod !== "Cash" && (
              <FormField
              control={form.control}
              name="paymentScreenshot"
              render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                  <FormLabel>Payment Screenshot</FormLabel>
                  <FormControl>
                      <Input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                            const file = e.target.files ? e.target.files[0] : null;
                            onChange(file);
                            // If user manually selects a file, clear the session preview
                            if(file) setManualScreenshotPreview(null);
                        }}
                        {...rest}
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
    </>
  );
}

export function AddDonationForm(props: AddDonationFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddDonationFormContent {...props} />
        </Suspense>
    )
}
