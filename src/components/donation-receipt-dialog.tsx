

"use client";

import { useRef, useState, useEffect } from "react";
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
import type { Donation, User, Organization } from "@/services/types";
import { DonationReceipt } from "./donation-receipt";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface DonationReceiptDialogProps {
  donation: Donation;
  user: User;
  organization: Organization | null;
}

export function DonationReceiptDialog({ donation, user, organization }: DonationReceiptDialogProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(receiptRef.current, { 
          scale: 3, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      
      const A4_WIDTH_PT = 595.28;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = A4_WIDTH_PT;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Donation-Receipt-${donation.id}.pdf`);

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
  
  const canDownload = (donation.status === 'Verified' || donation.status === 'Allocated') && !!organization;

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
          <DialogTitle className="text-primary">Donation Receipt</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This is a preview of your donation receipt. Click download to save it as a PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-2 bg-gray-200">
            {organization ? (
                <DonationReceipt ref={receiptRef} donation={donation} user={user} organization={organization} />
            ) : (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div>
            )}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="secondary">Close</Button>
            </DialogClose>
            <Button onClick={handleDownload} disabled={isGenerating || !organization}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
