
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
import { Loader2, Upload } from "lucide-react";
import { handleUploadDonationProof } from "./actions";
import type { Donation } from "@/services/types";
import { Progress } from "@/components/ui/progress"; // Import Progress component

interface UploadProofDialogProps {
  children: React.ReactNode;
  donation: Donation;
  onUploadSuccess: () => void;
}

export function UploadProofDialog({ children, donation, onUploadSuccess }: UploadProofDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) {
      const storedUserId = localStorage.getItem('userId');
      setAdminUserId(storedUserId);
      setUploadProgress(0); // Reset progress on open
    }
  }, [open]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminUserId) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Could not identify administrator. Please log out and back in.",
        });
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData(event.currentTarget);
    formData.append("adminUserId", adminUserId);
    
    // In a real-world scenario with direct client->server action for upload,
    // we would use a different approach. Here we simulate passing the onProgress callback.
    // The server action itself can't stream progress back to the client directly.
    // This requires a client-side upload function. For simplicity, we'll show progress
    // but the `handleUploadDonationProof` won't actually stream it back.
    // A more advanced solution would use client-side signed URLs or a dedicated upload component.
    const result = await handleUploadDonationProof(donation.id!, formData, setUploadProgress);

    setIsUploading(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Upload Successful",
        description: "The payment proof has been attached to the donation.",
      });
      onUploadSuccess();
      setOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: result.error || "An unknown error occurred.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Payment Proof</DialogTitle>
          <DialogDescription>
            Attach a screenshot or document for the donation from <span className="font-semibold">{donation.donorName}</span> for <span className="font-semibold">₹{donation.amount}</span>.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="paymentScreenshot">Screenshot File</Label>
                <Input id="paymentScreenshot" name="paymentScreenshot" type="file" required accept="image/*,application/pdf" disabled={isUploading} />
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <Label>Uploading...</Label>
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
              </div>
            )}

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isUploading}>
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? "Uploading..." : "Upload Proof"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
