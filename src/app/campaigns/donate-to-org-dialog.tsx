
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

  if (!organization) return <>{children}</>;

  const handlePayment = async () => {
    setIsSubmitting(true);
    toast({ title: "Initiating Payment...", description: "Please wait while we create a secure payment order." });

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_TEST_KEY_ID') {
        toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Razorpay Key ID is not configured. Please add it to the .env file.",
        });
        setIsSubmitting(false);
        return;
    }


    try {
        // In a real implementation, this would call a server action
        // to create a Razorpay order and get the order ID.
        // const { order } = await createRazorpayOrder({ amount });
        
        // For this prototype, we'll simulate the order creation client-side.
        const simulatedOrderId = `order_${Date.now()}`;
        console.log(`Simulated Razorpay Order ID: ${simulatedOrderId}`);


        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: amount * 100, // Amount is in currency subunits.
            currency: "INR",
            name: organization.name,
            description: "Donation to General Fund",
            image: "/logo.svg",
            order_id: simulatedOrderId,
            handler: function (response: any){
                toast({ 
                    variant: 'success',
                    title: "Payment Successful!", 
                    description: `Thank you! Payment ID: ${response.razorpay_payment_id}`
                });
                // TODO: Call a server action here to verify the payment signature
                // and update the donations database with the new record.
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
        // Razorpay handles the modal, so we can set submitting to false immediately.
        setIsSubmitting(false);
    }
  };


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Secure Donation</DialogTitle>
          <DialogDescription>
            Your contribution will support the organization's mission. All payments are processed securely via Razorpay.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>You are in Test Mode</AlertTitle>
                <AlertDescription>
                   You can use Razorpay's official test cards or UPI IDs to test the payment flow. No real money will be charged.
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
        </div>
        <DialogFooter>
          <Button onClick={handlePayment} className="w-full" size="lg" disabled={isSubmitting || amount <= 0}>
             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Proceed to Pay ₹{amount.toLocaleString()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
