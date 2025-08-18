
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Download, Copy, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface QrCodeDialogProps {
  children: React.ReactNode;
  qrCodeUrl: string;
  upiId: string;
  orgName: string;
}

export function QrCodeDialog({
  children,
  qrCodeUrl,
  upiId,
  orgName,
}: QrCodeDialogProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(qrCodeUrl);
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
    navigator.clipboard.writeText(upiId);
    setHasCopied(true);
    toast({
      title: "UPI ID Copied!",
      description: "The UPI ID has been copied to your clipboard.",
    });
    setTimeout(() => setHasCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Scan to Pay</DialogTitle>
          <DialogDescription>
            Use any UPI app to scan the code below to donate to {orgName}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="relative w-56 h-56">
            <Image
              src={qrCodeUrl}
              alt="UPI QR Code"
              fill
              className="object-contain rounded-md"
              data-ai-hint="qr code"
            />
          </div>
          <div className="flex items-center w-full gap-2 rounded-lg bg-muted p-3">
             <p className="font-mono text-sm flex-grow overflow-x-auto whitespace-nowrap">{upiId}</p>
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
