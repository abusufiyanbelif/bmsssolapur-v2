
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
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, FileUp, ScanEye, AlertTriangle, FileText, TextSelect } from "lucide-react";
import { handleFundTransfer, handleScanTransferProof, handleGetRawText } from "./actions";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { ExtractDonationDetailsOutput } from "@/ai/schemas";
import Image from "next/image";

interface AddTransferDialogProps {
  leadId: string;
}

export function AddTransferDialog({ leadId }: AddTransferDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [open, setOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [scannedDetails, setScannedDetails] = useState<ExtractDonationDetailsOutput | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const form = useForm();
  const { setValue, register, handleSubmit } = form;

  useEffect(() => {
    if (scannedDetails) {
        // Use Object.entries to iterate and set values
        for (const [key, value] of Object.entries(scannedDetails)) {
            if (value !== undefined && value !== null) {
                setValue(key, value);
            }
        }
    }
  }, [scannedDetails, setValue]);


  useEffect(() => {
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      return () => {
        if(previewUrl) URL.revokeObjectURL(previewUrl);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setAdminUserId(storedUserId);
    }
  }, [open]);

  const handleScan = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please select a file to scan.' });
      return;
    }
    
    setIsScanning(true);
    setScannedDetails(null);
    const formData = new FormData();
    formData.append("proof", file);
    
    const result = await handleScanTransferProof(formData);
    
    if (result.success && result.details) {
        setScannedDetails(result.details);
        toast({ variant: 'success', title: 'Scan Successful', description: 'Form fields have been auto-filled. Please review.' });
    } else {
        toast({ variant: 'destructive', title: 'Scan Failed', description: result.error || 'Could not extract details from the image.' });
    }
    setIsScanning(false);
  };
  
   const handleExtractText = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please select a file to extract text from.' });
      return;
    }
    
    setIsExtractingText(true);
    setRawText(null);
    const formData = new FormData();
    formData.append("proof", file);
    
    const result = await handleGetRawText(formData);
    
    if (result.success && result.text) {
        setRawText(result.text);
        toast({ variant: 'success', title: 'Text Extracted', description: 'Raw text is available for review.' });
    } else {
        toast({ variant: 'destructive', title: 'Text Extraction Failed', description: result.error || 'Could not extract text from the image.' });
    }
    setIsExtractingText(false);
  };
  
  const onFormSubmit = async (data: any) => {
    if (!adminUserId) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Could not identify the logged-in administrator. Please log out and back in." });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    for (const key in data) {
        if (data[key]) {
            formData.append(key, data[key]);
        }
    }
    formData.append("adminUserId", adminUserId);
    if(file) formData.append("proof", file);

    const result = await handleFundTransfer(leadId, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({ variant: "success", title: "Transfer Recorded", description: "The fund transfer has been successfully recorded." });
      setOpen(false);
      setScannedDetails(null);
      setFile(null);
      setPreviewUrl(null);
      setRawText(null);
      form.reset();
      router.refresh(); 
    } else {
      toast({ variant: "destructive", title: "Submission Failed", description: result.error || "An unknown error occurred." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setScannedDetails(null);
        setFile(null);
        setPreviewUrl(null);
        setRawText(null);
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
            Fill out the details below to record a payment. Scan the proof to auto-fill details.
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
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input id="transactionId" {...register("transactionId")} type="text" placeholder="Enter transaction reference" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="utrNumber">UTR Number</Label>
                    <Input id="utrNumber" {...register("utrNumber")} type="text" placeholder="Enter UTR number" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="paymentApp">Payment App</Label>
                        <Input id="paymentApp" {...register("paymentApp")} type="text" placeholder="e.g., PhonePe" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Input id="paymentMethod" {...register("paymentMethod")} type="text" placeholder="e.g., UPI" />
                    </div>
                </div>

                <h3 className="font-semibold text-lg border-b pb-2 pt-4">Participant Details</h3>
                <div className="space-y-2">
                    <Label htmlFor="senderName">Sender Name</Label>
                    <Input id="senderName" {...register("senderName")} type="text" placeholder="As per bank records" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="senderAccountNumber">Sender Account Number</Label>
                    <Input id="senderAccountNumber" {...register("senderAccountNumber")} type="text" placeholder="e.g., XXXXXX1234" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input id="recipientName" {...register("recipientName")} type="text" placeholder="As per bank records" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="recipientAccountNumber">Recipient Account Number</Label>
                    <Input id="recipientAccountNumber" {...register("recipientAccountNumber")} type="text" placeholder="e.g., XXXXXX5678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="recipientUpiId">Recipient UPI ID</Label>
                    <Input id="recipientUpiId" {...register("recipientUpiId")} type="text" placeholder="e.g., username@upi" />
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
                        <Input id="proof" type="file" required accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        <Button type="button" variant="outline" size="icon" onClick={handleScan} disabled={!file || isScanning}>
                            {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanEye className="h-4 w-4" />}
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={handleExtractText} disabled={!file || isExtractingText}>
                            {isExtractingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <TextSelect className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">A screenshot or PDF receipt of the transaction is required.</p>
                </div>
                 {previewUrl ? (
                    <div className="p-2 border rounded-md bg-muted/50 flex flex-col items-center gap-4">
                        <div className="relative w-full h-64">
                            <Image src={previewUrl} alt="Screenshot Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" />
                        </div>
                    </div>
                ) : (
                     <div className="p-2 border rounded-md bg-muted/50 flex flex-col items-center justify-center gap-4 h-64">
                        <FileText className="h-16 w-16 text-muted-foreground"/>
                        <p className="text-sm text-muted-foreground">Upload an image to see a preview</p>
                    </div>
                )}
                {isScanning && <div className="text-sm text-muted-foreground flex items-center justify-center py-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning image...</div>}
                {scannedDetails && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Review Auto-Filled Details</AlertTitle>
                        <AlertDescription>The form has been populated with scanned data. Please verify all details before submitting.</AlertDescription>
                    </Alert>
                )}
                 {rawText && (
                    <div className="space-y-2">
                        <Label htmlFor="rawTextOutput">Extracted Text</Label>
                        <Textarea id="rawTextOutput" readOnly value={rawText} rows={8} className="text-xs font-mono" />
                    </div>
                )}
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
