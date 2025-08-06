
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

// This makes the Razorpay object available in the window scope
declare const Razorpay: any;


interface DonateToOrgDialogProps {
  children: React.ReactNode;
  organization: Organization | null;
  user: User | null;
}

export function DonateToOrgDialog({ children, organization, user }: DonateToOrgDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(100); // Default amount
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState(false);

  if (!organization) return <>{children}</>;
  
  const upiLink = `upi://pay?pa=${organization.upiId}&pn=${encodeURIComponent(organization.name)}&cu=INR&am=${amount}`;
  const upiPhoneLink = `upi://pay?pa=${organization.contactPhone}@paytm&pn=${encodeURIComponent(organization.name)}&cu=INR&am=${amount}&tn=Donation to Baitulmal`;

  const handleRazorpayPayment = async () => {
    setIsSubmitting(true);
    toast({ title: "Initiating Payment...", description: "Please wait while we create a secure payment order." });
    
    const razorpayKey = 'rzp_test_PSMiH7GRjuuPkf';

    try {
        const options = {
            key: razorpayKey,
            amount: amount * 100,
            currency: "INR",
            name: organization.name,
            description: "Donation to General Fund",
            image: "/logo.svg",
            handler: function (response: any){
                toast({ 
                    variant: 'success',
                    title: "Test Payment Successful!", 
                    description: `This is a test. Payment ID: ${response.razorpay_payment_id}`
                });
                console.log("Razorpay Response:", response);
            },
            prefill: {
                name: user?.name || "Anonymous Donor",
                email: user?.email,
                contact: user?.phone
            },
            notes: {
                address: organization.address,
                userId: user?.id || 'guest'
            },
            theme: {
                color: "#166534"
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response: any){
                toast({
                    variant: 'destructive',
                    title: "Payment Failed",
                    description: `Error: ${response.error.description}`
                });
                console.error("Razorpay Payment Failed:", response.error);
        });
        rzp.open();

    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not initiate payment. Please try again later.",
        });
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={paymentStep} onOpenChange={setPaymentStep}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Secure Donation</DialogTitle>
          <DialogDescription>
            Your contribution will support the organization's mission. All payments are processed securely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>You are in Test Mode</AlertTitle>
                <AlertDescription>
                   You can use test card details or test UPI IDs to test the payment flow. No real money will be charged.
                </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="font-semibold text-lg"
                />
            </div>
            
            <Separator />
            
            <p className="text-sm font-semibold text-center text-muted-foreground">Choose a Payment Method</p>

            <div className="space-y-4">
                <Button onClick={handleRazorpayPayment} className="w-full" size="lg" disabled={isSubmitting || amount <= 0}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Pay with Card, UPI, or Wallets
                </Button>
                
                 <div className="flex flex-col items-center gap-4">
                    <p className="text-xs text-muted-foreground">Or pay directly:</p>
                    <a href={upiLink} className="block cursor-pointer border rounded-lg p-4 bg-muted/50 hover:bg-muted transition-colors">
                        <div className="relative w-40 h-40">
                             <Image src={organization.qrCodeUrl || 'https://placehold.co/400x400.png'} alt="UPI QR Code" fill className="object-contain rounded-md" data-ai-hint="qr code" />
                        </div>
                        <p className="text-center text-sm font-bold mt-2">{organization.upiId}</p>
                    </a>
                </div>
            </div>
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground text-center w-full">By continuing, you agree to our terms of service.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
