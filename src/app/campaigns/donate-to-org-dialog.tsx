
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization, User } from "@/services/types";

// In a real implementation, the key would be fetched from a secure environment variable
// and the Razorpay object would be loaded conditionally.
declare const Razorpay: any;


interface DonateToOrgDialogProps {
  children: React.ReactNode;
  organization: Organization | null;
  user: User | null;
}

export function DonateToOrgDialog({ children, organization, user }: DonateToOrgDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(1000); // Default amount
  const { toast } = useToast();

  if (!organization) return <>{children}</>;

  const handlePayment = async () => {
    setIsSubmitting(true);
    toast({ title: "Initiating Payment...", description: "Please wait while we create a secure payment order." });

    try {
        // In a real implementation, this would call a server action
        // to create a Razorpay order and get the order ID.
        // const { order } = await createRazorpayOrder({ amount });
        
        // For this prototype, we'll simulate the order creation.
        const simulatedOrderId = `order_${Math.random().toString(36).substring(2, 10)}`;
        console.log(`Simulated Razorpay Order ID: ${simulatedOrderId}`);


        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
            amount: amount * 100, // Amount is in currency subunits. Default currency is INR.
            currency: "INR",
            name: organization.name,
            description: "Donation to General Fund",
            image: "/logo.svg", // A reference to your logo
            order_id: simulatedOrderId, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
            handler: function (response: any){
                toast({ 
                    variant: 'success',
                    title: "Payment Successful!", 
                    description: `Thank you for your generous donation. Payment ID: ${response.razorpay_payment_id}`
                });
                // Here you would call a server action to verify the payment signature
                // and update your database.
            },
            prefill: {
                name: user?.name || "Anonymous Donor",
                email: user?.email,
                contact: user?.phone
            },
            notes: {
                address: organization.address
            },
            theme: {
                color: "#166534" // Primary color from your theme
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response: any){
                toast({
                    variant: 'destructive',
                    title: "Payment Failed",
                    description: `Error: ${response.error.description}`
                });
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
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Secure Donation</DialogTitle>
          <DialogDescription>
            Your contribution will support the organization's mission and future cases. All payments are processed securely.
          </DialogDescription>
        </DialogHeader>
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
            <p className="text-xs text-muted-foreground text-center">
                You will be redirected to Razorpay to complete your payment securely.
            </p>
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
