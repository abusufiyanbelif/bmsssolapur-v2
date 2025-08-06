
"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, CreditCard, ExternalLink, X, AlertTriangle, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Organization, User } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";

interface DonateToOrgDialogProps {
  children: React.ReactNode;
  organization: Organization | null;
  user: User | null;
}

export function DonateToOrgDialog({ children, organization, user }: DonateToOrgDialogProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(2500);
  const [tipPercentage, setTipPercentage] = useState(10);
  const [customTipAmount, setCustomTipAmount] = useState(0);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  if (!organization) return <>{children}</>;

  const calculatedTip = tipPercentage > 0 ? Math.round(amount * (tipPercentage / 100)) : customTipAmount;
  const totalAmount = amount + calculatedTip;
  
  const handleCopyToClipboard = (textToCopy: string, entity: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({
        title: "Copied!",
        description: `${entity} has been copied to your clipboard.`,
    });
  }

  const transactionNote = `Baitul Mal Samajik Sanstha - General fund. User: ${user?.id || 'N/A'}`;
  const upiLink = `upi://pay?pa=${organization.upiId}&pn=${encodeURIComponent(organization.name)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  
  const maazPhoneNumber = "9372145889";
  const maazUpiId = `${maazPhoneNumber}@paytm`;
  const phoneUpiLink = `upi://pay?pa=${maazUpiId}&pn=Maaz%20Shaikh&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;


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
                        onValueChange={(val) => {
                            const newTipPercentage = Number(val);
                            setTipPercentage(newTipPercentage);
                            if (newTipPercentage > 0) {
                                setCustomTipAmount(0); // Reset custom amount if a percentage is chosen
                            }
                        }}
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
                 {tipPercentage === 0 && (
                    <div className="mt-4 space-y-2">
                        <Label htmlFor="custom-tip">Custom Tip Amount</Label>
                        <Input
                            id="custom-tip"
                            type="number"
                            value={customTipAmount}
                            onChange={(e) => setCustomTipAmount(Number(e.target.value))}
                            placeholder="Enter custom tip amount"
                        />
                    </div>
                 )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep(2)} className="w-full" size="lg" disabled={totalAmount <= 0}>
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
                    
                    {isMobile && (
                         <Button asChild className="w-full" size="lg">
                            <Link href={upiLink}>
                                Pay with UPI App <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}

                    <Link href={upiLink} className="block cursor-pointer">
                        <div className="flex items-center justify-center p-2 border rounded-md bg-background hover:bg-muted transition-colors">
                        {organization.qrCodeUrl && (
                            <Image src={organization.qrCodeUrl} alt="UPI QR Code" width={160} height={160} data-ai-hint="qr code" />
                        )}
                        </div>
                    </Link>

                     <div className="relative">
                        <p className="font-mono text-center text-sm bg-background px-2 absolute -top-3 left-1/2 -translate-x-1/2 text-muted-foreground">OR</p>
                        <div className="border-t"></div>
                     </div>

                    <div className="space-y-2">
                        <Label>Pay to this UPI ID</Label>
                        <div className="flex gap-2">
                             <Input value={organization.upiId} readOnly />
                             <Button variant="secondary" onClick={() => handleCopyToClipboard(organization.upiId, 'UPI ID')}><Copy className="h-4 w-4" /></Button>
                        </div>
                    </div>
                     <div className="relative">
                        <p className="font-mono text-center text-sm bg-background px-2 absolute -top-3 left-1/2 -translate-x-1/2 text-muted-foreground">OR</p>
                        <div className="border-t"></div>
                     </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Pay via Phone Number</Label>
                         {isMobile ? (
                             <Button asChild className="w-full" size="sm" variant="outline">
                                <Link href={phoneUpiLink}>
                                    Pay Maaz Shaikh ({maazPhoneNumber}) via UPI
                                </Link>
                            </Button>
                        ) : (
                             <div className="flex gap-2">
                                 <Input value={maazPhoneNumber} readOnly />
                                 <Button variant="secondary" onClick={() => handleCopyToClipboard(maazPhoneNumber, 'Phone Number')}><Copy className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </div>
                </div>
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important: Manual Verification Required</AlertTitle>
                    <AlertDescription>
                        After completing the payment in your UPI app, you must **manually return** to this application. Your donation will be marked as "Pending" until an administrator verifies the transaction.
                         <span className="block mt-2 font-semibold">If you see a "risk" warning in your UPI app, please try paying by scanning the QR code or manually entering the UPI ID instead of using the direct payment button.</span>
                    </AlertDescription>
                </Alert>
            </div>
            <DialogFooter className="flex-col sm:flex-row sm:justify-between w-full">
                <Button onClick={() => setStep(1)} variant="outline" className="w-full sm:w-auto">
                    Cancel
                </Button>
                <DialogClose asChild>
                    <Button onClick={() => setStep(1)} className="w-full sm:w-auto">
                       I have paid
                    </Button>
                </DialogClose>
            </DialogFooter>
           </>
        )}
      </DialogContent>
    </Dialog>
  );
}
