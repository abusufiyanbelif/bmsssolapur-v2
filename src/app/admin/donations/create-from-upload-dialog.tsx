
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
import { useState, useRef, useEffect } from "react";
import { Loader2, Upload, ScanEye, Edit } from "lucide-react";
import { handleScanDonationProof } from "./actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUserByPhone, getUserByUpiId, getUserByUserId } from "@/services/user-service";

interface CreateFromUploadDialogProps {
  children: React.ReactNode;
}

// Helper to convert file to Base64 Data URL
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export function CreateFromUploadDialog({ children }: CreateFromUploadDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Clean up the object URL when the component unmounts or file changes
      return () => URL.revokeObjectURL(url);
    } else {
        setPreviewUrl(null);
    }
  }, [file]);

  const handleScanAndContinue = async () => {
    if (!file) {
        toast({ variant: 'destructive', title: 'No File', description: 'Please select a file to scan.' });
        return;
    }
    
    setIsScanning(true);

    const formData = new FormData();
    formData.append("paymentScreenshot", file);
    
    const result = await handleScanDonationProof(formData);
    
    setIsScanning(false);

    if (result.success && result.details) {
      toast({
        variant: "success",
        title: "Scan Successful",
        description: "Attempting to find donor and pre-fill form...",
      });
      
      const queryParams = new URLSearchParams();
      if(result.details.amount) queryParams.set('amount', result.details.amount.toString());
      if(result.details.transactionId) queryParams.set('transactionId', result.details.transactionId);
      if(result.details.notes) queryParams.set('notes', result.details.notes);
      if(result.details.date) queryParams.set('date', result.details.date);
      if(result.details.paymentApp) queryParams.set('paymentApp', result.details.paymentApp);
      
      // Pass all potential donor identifiers to the next page
      if(result.details.donorUpiId) queryParams.set('donorUpiId', result.details.donorUpiId);
      if(result.details.donorPhone) queryParams.set('donorPhone', result.details.donorPhone);
      if(result.details.donorName) queryParams.set('donorName', result.details.donorName);
      
      let userFound = false;
      let user = null;
      if (result.details.donorUpiId) user = await getUserByUpiId(result.details.donorUpiId);
      if (!user && result.details.donorPhone) user = await getUserByPhone(result.details.donorPhone);

      if(user) {
          queryParams.set('donorId', user.id!);
          userFound = true;
          toast({ title: "Donor Found!", description: `Found existing user: ${user.name}. Redirecting to donation form.` });
      }

      // Store screenshot in session to be picked up by the add form
      try {
        const dataUrl = await fileToDataUrl(file);
        sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({ dataUrl }));
        handleDialogClose();

        // **This is the updated logic**
        // If a user was found, go directly to the donation form.
        // Otherwise, go to the user creation form.
        const destination = userFound ? '/admin/donations/add' : '/admin/user-management/add';
        router.push(`${destination}?${queryParams.toString()}`);
      } catch (e) {
         toast({ variant: "destructive", title: "Error", description: "Could not prepare screenshot for the form." });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: result.error || "Could not extract details from the image.",
      });
    }
  };
  
  const handleManualEntry = async () => {
    if (file) {
        try {
            const dataUrl = await fileToDataUrl(file);
            // Store the image data in sessionStorage to be retrieved on the next page
            sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({
                dataUrl,
                name: file.name,
                type: file.type,
            }));
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not prepare the image for manual entry.",
            });
            return;
        }
    }
    handleDialogClose();
    router.push('/admin/donations/add');
  };
  
  const handleDialogClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            handleDialogClose(); // Reset state when dialog is closed
        }
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Donation from Screenshot</DialogTitle>
          <DialogDescription>
            Upload a payment screenshot. You can then choose to scan it with AI or enter the details manually.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="paymentScreenshot">Screenshot File</Label>
                <Input 
                    id="paymentScreenshot" 
                    name="paymentScreenshot" 
                    type="file" 
                    required 
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
            </div>
            {previewUrl && (
                <div className="p-2 border rounded-md bg-muted/50 flex justify-center">
                    <div className="relative w-full h-64">
                         <Image src={previewUrl} alt="Screenshot Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" />
                    </div>
                </div>
            )}
        </div>
        <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={handleManualEntry}>
                <Edit className="mr-2 h-4 w-4" />
                Enter Manually
            </Button>
            <Button type="button" onClick={handleScanAndContinue} disabled={isScanning || !file}>
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanEye className="mr-2 h-4 w-4" />}
                Scan and Continue
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
