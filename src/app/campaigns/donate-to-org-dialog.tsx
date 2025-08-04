
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Organization } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DonateToOrgDialogProps {
  children: React.ReactNode;
  organization: Organization | null;
}

export function DonateToOrgDialog({ children, organization }: DonateToOrgDialogProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(2500);
  const [tipPercentage, setTipPercentage] = useState(10);
  const { toast } = useToast();

  if (!organization) return <>{children}</>;

  const tipAmount = Math.round(amount * (tipPercentage / 100));
  const totalAmount = amount + tipAmount;
  
  const handleCopyToClipboard = () => {
    if(organization?.upiId) {
        navigator.clipboard.writeText(organization.upiId);
        toast({
            title: "Copied!",
            description: "UPI ID has been copied to your clipboard.",
        });
    }
  }

  return (
    <Dialog onOpenChange={(open) => !open && setStep(1)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a secure donation</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Your contribution will support the organization's mission and future cases."
              : "Complete your payment using your preferred UPI app."
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input id="currency" value="₹ INR" disabled className="font-semibold" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="font-semibold"
                        />
                    </div>
                 </div>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                    Our organization relies on donors like you to cover our expenses. Kindly consider a tip to support our operations. Thank you 🙏
                </p>
                <div className="flex items-center gap-4 mt-4">
                    <Label htmlFor="tip" className="flex-shrink-0">Include a tip of</Label>
                    <Select
                        value={String(tipPercentage)}
                        onValueChange={(val) => setTipPercentage(Number(val))}
                    >
                        <SelectTrigger id="tip">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5% (₹{Math.round(amount * 0.05)})</SelectItem>
                            <SelectItem value="10">10% (₹{Math.round(amount * 0.10)})</SelectItem>
                            <SelectItem value="15">15% (₹{Math.round(amount * 0.15)})</SelectItem>
                            <SelectItem value="0">Other Amount</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep(2)} className="w-full" size="lg">
                Continue to pay ₹{totalAmount.toLocaleString()}
              </Button>
            </DialogFooter>
          </>
        ) : (
           <>
            <div className="space-y-4 py-4">
                <div className="text-center">
                    <p className="text-muted-foreground">Please complete your payment of</p>
                    <p className="text-3xl font-bold">₹{totalAmount.toLocaleString()}</p>
                </div>

                <div className="p-4 rounded-lg border space-y-4">
                    <h4 className="font-semibold flex items-center gap-2"><CreditCard /> Pay using any UPI app</h4>
                    <div className="flex items-center justify-center p-2 border rounded-md bg-background">
                       {organization.qrCodeUrl && (
                         <Image src={organization.qrCodeUrl} alt="UPI QR Code" width={160} height={160} data-ai-hint="qr code" />
                       )}
                    </div>
                     <div className="relative">
                        <p className="font-mono text-center text-sm bg-background px-2 absolute -top-3 left-1/2 -translate-x-1/2 text-muted-foreground">OR</p>
                        <div className="border-t"></div>
                     </div>

                    <div className="space-y-2">
                        <Label>Pay to this UPI ID</Label>
                        <div className="flex gap-2">
                             <Input value={organization.upiId} readOnly />
                             <Button variant="secondary" onClick={handleCopyToClipboard}><Copy className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
                 <Alert>
                    <AlertTitle>Important Note</AlertTitle>
                    <AlertDescription>
                        After completing the payment, an admin will manually verify and record your donation in the system. Thank you for your generosity!
                    </AlertDescription>
                </Alert>
            </div>
            <DialogFooter>
                <Button onClick={() => setStep(1)} variant="outline">
                    Back
                </Button>
            </DialogFooter>
           </>
        )}
      </DialogContent>
    </Dialog>
  );
}
