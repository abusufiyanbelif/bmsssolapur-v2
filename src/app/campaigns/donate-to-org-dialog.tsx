
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization, User } from "@/services/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { startPhonePePayment } from "./phonepe-actions";

interface DonateToOrgDialogProps {
  children: React.ReactNode;
  organization: Organization | null;
  user: User | null;
}

export function DonateToOrgDialog({ children, organization, user }: DonateToOrgDialogProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(100); // Default amount

  if (!organization) return <>{children}</>;
  
  const handlePayment = async () => {
      if (amount <= 0) {
          toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter an amount greater than zero.'});
          return;
      }
      setIsSubmitting(true);
      
      try {
        const result = await startPhonePePayment({
            amount: amount,
            userId: user?.id || 'GUEST_USER',
            userName: user?.name || 'Anonymous Donor',
            userPhone: user?.phone,
        });

        if (result.success && result.redirectUrl) {
            toast({ variant: 'success', title: 'Redirecting to PhonePe...', description: 'Please complete your payment.' });
            // This will redirect the user to the PhonePe payment page
            window.location.href = result.redirectUrl;
        } else {
            throw new Error(result.error || 'Failed to initiate payment.');
        }

      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          toast({
              variant: 'destructive',
              title: 'Payment Initiation Failed',
              description: errorMessage,
          });
      } finally {
          setIsSubmitting(false);
      }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        // Reset state when dialog is closed
        setAmount(100);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Secure Donation</DialogTitle>
          <DialogDescription>
            Your contribution will support the organization's mission.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="font-semibold text-lg"
                    min="1"
                />
            </div>
             <Button onClick={handlePayment} className="w-full" size="lg" disabled={isSubmitting || amount <= 0}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Proceed to Pay
            </Button>
        </div>
         <DialogFooter>
             <p className="text-xs text-muted-foreground text-center w-full mt-2 sm:mt-0">This is a test environment that simulates a redirect to the PhonePe payment page.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
