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

interface LetterheadDocumentProps {
  organization: Organization;
}

// Helper to convert image URL to Base64
async function getBase64FromUrl(url: string): Promise<string> {
  // We use a proxy or serverless function if direct fetch is blocked by CORS.
  // For this context, we assume a direct fetch can work if CORS is configured on Firebase Storage.
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function LetterheadDocument({ organization }: LetterheadDocumentProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const letterheadRef = useRef<HTMLDivElement>(null);
  const [logoDataUri, setLogoDataUri] = useState<string | undefined>(undefined);
  const [loadingLogo, setLoadingLogo] = useState(true);

  useEffect(() => {
    const fetchAndConvertLogo = async () => {
      setLoadingLogo(true);
      if (organization.logoUrl) {
        try {
          const dataUri = await getBase64FromUrl(organization.logoUrl);
          setLogoDataUri(dataUri);
        } catch (error) {
          console.error("Failed to fetch and convert logo:", error);
          toast({
            variant: "destructive",
            title: "Could not load logo",
            description: "There was an error loading the organization's logo for the preview. The downloaded PDF may be affected."
          });
        }
      }
      setLoadingLogo(false);
    };
    fetchAndConvertLogo();
  }, [organization.logoUrl, toast]);


  const handleDownload = async () => {
    if (!letterheadRef.current) return;
    
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(letterheadRef.current, {
          scale: 3, // Increase scale for better resolution
          useCORS: true, // Crucial for external images
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
                    {loadingLogo ? (
                        <div className="w-[210mm] min-h-[297mm] bg-white flex items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Letterhead 
                            ref={letterheadRef} 
                            organization={organization}
                            logoDataUri={logoDataUri}
                            watermarkDataUri={logoDataUri} // Use the same fetched logo for the watermark
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
