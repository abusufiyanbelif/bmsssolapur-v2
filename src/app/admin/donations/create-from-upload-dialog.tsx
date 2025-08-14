

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Loader2, Upload, ScanEye, Edit, X, UserPlus, AlertTriangle } from "lucide-react";
import { handleScanDonationProof } from "./actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUserByPhone, getUserByUpiId, getUserByBankAccountNumber } from "@/services/user-service";
import type { User } from "@/services/types";

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
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [newUserParams, setNewUserParams] = useState<URLSearchParams | null>(null);
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

    if (result.success && result.details) {
      const queryParams = new URLSearchParams();
      if(result.details.amount) queryParams.set('amount', result.details.amount.toString());
      if(result.details.transactionId) queryParams.set('transactionId', result.details.transactionId);
      if(result.details.notes) queryParams.set('notes', result.details.notes);
      if(result.details.date) queryParams.set('date', result.details.date);
      if(result.details.paymentApp) queryParams.set('paymentApp', result.details.paymentApp);
      
      // Pass all potential identifiers to the next page
      if(result.details.donorUpiId) queryParams.set('donorUpiId', result.details.donorUpiId);
      if(result.details.donorPhone) queryParams.set('donorPhone', result.details.donorPhone);
      if(result.details.senderName) queryParams.set('donorName', result.details.senderName);
      if(result.details.senderAccountNumber) queryParams.set('bankAccountNumber', result.details.senderAccountNumber);
      
      // --- Enhanced User Matching Logic ---
      let user: User | null = null;
      
      // 1. Primary search with direct extracted fields
      if (result.details.donorUpiId) user = await getUserByUpiId(result.details.donorUpiId);
      if (!user && result.details.donorPhone) user = await getUserByPhone(result.details.donorPhone);
      if (!user && result.details.senderAccountNumber) user = await getUserByBankAccountNumber(result.details.senderAccountNumber);
      
      // 2. Secondary search: Cross-reference phone number and UPI ID
      if (!user && result.details.donorUpiId) {
          user = await getUserByPhone(result.details.donorUpiId);
      }
      if (!user && result.details.donorPhone) {
          user = await getUserByUpiId(result.details.donorPhone);
      }
      // --- End of Enhanced Logic ---

      if(user) {
          queryParams.set('donorId', user.id!);
          toast({ title: "Donor Found!", description: `Found existing user: ${user.name}. Redirecting to donation form.` });
           try {
                const dataUrl = await fileToDataUrl(file);
                sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({ dataUrl }));
                handleDialogClose();
                router.push(`/admin/donations/add?${queryParams.toString()}`);
            } catch (e) {
                toast({ variant: "destructive", title: "Error", description: "Could not prepare screenshot for the form." });
            }
      } else {
          setNewUserParams(queryParams);
          setShowCreateUserDialog(true);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: result.error || "Could not extract details from the image.",
      });
    }
     setIsScanning(false);
  };
  
  const proceedToCreateUser = async () => {
    if (!newUserParams || !file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      sessionStorage.setItem('manualDonationScreenshot', JSON.stringify({ dataUrl }));
      handleDialogClose();
      router.push(`/admin/user-management/add?${newUserParams.toString()}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not prepare screenshot for the form." });
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
    setNewUserParams(null);
    setShowCreateUserDialog(false);
    setOpen(false);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            handleDialogClose(); // Reset state when dialog is closed
        }
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
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
        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-4">
              <Button type="button" variant="secondary" onClick={handleManualEntry}>
                <Edit className="mr-2 h-4 w-4" />
                Enter Manually
              </Button>
            <div className="flex gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="button" onClick={handleScanAndContinue} disabled={isScanning || !file}>
                    {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanEye className="mr-2 h-4 w-4" />}
                    Scan and Continue
                </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" />
                    No Matching Donor Found
                </AlertDialogTitle>
                <AlertDialogDescription>
                    The system could not find an existing donor matching the details from the screenshot. Would you like to create a new user profile?
                </AlertDialogDescription>
            </AlertDialogHeader>
             <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowCreateUserDialog(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={proceedToCreateUser}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create New User
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
