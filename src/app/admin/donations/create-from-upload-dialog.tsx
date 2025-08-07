
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
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Upload, ScanEye } from "lucide-react";
import { handleScanDonationProof } from "./actions";
import type { User } from "@/services/types";
import { useRouter } from "next/navigation";
import { stringify } from "querystring";

interface CreateFromUploadDialogProps {
  children: React.ReactNode;
}

export function CreateFromUploadDialog({ children }: CreateFromUploadDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [open, setOpen] = useState(false);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsScanning(true);

    const formData = new FormData(event.currentTarget);
    const result = await handleScanDonationProof(formData);
    setIsScanning(false);

    if (result.success && result.details) {
      toast({
        variant: "success",
        title: "Scan Successful",
        description: "Redirecting to donation form with pre-filled details.",
      });
      setOpen(false);

      const queryParams = new URLSearchParams();
      if(result.details.amount) queryParams.set('amount', result.details.amount.toString());
      if(result.details.transactionId) queryParams.set('transactionId', result.details.transactionId);
      if(result.details.donorIdentifier) queryParams.set('donorIdentifier', result.details.donorIdentifier);
      if(result.details.notes) queryParams.set('notes', result.details.notes);
      
      router.push(`/admin/donations/add?${queryParams.toString()}`);

    } else {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: result.error || "Could not extract details from the image.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Donation Screenshot</DialogTitle>
          <DialogDescription>
            Upload a payment screenshot. The AI will attempt to extract the details and pre-fill the donation form for your review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="paymentScreenshot">Screenshot File</Label>
                <Input id="paymentScreenshot" name="paymentScreenshot" type="file" required accept="image/*,application/pdf" />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isScanning}>
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isScanning}>
                    {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanEye className="mr-2 h-4 w-4" />}
                    Scan and Continue
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
