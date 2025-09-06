

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
import { getRawTextFromImage } from "@/app/actions";
import { handleExtractDonationDetails } from "@/app/admin/donations/add/actions";

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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [extractedDetails, setExtractedDetails] = useState<ExtractDonationDetailsOutput | null>(null);
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
     setRawText(null);
     setExtractedDetails(null);
  };
  
   const handleGetText = async () => {
    if (!file) return;
    setIsExtractingText(true);
    const formData = new FormData();
    formData.append("imageFile", file);
    const result = await getRawTextFromImage(formData);
    if (result.success && result.rawText) {
      setRawText(result.rawText);
      toast({ variant: 'success', title: 'Text Extracted', description: 'Raw text is available for auto-fill.' });
    } else {
      toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error });
    }
    setIsExtractingText(false);
  };

  const handleAutoFill = async () => {
    if (!rawText) return;
    setIsScanning(true);
    const result = await handleExtractDonationDetails(rawText);
    if (result.success && result.details) {
        setExtractedDetails(result.details);
        Object.entries(result.details).forEach(([key, value]) => {
            if (value && key !== 'rawText') {
                setValue(key as any, value);
            }
        });
        toast({ variant: 'success', title: 'Auto-fill Complete', description: 'Please review all fields.' });
    } else {
        toast({ variant: 'destructive', title: 'Auto-fill Failed' });
    }
    setIsScanning(false);
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset();
        setFile(null);
        setPreviewUrl(null);
        setRawText(null);
        setExtractedDetails(null);
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
                <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                     <Select onValueChange={(v) => setValue('paymentMethod', v)} defaultValue={getValues('paymentMethod')}>
                        <SelectTrigger><SelectValue placeholder="Select a method"/></SelectTrigger>
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
                <div className="space-y-2">
                    <Label htmlFor="proof">Proof of Transfer</Label>
                    <Input id="proof" name="proof" type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
                    <FormDescription>A screenshot or PDF receipt is required for online payments.</FormDescription>
                </div>
                {previewUrl && <Image src={previewUrl} alt="Proof preview" width={200} height={400} className="object-contain mx-auto rounded-md" />}

                {file && (
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="w-full" onClick={handleGetText} disabled={isExtractingText}>
                            {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin"/> : <Text className="mr-2 h-4 w-4" />}
                            Get Text
                        </Button>
                        {rawText && (
                            <Button type="button" className="w-full" onClick={handleAutoFill} disabled={isScanning}>
                                {isScanning ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                                Auto-fill
                            </Button>
                        )}
                    </div>
                )}
                 {rawText && (
                    <div className="space-y-2">
                        <Label>Extracted Text</Label>
                        <Textarea value={rawText} readOnly rows={5} className="text-xs font-mono" />
                    </div>
                  )}

                <h3 className="font-semibold text-lg border-b pb-2 pt-4">Transaction Details</h3>
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
                
                 {extractedDetails?.googlePayTransactionId && <div className="space-y-2"><Label htmlFor="googlePayTransactionId">Google Pay Transaction ID</Label><Input id="googlePayTransactionId" {...register("googlePayTransactionId")} /></div>}
                 {extractedDetails?.utrNumber && <div className="space-y-2"><Label htmlFor="utrNumber">UTR Number</Label><Input id="utrNumber" {...register("utrNumber")} /></div>}
                 {extractedDetails?.phonePeTransactionId && <div className="space-y-2"><Label htmlFor="phonePeTransactionId">PhonePe Transaction ID</Label><Input id="phonePeTransactionId" {...register("phonePeTransactionId")} /></div>}
                 {extractedDetails?.paytmUpiReferenceNo && <div className="space-y-2"><Label htmlFor="paytmUpiReferenceNo">Paytm UPI Reference No.</Label><Input id="paytmUpiReferenceNo" {...register("paytmUpiReferenceNo")} /></div>}
            </div>

            {/* Right Column - Participant Details */}
            <div className="space-y-4">
                 <h3 className="font-semibold text-lg border-b pb-2">Participant Details</h3>
                 {extractedDetails?.senderName && <div className="space-y-2"><Label htmlFor="senderName">Sender Name</Label><Input id="senderName" {...register("senderName")} /></div>}
                 {extractedDetails?.googlePaySenderName && <div className="space-y-2"><Label htmlFor="googlePaySenderName">Google Pay Sender Name</Label><Input id="googlePaySenderName" {...register("googlePaySenderName")} /></div>}
                 {extractedDetails?.phonePeSenderName && <div className="space-y-2"><Label htmlFor="phonePeSenderName">PhonePe Sender Name</Label><Input id="phonePeSenderName" {...register("phonePeSenderName")} /></div>}
                 {extractedDetails?.paytmSenderName && <div className="space-y-2"><Label htmlFor="paytmSenderName">Paytm Sender Name</Label><Input id="paytmSenderName" {...register("paytmSenderName")} /></div>}
                 {extractedDetails?.senderUpiId && <div className="space-y-2"><Label htmlFor="senderUpiId">Sender UPI ID</Label><Input id="senderUpiId" {...register("senderUpiId")} /></div>}
                 {extractedDetails?.senderAccountNumber && <div className="space-y-2"><Label htmlFor="senderAccountNumber">Sender Account Number</Label><Input id="senderAccountNumber" {...register("senderAccountNumber")} /></div>}
                 {extractedDetails?.recipientName && <div className="space-y-2"><Label htmlFor="recipientName">Recipient Name</Label><Input id="recipientName" {...register("recipientName")} /></div>}
                 {extractedDetails?.googlePayRecipientName && <div className="space-y-2"><Label htmlFor="googlePayRecipientName">Google Pay Recipient Name</Label><Input id="googlePayRecipientName" {...register("googlePayRecipientName")} /></div>}
                 {extractedDetails?.phonePeRecipientName && <div className="space-y-2"><Label htmlFor="phonePeRecipientName">PhonePe Recipient Name</Label><Input id="phonePeRecipientName" {...register("phonePeRecipientName")} /></div>}
                 {extractedDetails?.paytmRecipientName && <div className="space-y-2"><Label htmlFor="paytmRecipientName">Paytm Recipient Name</Label><Input id="paytmRecipientName" {...register("paytmRecipientName")} /></div>}
                 {extractedDetails?.recipientAccountNumber && <div className="space-y-2"><Label htmlFor="recipientAccountNumber">Recipient Account Number</Label><Input id="recipientAccountNumber" {...register("recipientAccountNumber")} /></div>}
                 {extractedDetails?.recipientUpiId && <div className="space-y-2"><Label htmlFor="recipientUpiId">Recipient UPI ID</Label><Input id="recipientUpiId" {...register("recipientUpiId")} /></div>}
                 {extractedDetails?.recipientPhone && <div className="space-y-2"><Label htmlFor="recipientPhone">Recipient Phone</Label><Input id="recipientPhone" {...register("recipientPhone")} /></div>}

                 <h3 className="font-semibold text-lg border-b pb-2 pt-4">Additional Info</h3>
                 <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" {...register("notes")} placeholder="e.g., Bank transfer reference, payment details..." />
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
