
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

interface ScanDonationDialogProps {
  onScanComplete: (details: ExtractDonationDetailsOutput, dataUrl: string) => void;
}

export function ScanDonationDialog({ onScanComplete }: ScanDonationDialogProps) {
  const { toast } = useToast();
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
        toast({ variant: 'success', title: 'Scan Successful!', description: 'The form has been pre-filled with the scanned data.' });
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const detailsToStore = {
                ...result.details,
                rawText: undefined 
            };
            onScanComplete(detailsToStore, dataUrl);
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
            Upload a payment proof image. The system will attempt to extract the details and pre-fill the form for you.
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
            Scan and Fill Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
