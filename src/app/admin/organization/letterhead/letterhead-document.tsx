
"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Organization } from "@/services/types";
import { Letterhead } from "@/components/letterhead";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getImageAsBase64 } from "./actions";

interface LetterheadDocumentProps {
  organization: Organization;
}

export function LetterheadDocument({ organization }: LetterheadDocumentProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoDataUri, setLogoDataUri] = useState<string | undefined>(undefined);
  const [loadingLogo, setLoadingLogo] = useState(true);
  const letterheadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAndConvertLogo = async () => {
      if (organization.logoUrl) {
        try {
          const base64 = await getImageAsBase64(organization.logoUrl);
          setLogoDataUri(base64);
        } catch (e) {
          console.error("Failed to load logo for letterhead:", e);
          toast({
              variant: "destructive",
              title: "Logo Load Failed",
              description: "Could not load the organization logo for the preview."
          });
        }
      }
      setLoadingLogo(false);
    };
    fetchAndConvertLogo();
  }, [organization.logoUrl, toast]);


  const handleDownload = async () => {
    if (!letterheadRef.current || !logoDataUri) {
        toast({ variant: 'destructive', title: "Error", description: "Letterhead content or logo is not ready." });
        return;
    };
    
    setIsGenerating(true);

    try {
      // 1. Capture the HTML content (text, layout) as a canvas
      const canvas = await html2canvas(letterheadRef.current, {
          scale: 3, 
          useCORS: true,
          logging: false,
          backgroundColor: null, // Make background transparent
      });
      
      const contentImgData = canvas.toDataURL('image/png');
      
      const A4_WIDTH_PT = 595.28;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // 2. Add watermark image directly to PDF first (so it's in the background)
      const watermarkProps = pdf.getImageProperties(logoDataUri);
      const watermarkWidth = 400;
      const watermarkHeight = (watermarkProps.height * watermarkWidth) / watermarkProps.width;
      const watermarkX = (A4_WIDTH_PT - watermarkWidth) / 2;
      const watermarkY = (pdf.internal.pageSize.getHeight() - watermarkHeight) / 2;
      pdf.addImage(logoDataUri, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight, undefined, 'FAST');
      
      // 3. Add the captured HTML content on top of the watermark
      const contentImgProps = pdf.getImageProperties(contentImgData);
      const contentWidth = A4_WIDTH_PT;
      const contentHeight = (contentImgProps.height * contentWidth) / contentImgProps.width;
      pdf.addImage(contentImgData, 'PNG', 0, 0, contentWidth, contentHeight);

      // 4. Add the header logo separately to maintain quality
      const logoProps = pdf.getImageProperties(logoDataUri);
      const logoWidth = 80;
      const logoHeight = (logoProps.height * logoWidth) / logoProps.width;
      pdf.addImage(logoDataUri, 'PNG', 45, 45, logoWidth, logoHeight);

      pdf.save(`Letterhead-${organization.name.replace(/\s/g, '-')}.pdf`);
      
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
        description: "An error occurred while generating the PDF. Please check the console for details.",
      });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Organization Letterhead</h2>
             <Button onClick={handleDownload} disabled={isGenerating || loadingLogo}>
                {isGenerating || loadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
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
                    {loadingLogo ? (
                         <div className="w-[210mm] min-h-[297mm] bg-white flex items-center justify-center shadow-lg">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Letterhead 
                            ref={letterheadRef} 
                            organization={organization}
                            logoDataUri={logoDataUri}
                            watermarkDataUri={logoDataUri}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

