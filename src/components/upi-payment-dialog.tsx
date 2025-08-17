
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogProps,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { GooglePayLogo, PhonePeLogo, PaytmLogo } from './logo';

interface UpiPaymentDialogProps extends DialogProps {
    upiLink: string;
}

export function UpiPaymentDialog({ open, onOpenChange, upiLink }: UpiPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose your UPI App</DialogTitle>
          <DialogDescription>
            Select your preferred application to complete the payment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
            <Link href={upiLink} target="_blank" rel="noopener noreferrer">
                <div className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <GooglePayLogo className="h-12 w-auto"/>
                    <span className="text-xs font-medium">Google Pay</span>
                </div>
            </Link>
            <Link href={upiLink} target="_blank" rel="noopener noreferrer">
                 <div className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <PhonePeLogo className="h-12 w-auto"/>
                    <span className="text-xs font-medium">PhonePe</span>
                </div>
            </Link>
             <Link href={upiLink} target="_blank" rel="noopener noreferrer">
                 <div className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <PaytmLogo className="h-12 w-auto"/>
                    <span className="text-xs font-medium">Paytm</span>
                </div>
            </Link>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
