

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
import { Loader2, FileUp, ScanEye } from "lucide-react";
import { handleFundTransfer, handleScanTransferProof } from "./actions";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ExtractDonationDetailsOutput } from "@/ai/schemas";

interface AddTransferDialogProps {
  leadId: string;
}

export function AddTransferDialog({ leadId }: AddTransferDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [open, setOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [scannedDetails, setScannedDetails] = useState<ExtractDonationDetailsOutput | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
      const storedUserId = localStorage.getItem('userId');
      if(storedUserId) {
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
        toast({ variant: 'success', title: 'Scan Successful', description: 'Fields have been auto-filled.' });
    } else {
        toast({ variant: 'destructive', title: 'Scan Failed', description: result.error || 'Could not extract details from the image.' });
    }
    setIsScanning(false);
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminUserId) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Could not identify the logged-in administrator. Please log out and back in.",
        });
        return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.append("adminUserId", adminUserId);
    const result = await handleFundTransfer(leadId, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Transfer Recorded",
        description: "The fund transfer has been successfully recorded for this lead.",
      });
      setOpen(false);
      setScannedDetails(null);
      setFile(null);
      if(formRef.current) formRef.current.reset();
      router.refresh(); // Refresh the page to show the new transfer
    } else {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: result.error || "An unknown error occurred.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if(!isOpen) {
        setScannedDetails(null);
        setFile(null);
      }
      setOpen(isOpen)
    }}>
      <DialogTrigger asChild>
        <Button variant="default">
            <FileUp className="mr-2 h-4 w-4" />
            Add Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Fund Transfer</DialogTitle>
          <DialogDescription>
            Fill out the details below to record a payment made to the beneficiary for this case. You can scan the proof to auto-fill details.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="amount">Amount Transferred (₹)</Label>
                  <Input id="amount" name="amount" type="number" required placeholder="e.g., 5000" defaultValue={scannedDetails?.amount} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="paymentApp">Payment App</Label>
                  <Input id="paymentApp" name="paymentApp" type="text" placeholder="e.g., PhonePe" defaultValue={scannedDetails?.paymentApp}/>
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID / UTR</Label>
                <Input id="transactionId" name="transactionId" type="text" required placeholder="Enter transaction reference" defaultValue={scannedDetails?.transactionId} />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input id="recipientName" name="recipientName" type="text" placeholder="As per bank records" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Recipient Phone</Label>
                  <Input id="recipientPhone" name="recipientPhone" type="tel" placeholder="10-digit number" />
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="senderAccountNumber">Sender Bank Account</Label>
                <Input id="senderAccountNumber" name="senderAccountNumber" type="text" placeholder="e.g., XXXXXX1234" defaultValue={scannedDetails?.bankAccountNumber} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="e.g., Bank transfer reference, payment details..." defaultValue={scannedDetails?.notes} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="proof">Proof of Transfer</Label>
                <div className="flex gap-2">
                    <Input id="proof" name="proof" type="file" required accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <Button type="button" variant="outline" size="icon" onClick={handleScan} disabled={!file || isScanning}>
                        {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanEye className="h-4 w-4" />}
                    </Button>
                </div>
                 <p className="text-xs text-muted-foreground">A screenshot or PDF receipt of the transaction is required.</p>
            </div>
            
            {isScanning && <div className="text-sm text-muted-foreground flex items-center justify-center py-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning image...</div>}

            {scannedDetails && (
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Scanned Details Preview</AlertTitle>
                    <AlertDescription className="mt-2 text-xs space-y-1">
                        <p>The form has been populated with the scanned data. Please verify the details below and fill in any missing fields like the recipient's name and phone number.</p>
                    </AlertDescription>
                </Alert>
            )}

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
        </form>
      </DialogContent>
    </Dialog>
  );
}
