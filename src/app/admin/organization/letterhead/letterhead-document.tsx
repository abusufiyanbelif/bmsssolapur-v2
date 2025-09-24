
"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/services/types";
import { Letterhead } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  const generatePdf = async (contentElement: HTMLElement | null, isTemplate: boolean = false) => {
    if (!contentElement || !logoDataUri) {
        toast({ variant: 'destructive', title: "Error", description: "Letterhead content or logo is not ready. The logo URL might be invalid or inaccessible." });
        return;
    }
    
    const setLoading = isTemplate ? setIsTemplateGenerating : setIsGenerating;
    setLoading(true);

    try {
      // Step 1: Capture the letter content only using html2canvas
      const canvas = await html2canvas(contentElement, {
          scale: 3, 
          useCORS: true,
          logging: false,
          backgroundColor: null, // Transparent background
      });
      
      const contentImgData = canvas.toDataURL('image/png');
      
      const A4_WIDTH_PT = 595.28;
      const A4_HEIGHT_PT = 841.89;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // Step 2: Add watermark faintly BEFORE text
      const watermarkProps = pdf.getImageProperties(logoDataUri);
      const watermarkWidth = 400;
      const watermarkHeight = (watermarkProps.height * watermarkWidth) / watermarkProps.width;
      const watermarkX = (A4_WIDTH_PT - watermarkWidth) / 2;
      const watermarkY = (A4_HEIGHT_PT - watermarkHeight) / 2;
      
      pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.addImage(logoDataUri, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // Step 3: Add the captured HTML content on top of the watermark
      const contentImgProps = pdf.getImageProperties(contentImgData);
      const contentWidth = A4_WIDTH_PT;
      const contentHeight = (contentImgProps.height * contentWidth) / contentImgProps.width;
      pdf.addImage(contentImgData, 'PNG', 0, 0, contentWidth, contentHeight);

      // Step 4: Add the logo on top
      const logoWidth = 100; // Increased logo size
      const logoHeight = (watermarkProps.height * logoWidth) / watermarkProps.width;
      pdf.addImage(logoDataUri, 'PNG', 45, 40, logoWidth, logoHeight);

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
                <Button onClick={() => generatePdf(templateContentRef.current, true)} disabled={isTemplateGenerating || !logoDataUri}>
                    {isTemplateGenerating || !logoDataUri ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Download Template
                </Button>
                <Button onClick={() => generatePdf(letterheadContentRef.current, false)} disabled={isGenerating || !logoDataUri}>
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
                                contentRef={letterheadContentRef}
                                organization={organization}
                                logoDataUri={logoDataUri}
                            />
                             {/* Hidden template for PDF generation */}
                            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                                <Letterhead
                                    ref={templateRef}
                                    contentRef={templateContentRef}
                                    organization={organization}
                                    logoDataUri={logoDataUri}
                                    isTemplate={true}
                                />
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
