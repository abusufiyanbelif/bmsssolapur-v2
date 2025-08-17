
"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/services/types";
import { PayNowFormValues } from "@/app/donate/page";
import Image from "next/image";
import { Download, Copy, Check, X, HandHeart } from "lucide-react";
import { useRouter } from "next/navigation";
import { UpiPaymentDialog } from "./upi-payment-dialog";


interface QrCodeDialogProps extends DialogProps {
  donationDetails: PayNowFormValues;
  organization: Organization;
}

export function QrCodeDialog({ open, onOpenChange, donationDetails, organization }: QrCodeDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [hasCopied, setHasCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isUpiDialogOpen, setIsUpiDialogOpen] = useState(false);

    const upiLink = `upi://pay?pa=${organization.upiId}&pn=${encodeURIComponent(organization.name)}&am=${donationDetails.amount}&cu=INR&tn=Donation for ${encodeURIComponent(donationDetails.purpose)}`;

    const handleDownload = async () => {
        if (!organization.qrCodeUrl) return;
        setIsDownloading(true);
        try {
            const response = await fetch(`/api/download-image?url=${encodeURIComponent(organization.qrCodeUrl)}`);
            if (!response.ok) throw new Error('Failed to download image from server.');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `bms-qr-code.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            toast({ title: "Download Started", description: "The QR code image is being downloaded." });
        } catch (error) {
            toast({ variant: "destructive", title: "Download Failed", description: "Could not download the QR code image." });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopy = () => {
        if (!organization.upiId) return;
        navigator.clipboard.writeText(organization.upiId);
        setHasCopied(true);
        toast({ title: "UPI ID Copied!", description: "The UPI ID has been copied to your clipboard." });
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleDonationComplete = () => {
        if(onOpenChange) onOpenChange(false);
        router.push("/my-donations");
        toast({
            variant: "success",
            title: "Donation Initiated",
            description: "Thank you! Your donation will be marked as 'Verified' by our team shortly."
        });
    }

    if (!organization.upiId || !organization.qrCodeUrl) {
        return (
             <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Payment Unavailable</DialogTitle>
                        <DialogDescription>
                            Online payments are currently unavailable. Please contact the organization directly.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle>Scan to Pay or Use UPI App</DialogTitle>
                <DialogDescription>
                    Use any UPI app to complete your donation of <span className="font-bold">₹{donationDetails.amount.toLocaleString()}</span>.
                </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <div className="relative w-56 h-56">
                        <Image
                        src={organization.qrCodeUrl}
                        alt="UPI QR Code"
                        fill
                        className="object-contain rounded-md"
                        data-ai-hint="qr code"
                        />
                    </div>
                    <div className="flex items-center w-full gap-2 rounded-lg bg-muted p-3">
                        <p className="font-mono text-sm flex-grow overflow-x-auto whitespace-nowrap">{organization.upiId}</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="flex-shrink-0"
                        >
                            {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Button onClick={() => setIsUpiDialogOpen(true)} className="w-full" size="lg">
                        <HandHeart className="mr-2 h-4 w-4" />Pay with UPI App
                    </Button>
                    <Button variant="secondary" onClick={handleDownload} disabled={isDownloading}>
                        <Download className="mr-2 h-4 w-4" /> Download QR
                    </Button>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" className="w-full" onClick={handleDonationComplete}>
                    I have completed the payment
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
            
            <UpiPaymentDialog
                open={isUpiDialogOpen}
                onOpenChange={setIsUpiDialogOpen}
                upiLink={upiLink}
            />
        </>
    );
}
