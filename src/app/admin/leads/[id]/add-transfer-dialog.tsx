
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
import { Loader2, FileUp } from "lucide-react";
import { handleFundTransfer } from "./actions";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
      const storedUserId = localStorage.getItem('userId');
      if(storedUserId) {
        setAdminUserId(storedUserId);
      }
  }, [open]);
  
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
            <FileUp className="mr-2 h-4 w-4" />
            Add Transfer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Fund Transfer</DialogTitle>
          <DialogDescription>
            Fill out the details below to record a payment made to the beneficiary for this case.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Amount Transferred (₹)</Label>
                <Input id="amount" name="amount" type="number" required placeholder="e.g., 5000" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" name="notes" placeholder="e.g., Bank transfer reference, payment details..." />
            </div>
            <div className="space-y-2">
                <Label htmlFor="proof">Proof of Transfer</Label>
                <Input id="proof" name="proof" type="file" required accept="image/*,application/pdf" />
                 <p className="text-xs text-muted-foreground">A screenshot or PDF receipt of the transaction is required.</p>
            </div>
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
