

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
import { Loader2, Edit, Save, X, Upload, CalendarIcon, FileText } from "lucide-react";
import type { Donation, DonationStatus, DonationType, DonationPurpose } from "@/services/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadProofDialog } from "../../upload-proof-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from 'next/image';

const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'] as const;
const donationPurposes = ['Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use', 'Loan Repayment'] as const;
const donationStatuses = ["Pending verification", "Verified", "Failed/Incomplete", "Allocated"] as const;
const paymentApps = ['Google Pay', 'PhonePe', 'Paytm', 'Other'];

const formSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  donationDate: z.date(),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes).optional(),
  status: z.enum(donationStatuses),
  transactionId: z.string().min(1, "Transaction ID is required."),
  donorUpiId: z.string().optional(),
  paymentApp: z.string().optional(),
  notes: z.string().optional(),
});

type EditDonationFormValues = z.infer<typeof formSchema>;

interface EditDonationFormProps {
  donation: Donation;
  onUpdate: () => void;
}

export function EditDonationForm({ donation, onUpdate }: EditDonationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // In a real app, this would be handled by a more robust session management.
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
  }, []);

  const form = useForm<EditDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: donation.amount,
      donationDate: (donation.donationDate as any).toDate(),
      type: donation.type as Exclude<DonationType, 'Split'>,
      purpose: donation.purpose,
      status: donation.status,
      transactionId: donation.transactionId || '',
      donorUpiId: donation.donorUpiId || '',
      paymentApp: donation.paymentApp || '',
      notes: donation.notes || '',
    },
  });

  const { formState: { isDirty }, reset } = form;

  const handleCancel = () => {
    reset({
        amount: donation.amount,
        donationDate: (donation.donationDate as any).toDate(),
        type: donation.type as Exclude<DonationType, 'Split'>,
        purpose: donation.purpose,
        status: donation.status,
        transactionId: donation.transactionId || '',
        donorUpiId: donation.donorUpiId || '',
        paymentApp: donation.paymentApp || '',
        notes: donation.notes || '',
    });
    setIsEditing(false);
  }

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
    formData.append("donationDate", values.donationDate.toISOString());
    formData.append("type", values.type);
    if (values.purpose) formData.append("purpose", values.purpose);
    if (values.donorUpiId) formData.append("donorUpiId", values.donorUpiId);
    if (values.paymentApp) formData.append("paymentApp", values.paymentApp);
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
      onUpdate();
      setIsEditing(false);
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
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Edit Donation</CardTitle>
                    <CardDescription>
                        Update the details for the donation from <span className="font-semibold">{donation.donorName}</span>.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {(!donation.paymentScreenshotUrls || donation.paymentScreenshotUrls.length === 0) && (
                         <UploadProofDialog donation={donation} onUploadSuccess={onUpdate}>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Proof
                            </Button>
                        </UploadProofDialog>
                    )}
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {donation.paymentScreenshotUrls && donation.paymentScreenshotUrls.length > 0 && (
                 <div className="mb-8">
                    <h3 className="font-semibold text-lg mb-4">Uploaded Proofs</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                        {donation.paymentScreenshotUrls.map((url, index) => (
                           <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative group aspect-square">
                               <Image src={url} alt={`Proof ${index + 1}`} fill className="object-cover rounded-md" data-ai-hint="payment screenshot" />
                           </a>
                        ))}
                    </div>
                </div>
            )}
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Enter amount" {...field} disabled={!isEditing}/>
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
                                    disabled={!isEditing}
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
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

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField
                        control={form.control}
                        name="paymentApp"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment App</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment app" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {paymentApps.map(method => (
                                    <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="donorUpiId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Donor UPI ID</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., username@okhdfc" {...field} disabled={!isEditing} />
                            </FormControl>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
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
                        <Input placeholder="Enter transaction ID or reference number" {...field} disabled={!isEditing} />
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
                        <Textarea placeholder="Add any internal notes about this donation" {...field} disabled={!isEditing} />
                    </FormControl>
                     <FormDescription>These notes are for internal use only and not visible to the donor.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {isEditing && (
                    <div className="flex gap-4">
                        <Button type="submit" disabled={isSubmitting || !isDirty}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                         <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                )}
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
