
"use client";

import { useRef, useState } from "react";
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
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Donation, User } from "@/services/types";
import { DonationReceipt } from "./donation-receipt";

interface DonationReceiptDialogProps {
  donation: Donation;
  user: User;
}

export function DonationReceiptDialog({ donation, user }: DonationReceiptDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    setIsGenerating(true);

    try {
      // Dynamically import libraries only on the client-side
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Use data URI for mobile-friendly download
      const pdfDataUri = pdf.output('datauristring');

      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `Donation-Receipt-${donation.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
          variant: 'success',
          title: "Download Started",
          description: "Your receipt is being downloaded."
      });
    } catch (e) {
      console.error("Error generating PDF", e);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "An error occurred while generating the PDF.",
      });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const canDownload = donation.status === 'Verified' || donation.status === 'Allocated';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canDownload} className="w-full justify-start text-xs">
          <Download className="mr-2 h-3 w-3" />
          Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Donation Receipt</DialogTitle>
          <DialogDescription>
            This is a preview of your donation receipt. Click download to save it as a PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-2 bg-gray-200">
             <DonationReceipt ref={receiptRef} donation={donation} user={user} />
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="secondary">Close</Button>
            </DialogClose>
            <Button onClick={handleDownload} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
