
"use client";

import { useState, useRef } from "react";
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
import { Loader2, ScanEye, FileText } from "lucide-react";
import { scanProof } from './add/actions';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import type { ExtractDonationDetailsOutput } from '@/ai/schemas';

export function ScanDonationDialog() {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const handleScan = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select a payment screenshot to scan.' });
      return;
    }
    
    setIsScanning(true);
    const formData = new FormData();
    formData.append("proofFile", file);

    const result = await scanProof(formData);

    setIsScanning(false);
    
    if (result.success && result.details) {
        toast({ variant: 'success', title: 'Scan Successful!', description: 'Redirecting to pre-filled form...' });
        
        // Store screenshot data in session storage to pass to the next page
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const detailsToStore = {
                ...result.details,
                // We only need the data URL, not the full raw text for this purpose.
                rawText: undefined 
            };
            const sessionData = {
                details: detailsToStore,
                dataUrl: dataUrl
            };
            sessionStorage.setItem('manualDonationScreenshot', JSON.stringify(sessionData));

            // Build query params from the *other* details
            const queryParams = new URLSearchParams();
            Object.entries(detailsToStore).forEach(([key, value]) => {
                if (value !== undefined && value !== null && typeof value !== 'object') {
                    queryParams.set(key, String(value));
                }
            });

            if (result.donorFound) {
                router.push(`/admin/donations/add?${queryParams.toString()}`);
            } else {
                 // Pass relevant info to create a new user
                const userParams = new URLSearchParams();
                if(result.details.senderName) userParams.set('name', result.details.senderName);
                if(result.details.donorPhone) userParams.set('phone', result.details.donorPhone);
                if(result.details.senderUpiId) userParams.set('upiId', result.details.senderUpiId);
                // Add a redirect URL so we land on the donation page after user creation
                userParams.set('redirect_url', `/admin/donations/add?${queryParams.toString()}`);
                
                router.push(`/admin/user-management/add?${userParams.toString()}`);
            }
            
             setOpen(false); // Close the dialog
        };
        reader.readAsDataURL(file);

    } else {
         toast({ variant: 'destructive', title: 'Scan Failed', description: result.error || "Could not extract details from the image." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) { // Reset state on close
             setFile(null);
             setPreviewUrl(null);
             setIsScanning(false);
        }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ScanEye className="mr-2" />
          Scan Screenshot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Payment Screenshot</DialogTitle>
          <DialogDescription>
            Upload a payment proof image. The system will attempt to extract the details and pre-fill the donation form for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="paymentScreenshot">Screenshot File</Label>
                <Input
                    id="paymentScreenshot"
                    name="proofFile"
                    type="file"
                    required
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </div>
             {previewUrl ? (
                <div className="p-2 border rounded-md bg-muted/50 flex flex-col items-center gap-4">
                    <div className="relative w-full h-80">
                        <Image src={previewUrl} alt="Screenshot Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot"/>
                    </div>
                </div>
            ) : (
                    <div className="p-2 border-dashed border-2 rounded-md bg-muted/50 flex flex-col items-center justify-center gap-4 h-80">
                    <FileText className="h-16 w-16 text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">Upload an image to see a preview</p>
                </div>
            )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isScanning}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleScan} disabled={isScanning || !file}>
            {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanEye className="mr-2 h-4 w-4" />}
            Scan and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

