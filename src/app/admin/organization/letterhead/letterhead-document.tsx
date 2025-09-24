
"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/services/types";
import { Letterhead } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";

interface LetterheadDocumentProps {
  organization: Organization;
  logoDataUri?: string;
}

export function LetterheadDocument({ organization, logoDataUri }: LetterheadDocumentProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateGenerating, setIsTemplateGenerating] = useState(false);
  
  const letterheadRef = useRef<HTMLDivElement>(null);
  const letterheadContentRef = useRef<HTMLDivElement>(null); // Ref for text content only
  const templateRef = useRef<HTMLDivElement>(null);
  const templateContentRef = useRef<HTMLDivElement>(null); // Ref for template text content

  const generatePdf = async (isTemplate: boolean = false) => {
    if (!logoDataUri) {
        toast({ variant: 'destructive', title: "Error", description: "Letterhead logo is not ready. The logo URL might be invalid or inaccessible." });
        return;
    }
    
    const setLoading = isTemplate ? setIsTemplateGenerating : setIsGenerating;
    setLoading(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const A4_WIDTH_PT = pdf.internal.pageSize.getWidth();
      const A4_HEIGHT_PT = pdf.internal.pageSize.getHeight();
      const margin = 45;

      // --- 1. Watermark (Faint, Background) ---
      const watermarkProps = pdf.getImageProperties(logoDataUri);
      const watermarkWidth = 400;
      const watermarkHeight = (watermarkProps.height * watermarkWidth) / watermarkProps.width;
      const watermarkX = (A4_WIDTH_PT - watermarkWidth) / 2;
      const watermarkY = (A4_HEIGHT_PT - watermarkHeight) / 2;
      
      pdf.setGState(new (pdf as any).GState({ opacity: 0.08 }));
      pdf.addImage(logoDataUri, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // --- 2. Header ---
      // Logo
      const logoWidth = 96;
      const logoHeight = (watermarkProps.height * logoWidth) / watermarkProps.width;
      pdf.addImage(logoDataUri, 'PNG', margin, 40, logoWidth, logoHeight);

      // Organization Title
      const textX = margin + logoWidth + 20;
      const orgInfo = organization.footer!.organizationInfo;
      pdf.setFont('Helvetica', 'bold');
      pdf.setTextColor('#16a34a'); // Primary Green
      pdf.setFontSize(28);
      pdf.text(orgInfo.titleLine1.toUpperCase(), textX, 70);
      
      pdf.setTextColor('#ca8a04'); // Accent Gold
      pdf.text(orgInfo.titleLine2.toUpperCase(), textX, 100);

      pdf.setTextColor('#16a34a'); // Primary Green
      pdf.setFontSize(22);
      pdf.text(orgInfo.titleLine3.toUpperCase(), textX, 125);
      
      // Address and Contact under title
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      pdf.text(`${organization.address}, ${organization.city}`, textX, 145);
      pdf.text(`Email: ${organization.contactEmail} | Phone: ${organization.contactPhone}`, textX, 158);

      // Header Line
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(1.5);
      pdf.line(margin, 180, A4_WIDTH_PT - margin, 180);

      // --- 3. Body Content ---
      if (!isTemplate) {
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(11);
        pdf.text('Date: ', margin, 220);
      }
      
      // --- 4. Footer ---
      const footerY = A4_HEIGHT_PT - 40;
      pdf.setFont('Helvetica', 'normal');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      
      const footerLine1 = `Reg No: ${organization.registrationNumber} | PAN: ${organization.panNumber}`;
      const footerLine2 = `${organization.website}`;
      
      pdf.text(footerLine1, A4_WIDTH_PT / 2, footerY, { align: 'center' });
      pdf.text(footerLine2, A4_WIDTH_PT / 2, footerY + 12, { align: 'center' });


      const fileName = isTemplate 
        ? `Letterhead-Template-${organization.name.replace(/\s/g, '-')}.pdf`
        : `Letterhead-${organization.name.replace(/\s/g, '-')}.pdf`;

      pdf.save(fileName);
      
      toast({
          variant: 'success',
          title: "Download Started",
          description: `Your ${isTemplate ? 'template' : ''} letterhead is being downloaded.`,
      });
    } catch (e) {
      console.error("Error generating PDF", e);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "An error occurred while generating the PDF. Please check the console for details.",
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Letterhead</h2>
             <div className="flex gap-2">
                <Button onClick={() => generatePdf(true)} disabled={isTemplateGenerating || !logoDataUri}>
                    {isTemplateGenerating || !logoDataUri ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Download Template
                </Button>
                <Button onClick={() => generatePdf(false)} disabled={isGenerating || !logoDataUri}>
                    {isGenerating || !logoDataUri ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download as PDF
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Letterhead Preview</CardTitle>
                <CardDescription>
                    This is a preview of the official organization letterhead. Click the download button to save it as a PDF.
                </CardDescription>
            </CardHeader>
            <CardContent className="bg-gray-200 p-8 flex justify-center">
                <div className="transform scale-90 origin-top">
                    {!logoDataUri ? (
                         <div className="w-[210mm] min-h-[297mm] bg-white flex items-center justify-center shadow-lg">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                             {/* Visible preview */}
                            <Letterhead 
                                ref={letterheadRef}
                                organization={organization}
                                logoDataUri={logoDataUri}
                            />
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
