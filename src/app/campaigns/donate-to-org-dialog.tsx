
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
import { CreditCard, Loader2, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization, User } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

interface DonateToOrgDialogProps {
  children: React.ReactNode;
  organization: Organization | null;
  user: User | null;
}

export function DonateToOrgDialog({ children, organization, user }: DonateToOrgDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(100); // Default amount
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState<'details' | 'qr'>('details');

  if (!organization) return <>{children}</>;
  
  const upiLink = `upi://pay?pa=${organization.upiId}&pn=${encodeURIComponent(organization.name)}&cu=INR&am=${amount}`;
  
  const handleProceedToPay = () => {
      if (amount <= 0) {
          toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter an amount greater than zero.'});
          return;
      }
      setPaymentStep('qr');
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        // Reset state when dialog is closed
        setTimeout(() => setPaymentStep('details'), 200);
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
        
        {paymentStep === 'details' && (
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
                 <Button onClick={handleProceedToPay} className="w-full" size="lg" disabled={isSubmitting || amount <= 0}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Proceed to Pay
                </Button>
            </div>
        )}

        {paymentStep === 'qr' && (
             <div className="space-y-4 py-4">
                <p className="text-sm font-semibold text-center text-muted-foreground">Scan the QR code with any UPI app</p>
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 border rounded-lg bg-background">
                        <div className="relative w-48 h-48">
                                <Image src={organization.qrCodeUrl || 'https://placehold.co/400x400.png'} alt="UPI QR Code" fill className="object-contain rounded-md" data-ai-hint="qr code" />
                        </div>
                    </div>
                     <p className="font-bold text-lg">Amount: ₹{amount}</p>
                     <p className="text-center text-sm font-bold">{organization.upiId}</p>
                </div>
                 <Button onClick={() => setPaymentStep('details')} variant="outline" className="w-full">
                    Back
                 </Button>
            </div>
        )}

        <DialogFooter>
          <p className="text-xs text-muted-foreground text-center w-full">This is a test environment. No real money will be charged.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
