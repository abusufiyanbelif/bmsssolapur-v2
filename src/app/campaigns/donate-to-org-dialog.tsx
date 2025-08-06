
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
import { Smartphone, QrCode } from "lucide-react";
import type { Organization, User } from "@/services/types";
import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";

interface DonateToOrgDialogProps {
  children: React.ReactNode;
  organization: Organization | null;
  user: User | null;
}

export function DonateToOrgDialog({ children, organization, user }: DonateToOrgDialogProps) {
  const isMobile = useIsMobile();
  const [amount, setAmount] = useState(100); // Default amount

  if (!organization || !organization.upiId) return <>{children}</>;

  const upiLink = `upi://pay?pa=${organization.upiId}&pn=${encodeURIComponent(organization.name)}&am=${amount}&cu=INR&tn=Donation`;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setAmount(100);
    }
  }

  const handleUpiPay = () => {
    window.location.href = upiLink;
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Secure Donation</DialogTitle>
          <DialogDescription>
            Your contribution will support the organization's mission. Enter an amount and choose a payment method.
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
            {organization.qrCodeUrl && (
                <div className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg bg-muted/50">
                     <div className="relative w-40 h-40">
                        <Image src={organization.qrCodeUrl} alt="UPI QR Code" fill className="object-contain rounded-md" data-ai-hint="qr code" />
                    </div>
                     <p className="text-sm font-bold">{organization.upiId}</p>
                     <p className="text-xs text-muted-foreground text-center">
                        Scan with any UPI App to pay.
                    </p>
                </div>
            )}
             {isMobile && (
                <Button onClick={handleUpiPay} className="w-full" size="lg" disabled={amount <= 0}>
                    <Smartphone className="mr-2 h-4 w-4" /> Pay with UPI App
                </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
