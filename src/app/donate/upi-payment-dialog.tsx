
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogProps,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/services/types";
import { PayNowFormValues } from "./page";
import { handleCreatePendingDonation } from "./actions";
import { GooglePayLogo, PhonePeLogo, PaytmLogo } from "@/components/logo";
import { Loader2 } from "lucide-react";

interface UpiPaymentDialogProps extends DialogProps {
  donationDetails: PayNowFormValues;
  user: User;
}

export function UpiPaymentDialog({ open, onOpenChange, donationDetails, user }: UpiPaymentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initiatePayment = async (gateway: 'phonepe' | 'gpay' | 'paytm') => {
      setIsSubmitting(true);
      try {
        const donationData = { ...donationDetails, userId: user.id };
        const result = await handleCreatePendingDonation(donationData);

        if (result.success && result.redirectUrl) {
            toast({
                title: "Redirecting to Payment...",
                description: "Please complete your donation on the secure payment page.",
                variant: 'success'
            });
            window.location.href = result.redirectUrl;
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to initiate donation.' });
        }
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Your UPI App</DialogTitle>
          <DialogDescription>
            Choose your preferred application to complete the payment of <span className="font-bold">₹{donationDetails.amount.toLocaleString()}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Button
                variant="outline"
                className="h-16 justify-start text-lg gap-4 px-4"
                onClick={() => initiatePayment('phonepe')}
                disabled={isSubmitting}
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <PhonePeLogo className="h-full w-auto" />}
                PhonePe
            </Button>
            <Button
                variant="outline"
                className="h-16 justify-start text-lg gap-4 px-4"
                onClick={() => initiatePayment('gpay')}
                disabled={isSubmitting}
            >
                 {isSubmitting ? <Loader2 className="animate-spin" /> : <GooglePayLogo className="h-full w-auto" />}
                Google Pay
            </Button>
             <Button
                variant="outline"
                className="h-16 justify-start text-lg gap-4 px-4"
                onClick={() => initiatePayment('paytm')}
                disabled={isSubmitting}
            >
                 {isSubmitting ? <Loader2 className="animate-spin" /> : <PaytmLogo className="h-full w-auto" />}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
