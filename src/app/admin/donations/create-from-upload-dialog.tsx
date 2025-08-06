
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
import { handleCreateDonationFromUpload } from "./actions";
import type { User } from "@/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface CreateFromUploadDialogProps {
  children: React.ReactNode;
  donors: User[];
  onUploadSuccess: () => void;
}

export function CreateFromUploadDialog({ children, donors, onUploadSuccess }: CreateFromUploadDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<string>('');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
  }, []);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminUserId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not identify admin.' });
        return;
    }
    setIsUploading(true);

    const formData = new FormData(event.currentTarget);
    formData.append('donorId', selectedDonor);

    const result = await handleCreateDonationFromUpload(formData, adminUserId);

    setIsUploading(false);

    if (result.success && result.donationId) {
      toast({
        variant: "success",
        title: "Donation Created",
        description: "New donation record created. Please review and edit the details.",
      });
      onUploadSuccess();
      setOpen(false);
      // Redirect to the edit page for the newly created donation
      router.push(`/admin/donations/${result.donationId}/edit`);
    } else {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: result.error || "An unknown error occurred.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Donation from Screenshot</DialogTitle>
          <DialogDescription>
            Select a donor and upload their payment screenshot. A new donation record will be created with status "Pending verification".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="donorSelect">Select Donor</Label>
                <Select onValueChange={setSelectedDonor} value={selectedDonor}>
                    <SelectTrigger id="donorSelect">
                        <SelectValue placeholder="Select a donor..." />
                    </SelectTrigger>
                    <SelectContent>
                        {donors.map(donor => (
                            <SelectItem key={donor.id} value={donor.id!}>{donor.name} ({donor.phone})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="paymentScreenshot">Screenshot File</Label>
                <Input id="paymentScreenshot" name="paymentScreenshot" type="file" required accept="image/*,application/pdf" />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isUploading}>
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isUploading || !selectedDonor}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload and Create
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
