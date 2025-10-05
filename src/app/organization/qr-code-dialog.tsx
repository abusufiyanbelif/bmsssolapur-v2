
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
import Image from "next/image";
import { Download, Copy, Check, X, HandHeart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Organization } from "@/services/types";

interface QrCodeDialogProps {
  children: React.ReactNode;
  organization: Organization;
}

export function QrCodeDialog({
  children,
  organization,
}: QrCodeDialogProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!organization.qrCodeUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(organization.qrCodeUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch QR code: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bms-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast({
        title: "Download Started",
        description: "The QR code image is being downloaded.",
      });
    } catch (error) {
      console.error("Failed to download QR code", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the QR code image. Please try again or right-click to save.",
      });
    } finally {
        setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    if (!organization.upiId) return;
    navigator.clipboard.writeText(organization.upiId);
    setHasCopied(true);
    toast({
      title: "UPI ID Copied!",
      description: "The UPI ID has been copied to your clipboard.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Scan to Pay</DialogTitle>
          <DialogDescription>
            Use any UPI app to scan the code below to donate to {organization.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="relative w-56 h-56">
            <Image
              src={organization.qrCodeUrl!}
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
        <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                 Download
            </Button>
            <DialogClose asChild>
                <Button variant="outline">
                    <X className="mr-2 h-4 w-4" />Cancel
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
