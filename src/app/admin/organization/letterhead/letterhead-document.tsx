
"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/services/types";
import { Letterhead } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface LetterheadDocumentProps {
  organization: Organization;
}

export function LetterheadDocument({ organization }: LetterheadDocumentProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const letterheadRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!letterheadRef.current) return;
    
    setIsGenerating(true);

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(letterheadRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Standard A4 dimensions in points (pt), then converted to px for jspdf
      const A4_WIDTH_PT = 595.28;
      const A4_HEIGHT_PT = 841.89;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const canvasAspectRatio = canvas.width / canvas.height;
      const a4AspectRatio = A4_WIDTH_PT / A4_HEIGHT_PT;

      let pdfWidth = A4_WIDTH_PT;
      let pdfHeight = A4_HEIGHT_PT;
      
      if (canvasAspectRatio > a4AspectRatio) {
        pdfHeight = pdfWidth / canvasAspectRatio;
      } else {
        pdfWidth = pdfHeight * canvasAspectRatio;
      }

      pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_PT, A4_HEIGHT_PT);
      
      const pdfDataUri = pdf.output('datauristring');
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `Letterhead-${organization.name.replace(/\s/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
          variant: 'success',
          title: "Download Started",
          description: "Your letterhead is being downloaded."
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

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Letterhead</h2>
             <Button onClick={handleDownload} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download as PDF
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Letterhead Preview</CardTitle>
                <CardDescription>
                    This is a preview of the official organization letterhead. Click the download button to save it as a PDF. The content inside the letter is placeholder text.
                </CardDescription>
            </CardHeader>
            <CardContent className="bg-gray-200 p-8 flex justify-center">
                <div className="transform scale-90 origin-top">
                    <Letterhead ref={letterheadRef} organization={organization} />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
