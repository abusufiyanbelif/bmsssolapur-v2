

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Loader2, FileUp, ScanEye, AlertTriangle, FileText, TextSelect, Bot, Text } from "lucide-react";
import { handleFundTransfer } from "./actions";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { ExtractDonationDetailsOutput } from '@/ai/schemas';
import Image from "next/image";
import { FormDescription, FormField, FormControl, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import type { PaymentMethod } from "@/services/types";


const paymentApps = ['Google Pay', 'PhonePe', 'Paytm'] as const;

interface AddTransferDialogProps {
  leadId: string;
}

export function AddTransferDialog({ leadId }: AddTransferDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const form = useForm();
  const { setValue, register, handleSubmit, getValues, watch } = form;

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setAdminUserId(storedUserId);
    }
  }, [open]);

   const onFormSubmit = async (data: any) => {
    if (!adminUserId) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Could not identify the logged-in administrator. Please log out and back in." });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(formRef.current!);
    
    formData.append("adminUserId", adminUserId);
    
    const result = await handleFundTransfer(leadId, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({ variant: "success", title: "Transfer Recorded", description: "The fund transfer has been successfully recorded." });
      setOpen(false);
      form.reset();
      router.refresh(); 
    } else {
      toast({ variant: "destructive", title: "Submission Failed", description: result.error || "An unknown error occurred." });
    }
  };
  
  const paymentApp = watch("paymentApp");
  const paymentMethod = watch("paymentMethod");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset();
      }
      setOpen(isOpen)
    }}>
      <DialogTrigger asChild>
        <Button variant="default">
          <FileUp className="mr-2 h-4 w-4" />
          Add Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Record Fund Transfer</DialogTitle>
          <DialogDescription>
            Fill out the details below to record a payment.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit(onFormSubmit)} className="grid md:grid-cols-2 gap-x-8 gap-y-4 max-h-[80vh] overflow-y-auto pr-2">
            
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input id="amount" {...register("amount")} type="number" required placeholder="e.g., 5000" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Input id="status" {...register("status")} type="text" placeholder="e.g., Successful" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="transactionId">Main Transaction ID</Label>
                    <Input id="transactionId" {...register("transactionId")} type="text" placeholder="Enter primary reference" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                     <Select onValueChange={(v) => setValue('paymentMethod', v)} defaultValue={getValues('paymentMethod')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {(['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'] as PaymentMethod[]).map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                </div>
                {paymentMethod === 'Online (UPI/Card)' && (
                    <div className="space-y-2">
                        <Label htmlFor="paymentApp">Payment App</Label>
                        <Select onValueChange={(v) => setValue('paymentApp', v)} defaultValue={getValues('paymentApp')}>
                           <SelectTrigger><SelectValue placeholder="Select UPI app..." /></SelectTrigger>
                           <SelectContent>
                               {paymentApps.map(app => <SelectItem key={app} value={app}>{app}</SelectItem>)}
                           </SelectContent>
                        </Select>
                    </div>
                )}
                 {paymentApp === 'Google Pay' && (
                    <div className="space-y-2">
                        <Label htmlFor="googlePayTransactionId">Google Pay Transaction ID</Label>
                        <Input id="googlePayTransactionId" {...register("googlePayTransactionId")} type="text" />
                    </div>
                 )}
                 <div className="space-y-2">
                    <Label htmlFor="utrNumber">UTR Number</Label>
                    <Input id="utrNumber" {...register("utrNumber")} type="text" placeholder="Enter UTR number" />
                </div>
                  {paymentApp === 'PhonePe' && (
                    <div className="space-y-2">
                        <Label htmlFor="phonePeTransactionId">PhonePe Transaction ID</Label>
                        <Input id="phonePeTransactionId" {...register("phonePeTransactionId")} type="text" />
                    </div>
                 )}
                 {paymentApp === 'Paytm' && (
                    <div className="space-y-2">
                        <Label htmlFor="paytmUpiReferenceNo">Paytm UPI Reference No.</Label>
                        <Input id="paytmUpiReferenceNo" {...register("paytmUpiReferenceNo")} type="text" />
                    </div>
                 )}

                <h3 className="font-semibold text-lg border-b pb-2 pt-4">Participant Details</h3>
                 <div className="space-y-2">
                    <Label htmlFor="senderName">Sender Name</Label>
                    <Input id="senderName" {...register("senderName")} type="text" placeholder="As per bank records" />
                </div>
                 {paymentApp === 'Google Pay' && <div className="space-y-2"><Label htmlFor="googlePaySenderName">Google Pay Sender Name</Label><Input id="googlePaySenderName" {...register("googlePaySenderName")} /></div>}
                 {paymentApp === 'PhonePe' && <div className="space-y-2"><Label htmlFor="phonePeSenderName">PhonePe Sender Name</Label><Input id="phonePeSenderName" {...register("phonePeSenderName")} /></div>}
                 {paymentApp === 'Paytm' && <div className="space-y-2"><Label htmlFor="paytmSenderName">Paytm Sender Name</Label><Input id="paytmSenderName" {...register("paytmSenderName")} /></div>}
                <div className="space-y-2">
                    <Label htmlFor="senderUpiId">Sender UPI ID</Label>
                    <Input id="senderUpiId" {...register("senderUpiId")} type="text" placeholder="e.g., sender@upi" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="senderAccountNumber">Sender Account Number</Label>
                    <Input id="senderAccountNumber" {...register("senderAccountNumber")} type="text" placeholder="e.g., XXXXXX1234" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input id="recipientName" {...register("recipientName")} type="text" placeholder="As per bank records" />
                </div>
                {paymentApp === 'Google Pay' && <div className="space-y-2"><Label htmlFor="googlePayRecipientName">Google Pay Recipient Name</Label><Input id="googlePayRecipientName" {...register("googlePayRecipientName")} /></div>}
                {paymentApp === 'PhonePe' && <div className="space-y-2"><Label htmlFor="phonePeRecipientName">PhonePe Recipient Name</Label><Input id="phonePeRecipientName" {...register("phonePeRecipientName")} /></div>}
                {paymentApp === 'Paytm' && <div className="space-y-2"><Label htmlFor="paytmRecipientName">Paytm Recipient Name</Label><Input id="paytmRecipientName" {...register("paytmRecipientName")} /></div>}
                 <div className="space-y-2">
                    <Label htmlFor="recipientAccountNumber">Recipient Account Number</Label>
                    <Input id="recipientAccountNumber" {...register("recipientAccountNumber")} type="text" placeholder="e.g., XXXXXX5678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="recipientUpiId">Recipient UPI ID</Label>
                    <Input id="recipientUpiId" {...register("recipientUpiId")} type="text" placeholder="e.g., username@upi" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="recipientPhone">Recipient Phone</Label>
                    <Input id="recipientPhone" {...register("recipientPhone")} type="text" placeholder="e.g., 9876543210" />
                </div>

                <h3 className="font-semibold text-lg border-b pb-2 pt-4">Additional Info</h3>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" {...register("notes")} placeholder="e.g., Bank transfer reference, payment details..." />
                </div>
            </div>

            {/* Right Column - Upload & Preview */}
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="proof">Proof of Transfer</Label>
                    <div className="flex gap-2">
                        <Input id="proof" name="proof" type="file" accept="image/*,application/pdf" />
                    </div>
                    <FormDescription>A screenshot or PDF receipt is required for online payments.</FormDescription>
                </div>
            </div>
            
            <div className="md:col-span-2">
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isSubmitting}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                        Record Transfer
                    </Button>
                </DialogFooter>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
