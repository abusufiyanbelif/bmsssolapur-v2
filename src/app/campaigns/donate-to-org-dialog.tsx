
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
import { CreditCard, Smartphone } from "lucide-react";
import type { Organization, User } from "@/services/types";
import { useIsMobile } from "@/hooks/use-mobile";

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

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Secure Donation</DialogTitle>
          <DialogDescription>
            Your contribution will support the organization's mission. Enter an amount below.
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
             <Button asChild className="w-full" size="lg" disabled={amount <= 0}>
                <a href={isMobile ? upiLink : '#'} onClick={(e) => {
                    if (!isMobile) {
                        e.preventDefault();
                        alert("Please scan the QR code from the organization page on your mobile to pay via UPI.");
                    }
                }}>
                    <Smartphone className="mr-2 h-4 w-4" /> Pay with UPI App
                </a>
            </Button>
        </div>
         <DialogFooter>
             <p className="text-xs text-muted-foreground text-center w-full mt-2 sm:mt-0">On mobile, this will open your UPI app. On desktop, please use the QR code from the organization page.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
